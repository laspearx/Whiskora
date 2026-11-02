// One monitor run with injected I/O (fetch, clock, sleep, env) so the whole path is testable with mocks.
// Modes:
//   send    — the real thing: state advances, messages are posted, undelivered ones stay in the outbox.
//   preview — (default dry run) shows what WOULD be posted (outbox + new) and returns the previous state UNCHANGED:
//             no incident is marked as alerted, the outbox is not touched, nothing counts as sent.
//   trial   — advances a SEPARATE trial state (to try thresholds over several runs); posts nothing, keeps that state's
//             outbox as it was. Never point it at the real state file.
import { httpCheck, releaseCheck, canaries } from './checks.mjs';
import { evaluate, emptyState } from './engine.mjs';
import { compose } from './compose.mjs';
import { deliver, queueWith, redact } from './discord.mjs';

export async function runOnce({ config, state, stateProblem = null, fetchImpl, now, sleep, env, mode = 'preview', log = () => {} }) {
  if (!['send', 'preview', 'trial'].includes(mode)) throw new Error(`unknown mode ${mode}`);
  const { shared, projects } = config;
  const d = shared.defaults;
  const prev = state || emptyState();
  const issues = [...(prev.pendingIssues || [])]; // delivery problems of the previous send run
  const canary = await canaries(shared.canaries, { fetchImpl, timeoutMs: d.timeoutMs });

  const results = [];
  for (const project of projects.filter((p) => p.enabled)) {
    await Promise.all(project.checks.map(async (check) => {
      try {
        const fn = check.type === 'release' ? releaseCheck : httpCheck;
        results.push({ project, check, kind: check.type, result: await fn(check, { fetchImpl, timeoutMs: d.timeoutMs }) });
      } catch (e) { issues.push(`${project.id}/${check.id}: monitor error ${e?.name || 'Error'}`); } // a bug here is the monitor's fault, not the site's
    }));
  }

  const t = now();
  const { state: next, events, monitorIssues } = evaluate(prev, { results, canary, issues, now: t, defaults: d, stateProblem });
  const messages = compose(events, config);
  const base = { checks: results.length, failing: results.filter((r) => !r.result.ok).length, events: events.length, messages: messages.length, monitorIssues: monitorIssues.length };

  if (mode !== 'send') {
    const queue = mode === 'preview' ? queueWith(prev.outbox, messages, { now: t, cfg: shared.delivery }).queue : messages;
    for (const m of queue) log(`[${mode}] would post → ${m.route}${m.attempts ? ` (from outbox, ${m.attempts} earlier attempt(s))` : ''}\n${m.content}`);
    log(redact(`summary ${JSON.stringify({ mode, ...base, wouldPost: queue.length, sent: 0 })}`));
    if (mode === 'preview') return { state: prev, stateChanged: false, events, messages, summary: { mode, ...base, sent: 0 }, exitCode: 0 };
    next.outbox = prev.outbox || []; next.pendingIssues = prev.pendingIssues || []; next.lastRunAt = t;
    return { state: next, stateChanged: true, events, messages, summary: { mode, ...base, sent: 0 }, exitCode: 0 };
  }

  const { queue, dropped } = queueWith(prev.outbox, messages, { now: t, cfg: shared.delivery });
  const out = await deliver(queue, { env, fetchImpl, sleep, now, cfg: shared.delivery, log });
  next.outbox = out.outbox;
  next.pendingIssues = [...out.issues, ...(dropped ? [`outbox: ${dropped} old message(s) dropped`] : [])];
  next.lastRunAt = t;
  const summary = { mode, ...base, sent: out.sent, kept: out.outbox.length, deliveryIssues: out.issues.length };
  log(redact(`summary ${JSON.stringify(summary)}`));
  // Non-zero only for monitor-side trouble that Discord may not have heard about (delivery failed): the runtime's own
  // failure notice is then the fallback channel. A site being down is a normal, successful run.
  return { state: next, stateChanged: true, events, messages, summary, exitCode: out.issues.length ? 1 : 0 };
}
