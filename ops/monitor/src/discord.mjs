// Discord webhook sender. The webhook URL comes only from the environment (runtime secret store) and is never logged,
// returned or stored. Handles: timeout, 429 (retry_after / Retry-After, bucket exhaustion), 5xx retry, invalid webhooks.
// Messages that cannot be delivered now stay in the outbox (state) for the next run, with an age / size cap.
const WEBHOOK = /^https:\/\/(?:discord\.com|discordapp\.com|ptb\.discord\.com|canary\.discord\.com)\/api\/webhooks\/\d+\/[\w-]+$/;
export const redact = (s) => String(s).replace(/https:\/\/[^\s]*discord(?:app)?\.com\/api\/webhooks\/[^\s"']*/gi, '[webhook]');

export async function deliver(queue, { env, fetchImpl, sleep, now, cfg, dryRun, log = () => {} }) {
  const startedAt = now();
  const remaining = () => cfg.budgetMs - (now() - startedAt);
  const nextAt = {};          // route → epoch ms when its bucket allows the next post
  const dead = new Set();      // routes found invalid in this run: stop using them (Discord: stop on 404)
  const outbox = [], issues = [];
  let sent = 0;

  for (const m of queue) {
    const keep = (why) => { outbox.push({ ...m, attempts: (m.attempts || 0) + 1, lastError: why }); };
    if (dryRun) { log(`[dry-run] → ${m.route}\n${m.content}`); sent++; continue; }
    if (dead.has(m.route)) { keep('route invalid this run'); continue; }
    const url = env[m.route];
    if (!url) { issues.push(`webhook not configured: ${m.route}`); dead.add(m.route); keep('not configured'); continue; }
    if (!WEBHOOK.test(url)) { issues.push(`webhook value of ${m.route} is not a Discord webhook URL`); dead.add(m.route); keep('bad value'); continue; }

    let done = false, attempt = 0, lastErr = '';
    while (!done && attempt < cfg.maxAttempts) {
      attempt++;
      const wait = Math.max(0, (nextAt[m.route] || 0) - now());
      if (wait > remaining()) { lastErr = 'rate limit wait beyond budget'; break; }
      if (wait) await sleep(wait);
      const ac = new AbortController(); const timer = setTimeout(() => ac.abort(), cfg.timeoutMs);
      let r;
      try {
        r = await fetchImpl(`${url}?wait=true`, {
          method: 'POST', signal: ac.signal, headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ content: m.content, allowed_mentions: { parse: [] }, username: 'Project HQ Monitor' }),
        });
      } catch (e) { lastErr = ac.signal.aborted ? 'timeout' : 'network'; clearTimeout(timer); if (remaining() > 1000) await sleep(Math.min(1000 * attempt, remaining())); continue; }
      clearTimeout(timer);
      const h = (k) => r.headers?.get?.(k);
      if (h('x-ratelimit-remaining') === '0' && h('x-ratelimit-reset-after')) nextAt[m.route] = now() + Math.ceil(parseFloat(h('x-ratelimit-reset-after')) * 1000);
      if (r.status >= 200 && r.status < 300) { done = true; sent++; break; }
      if (r.status === 429) {
        let ra = parseFloat(h('retry-after'));
        try { const b = await r.json(); if (b?.retry_after != null) ra = parseFloat(b.retry_after); } catch {}
        const ms = Math.ceil((Number.isFinite(ra) ? ra : 1) * 1000);
        nextAt[m.route] = now() + ms; lastErr = `429 retry_after ${ms} ms`;
        if (ms > remaining()) break;
        continue;
      }
      if (r.status === 401 || r.status === 403 || r.status === 404) { issues.push(`webhook ${m.route} rejected (${r.status}) — replace the secret`); dead.add(m.route); lastErr = `HTTP ${r.status}`; break; }
      if (r.status >= 500) { lastErr = `HTTP ${r.status}`; if (remaining() > 1000) await sleep(Math.min(1000 * attempt, remaining())); continue; }
      issues.push(`Discord refused a message on ${m.route} (HTTP ${r.status}) — dropped`); lastErr = 'dropped'; done = true; // 400: payload problem, retrying cannot help
    }
    if (!done) { keep(lastErr); issues.push(`not delivered on ${m.route}: ${lastErr}`); }
  }
  log(`delivery: ${sent} sent, ${outbox.length} kept for the next run`);
  return { sent, outbox, issues: issues.map(redact) };
}

// Outbox from earlier runs first (oldest first), capped by count and age.
export function queueWith(outbox, messages, { now, cfg }) {
  const fresh = (outbox || []).filter((m) => now - (m.createdAt || now) <= cfg.outboxMaxAgeMinutes * 60_000);
  const dropped = (outbox || []).length - fresh.length;
  const all = [...fresh, ...messages.map((m) => ({ ...m, createdAt: now }))];
  const over = Math.max(0, all.length - cfg.outboxMax);
  return { queue: all.slice(over), dropped: dropped + over };
}
