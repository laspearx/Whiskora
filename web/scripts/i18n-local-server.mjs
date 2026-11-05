// Local regression server: no inherited application credentials or remote backend.
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const production = process.env.I18N_PRODUCTION === '1';
const child = spawn(process.execPath, [
  resolve('node_modules/next/dist/bin/next'), production ? 'start' : 'dev',
  ...(!production ? ['--webpack'] : []), '--hostname', 'localhost', '-p', '3132',
], {
  stdio: 'inherit',
  env: {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    NEXT_TELEMETRY_DISABLED: '1',
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:9',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'i18n-tests-no-key',
    NEXT_PUBLIC_SITE_URL: 'http://localhost:3132',
    SUPABASE_SERVICE_ROLE_KEY: '', LINE_CHANNEL_ID: '', LINE_CHANNEL_SECRET: '',
    LINE_CHANNEL_ACCESS_TOKEN: '', RESEND_API_KEY: '', RESEND_FROM: '', VAPID_PRIVATE_KEY: '',
  },
});
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => { if (child.exitCode === null) child.kill(signal); });
}
child.on('error', error => { console.error(error); process.exitCode = 1; });
child.on('exit', (code, signal) => { process.exitCode = code ?? (signal ? 1 : 0); });
