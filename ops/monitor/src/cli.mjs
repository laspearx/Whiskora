#!/usr/bin/env node
// usage: node ops/monitor/src/cli.mjs [--state <file>] [--send]
// Dry run by default: prints the messages it would post. Posting needs BOTH --send and MONITOR_SEND=1.
// Webhook URLs come only from environment variables named in monitor.json / project routes.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from './config.mjs';
import { runOnce } from './run.mjs';
import { emptyState } from './engine.mjs';
import { redact } from './discord.mjs';

const args = process.argv.slice(2);
const statePath = args.includes('--state') ? args[args.indexOf('--state') + 1] : 'monitor-state.json';
const send = args.includes('--send') && process.env.MONITOR_SEND === '1';
const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const log = (s) => console.log(redact(s));

let state = emptyState();
try { if (fs.existsSync(statePath)) state = JSON.parse(fs.readFileSync(statePath, 'utf8')); }
catch { state = emptyState(); state.pendingIssues = ['state file unreadable — started fresh']; }

try {
  const config = load(dir);
  log(`mode: ${send ? 'SEND' : 'dry-run'}; projects enabled: ${config.projects.filter((p) => p.enabled).map((p) => p.id).join(',') || 'none'}`);
  const r = await runOnce({ config, state, fetchImpl: fetch, now: Date.now, sleep: (ms) => new Promise((res) => setTimeout(res, ms)), env: process.env, dryRun: !send, log });
  fs.writeFileSync(statePath, JSON.stringify(r.state, null, 1));
  process.exitCode = r.exitCode;
} catch (e) {
  console.error(redact(`monitor failed: ${e?.name}: ${e?.message}`));
  process.exitCode = 1; // config error / bug → the runtime's failure notice is the signal
}
