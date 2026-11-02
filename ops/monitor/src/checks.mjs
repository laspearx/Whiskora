// Probes. Each returns a plain result; network trouble of the TARGET is a result (ok: false), not an exception.
const UA = 'project-hq-monitor/1 (+status check)';

async function timedFetch(fetchImpl, url, { timeoutMs, redirect = 'follow' }) {
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), timeoutMs); const start = Date.now();
  try {
    const r = await fetchImpl(url, { method: 'GET', redirect, signal: ac.signal, headers: { 'user-agent': UA, 'cache-control': 'no-cache' } });
    const body = await r.text();
    return { status: r.status, body, ms: Date.now() - start };
  } catch (e) {
    return { error: ac.signal.aborted ? 'timeout' : `network: ${e?.cause?.code || e?.name || 'error'}`, ms: Date.now() - start };
  } finally { clearTimeout(t); }
}

export async function httpCheck(check, { fetchImpl, timeoutMs }) {
  const r = await timedFetch(fetchImpl, check.url, { timeoutMs: check.timeoutMs || timeoutMs });
  if (r.error) return { ok: false, reason: r.error, ms: r.ms };
  const expect = check.expectStatus || [200];
  if (!expect.includes(r.status)) return { ok: false, reason: `HTTP ${r.status}`, status: r.status, ms: r.ms };
  if (check.contains && !r.body.includes(check.contains)) return { ok: false, reason: 'expected text missing', status: r.status, ms: r.ms };
  if (check.maxMs && r.ms > check.maxMs) return { ok: false, reason: `slow ${r.ms} ms > ${check.maxMs}`, status: r.status, ms: r.ms };
  return { ok: true, status: r.status, ms: r.ms };
}

const extract = (body, pattern) => (body.match(new RegExp(pattern)) || [])[1] || null;

export async function releaseCheck(check, { fetchImpl, timeoutMs }) {
  const r = await timedFetch(fetchImpl, check.url, { timeoutMs: check.timeoutMs || timeoutMs });
  if (r.error || r.status !== 200) return { ok: false, reason: r.error || `HTTP ${r.status}` };
  const served = extract(r.body, check.versionPattern);
  if (!served) return { ok: false, reason: 'version not found on page' };
  let expected = null, expectedError = null;
  if (check.expected) {
    const e = await timedFetch(fetchImpl, check.expected.url, { timeoutMs: check.timeoutMs || timeoutMs });
    if (e.error || e.status !== 200) expectedError = e.error || `HTTP ${e.status}`;
    else expected = extract(e.body, check.expected.versionPattern) || null;
    if (!expected && !expectedError) expectedError = 'version not found in source';
  }
  return { ok: true, served, expected, expectedError };
}

// Monitor self-check: the runner's own network. All canaries failing = the monitor cannot judge any site this run.
export async function canaries(urls, { fetchImpl, timeoutMs }) {
  if (!urls?.length) return { ok: true, failed: [] };
  const rs = await Promise.all(urls.map((u) => timedFetch(fetchImpl, u, { timeoutMs })));
  const failed = urls.filter((u, i) => rs[i].error || rs[i].status >= 500);
  return { ok: failed.length < urls.length, failed };
}
