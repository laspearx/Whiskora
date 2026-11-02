#!/usr/bin/env node
// usage:
//   node ops/monitor/src/cli.mjs [--state <file>]                        preview (default): reads the state if present,
//                                                                         prints what would be posted, WRITES NOTHING
//   node ops/monitor/src/cli.mjs --trial-state <file>                    trial: advances a separate trial state file
//   MONITOR_SEND=1 node ops/monitor/src/cli.mjs --state <file> --send [--first-run]
//                                                                         send: posts, saves the state
// --first-run: there was never a state (install) → a missing file is expected, no "state lost" notice.
// Webhook URLs come only from environment variables named in the config.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from './config.mjs';
import { runOnce } from './run.mjs';
import { parseState, serialize } from './state.mjs';
import { redact } from './discord.mjs';

const args = process.argv.slice(2);
const opt = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
const statePath = opt('--state') || 'monitor-state.json';
const trialPath = opt('--trial-state');
const mode = args.includes('--send') && process.env.MONITOR_SEND === '1' ? 'send' : trialPath ? 'trial' : 'preview';
const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const log = (s) => console.log(redact(s));

try {
  if (mode === 'trial' && path.resolve(trialPath) === path.resolve(statePath)) throw new Error('--trial-state must not be the real state file');
  const file = mode === 'trial' ? trialPath : statePath;
  const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  const { state, problem } = parseState(text, { firstRun: args.includes('--first-run') || mode === 'trial' });
  if (problem) log(`state: ${problem} (${file}) — starting fresh; the run reports what that loses`);
  const config = load(dir);
  log(`mode: ${mode}; projects enabled: ${config.projects.filter((p) => p.enabled).map((p) => p.id).join(',') || 'none'}`);
  const r = await runOnce({ config, state, stateProblem: problem, fetchImpl: fetch, now: Date.now, sleep: (ms) => new Promise((res) => setTimeout(res, ms)), env: process.env, mode, log });
  if (r.stateChanged) {
    const out = serialize(r.state);
    if (out !== text) { fs.writeFileSync(file, out); log(`state saved (${file})`); } else log('state unchanged');
  }
  process.exitCode = r.exitCode;
} catch (e) {
  console.error(redact(`monitor failed: ${e?.name}: ${e?.message}`));
  process.exitCode = 1; // config error / bug → the runtime's failure notice is the signal
}
