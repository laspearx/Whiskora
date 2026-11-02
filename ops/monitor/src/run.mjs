// One monitor run with injected I/O (fetch, clock, sleep, env) so the whole path is testable with mocks.
import { httpCheck, releaseCheck, canaries } from './checks.mjs';
import { evaluate, emptyState } from './engine.mjs';
import { compose } from './compose.mjs';
import { deliver, queueWith, redact } from './discord.mjs';

export async function runOnce({ config, state, fetchImpl, now, sleep, env, dryRun, log = () => {} }) {
  const { shared, projects } = config;
  const d = shared.defaults;
  const issues = [...(state?.pendingIssues || [])]; // delivery problems of the previous run
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
  const { state: next, events, monitorIssues } = evaluate(state || emptyState(), { results, canary, issues, now: t, defaults: d });
  const messages = compose(events, config);
  const { queue, dropped } = queueWith(next.outbox, messages, { now: t, cfg: shared.delivery });
  const out = await deliver(queue, { env, fetchImpl, sleep, now, cfg: shared.delivery, dryRun, log });
  next.outbox = out.outbox;
  next.pendingIssues = [...out.issues, ...(dropped ? [`outbox: ${dropped} old message(s) dropped`] : [])];
  next.lastRunAt = t;
  const summary = { checks: results.length, failing: results.filter((r) => !r.result.ok).length, events: events.length, messages: messages.length, sent: out.sent, kept: out.outbox.length, monitorIssues: monitorIssues.length, deliveryIssues: out.issues.length };
  log(redact(`summary ${JSON.stringify(summary)}`));
  // Non-zero only for monitor-side trouble that Discord may not have heard about (delivery failed): the runtime's own
  // failure notice is then the fallback channel. A site being down is a normal, successful run.
  return { state: next, events, messages, summary, exitCode: out.issues.length ? 1 : 0 };
}
