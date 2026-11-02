// Pure state machine: (previous state, this run's results, now) → (next state, events). No I/O.
// One message only on a change (down / recovered) or on a slow reminder while still down — never for a passing check.
const MIN = 60_000;
export const emptyState = () => ({ v: 1, checks: {}, releases: {}, monitor: null, outbox: [] });

// Generic up/down machine with thresholds: `failThreshold` consecutive failures → down; `recoverThreshold` passes → ok.
// Counters are capped at their threshold so a steady state serializes to the same text run after run.
export function step(prev, ok, reason, now, d) {
  const st = { status: 'unknown', fails: 0, oks: 0, ...(prev || {}) };
  if (ok) {
    const lastReason = st.reason;
    st.oks = Math.min(st.oks + 1, d.recoverThreshold); st.fails = 0; st.firstFailAt = null; delete st.reason;
    if (st.status === 'down' && st.oks >= d.recoverThreshold) {
      const ev = { type: 'recovered', since: st.since, durationMin: Math.round((now - st.since) / MIN), lastReason };
      return { st: { status: 'ok', fails: 0, oks: st.oks }, ev };
    }
    if (st.status !== 'down') st.status = 'ok';
    return { st, ev: null };
  }
  st.fails = Math.min(st.fails + 1, d.failThreshold); st.oks = 0; st.reason = reason; if (st.fails === 1 && st.status !== 'down') st.firstFailAt = now;
  if (st.status !== 'down' && st.fails >= d.failThreshold) {
    Object.assign(st, { status: 'down', since: st.firstFailAt, lastAlertAt: now });
    return { st, ev: { type: 'down', since: st.since, reason, fails: st.fails } };
  }
  if (st.status === 'down' && now - st.lastAlertAt >= d.repeatMinutes * MIN) {
    st.lastAlertAt = now;
    return { st, ev: { type: 'still_down', since: st.since, reason, durationMin: Math.round((now - st.since) / MIN) } };
  }
  return { st, ev: null };
}

// results: [{ project, check, kind: 'http' | 'release', result }]; canary: { ok, failed }; issues: monitor-side problems.
export function evaluate(prev, { results, canary, issues = [], now, defaults, stateProblem = null }) {
  const state = structuredClone(prev || emptyState());
  const events = [];
  if (stateProblem) events.push({ type: 'state_reset', scope: 'monitor', problem: stateProblem }); // immediate, no threshold
  const monitorIssues = [...issues];
  if (!canary.ok) monitorIssues.unshift(`network of the monitor: all canaries failed (${canary.failed.length})`);

  // Without a working network the run cannot judge any site: leave every site state untouched.
  if (canary.ok) {
    for (const { project, check, kind, result } of results) {
      const key = `${project.id}/${check.id}`;
      const d = { ...defaults, ...pick(check) };
      if (kind === 'http') {
        const { st, ev } = step(state.checks[key], result.ok, result.reason, now, d);
        state.checks[key] = st;
        if (ev) events.push({ ...ev, scope: 'site', project: project.id, check: check.id, url: check.url });
        continue;
      }
      // release: a page that does not load is the http checks' job (no second alert); a page that loads without a
      // readable version means the pattern / page changed → the monitor cannot see releases (monitor-side problem).
      if (!result.ok) { if (/version not found/.test(result.reason)) monitorIssues.push(`${key}: ${result.reason}`); continue; }

      if (result.expectedError) monitorIssues.push(`${key}: release source unreadable (${result.expectedError})`);
      const r = { ...(state.releases[key] || {}) };
      // Only what is observed: the served version changed, and whether it matches main. Not "deployed / built OK".
      if (r.served && r.served !== result.served) events.push({ type: 'release', scope: 'release', project: project.id, check: check.id, from: r.served, to: result.served, expected: result.expected ?? null, expectedError: result.expectedError ?? null });
      r.served = result.served;
      if (result.expected && result.expected !== result.served) {
        r.lagSince ??= now; r.expected = result.expected;
        if (!r.lagAlerted && now - r.lagSince >= d.releaseLagMinutes * MIN) {
          r.lagAlerted = true;
          events.push({ type: 'release_lag', scope: 'site', project: project.id, check: check.id, expected: result.expected, served: result.served, since: r.lagSince });
        }
      } else if (result.expected === result.served) {
        if (r.lagAlerted) events.push({ type: 'release_lag_cleared', scope: 'site', project: project.id, check: check.id, served: result.served });
        r.lagSince = null; r.lagAlerted = false; r.expected = result.expected;
      }
      state.releases[key] = r;
    }
  }

  const { st, ev } = step(state.monitor, monitorIssues.length === 0, monitorIssues.join('; ') || null, now, defaults);
  state.monitor = st;
  if (ev) events.push({ ...ev, scope: 'monitor', issues: monitorIssues });
  return { state, events, monitorIssues };
}

const pick = (c) => Object.fromEntries(['failThreshold', 'recoverThreshold', 'repeatMinutes', 'releaseLagMinutes'].filter((k) => c[k] != null).map((k) => [k, c[k]]));
