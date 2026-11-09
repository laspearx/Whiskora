// Production artifact only. No inherited app credentials or remote API origin.
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';

const cwd = fileURLToPath(new URL('../', import.meta.url));
await new Promise((accept, reject) => {
  const probe = createServer();
  probe.once('error', reject);
  probe.listen(3291, '127.0.0.1', () => probe.close(accept));
});
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start',
  '--hostname', '127.0.0.1', '-p', '3291'], {
  cwd, stdio: 'inherit', env: {
    PATH: process.env.PATH,
    NEXT_TELEMETRY_DISABLED: '1',
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:9',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'local-security-mock-key',
  },
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
