import { spawn } from 'node:child_process';
import { appendFileSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { constants } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const webDir = fileURLToPath(new URL('../', import.meta.url));
const port = 3217; // Reserved for this worktree's mock suite.
const logFile = process.env.VACCINE_MOCK_SERVER_LOG;
if (logFile) mkdirSync(dirname(logFile), { recursive: true });

function log(event, details = {}) {
  const line = JSON.stringify({ time: new Date().toISOString(), event, pid: process.pid, ...details });
  console.log(`[vaccine-mock-server] ${line}`);
  if (logFile) appendFileSync(logFile, `${line}\n`);
}

// Refuse a busy port. Never reuse, find, or stop another worktree's server.
try {
  await new Promise((accept, reject) => {
    const probe = createServer();
    probe.once('error', reject);
    probe.listen(port, '127.0.0.1', () => probe.close(accept));
  });
} catch (error) {
  log('port-unavailable', { port, code: error.code });
  process.exit(1);
}

// No inherited app credentials: the only API origin is the intercepted local mock.
const child = spawn(process.execPath, [
  resolve(webDir, 'node_modules/next/dist/bin/next'),
  'dev', '--webpack', '--hostname', '127.0.0.1', '-p', String(port),
], {
  cwd: webDir,
  stdio: 'inherit',
  env: {
    PATH: process.env.PATH,
    NEXT_TELEMETRY_DISABLED: '1',
    NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${port}/mock-supabase`,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'mock-public-key',
  },
});
log('next-spawned', { childPid: child.pid, port, cwd: webDir });

let forwardedSignal = null;
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    forwardedSignal = signal;
    log('wrapper-signal', { signal, childPid: child.pid });
    // Exact child created above only; no process-name matching or broad kill.
    if (child.exitCode === null && child.signalCode === null) child.kill(signal);
  });
}
child.on('error', error => {
  log('next-spawn-error', { code: error.code });
  process.exitCode = 1;
});
child.on('exit', (code, signal) => {
  log('next-exit', { childPid: child.pid, code, signal, forwardedSignal });
  process.exitCode = code ?? (signal ? 128 + constants.signals[signal] : 1);
});
process.on('exit', code => log('wrapper-exit', { code }));
