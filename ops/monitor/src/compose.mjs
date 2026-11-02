// Events → Discord messages. One message per (route, project) per run, so a burst becomes one post.
// Site problems and monitor problems are worded differently and can go to different routes.
import { routeOf } from './config.mjs';

const t = (ms) => new Date(ms).toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
const dur = (m) => (m >= 120 ? `${Math.round(m / 60)} ชม.` : `${m} นาที`);
export const LIMIT = 2000;

function line(e) {
  switch (e.type) {
    case 'down': return `🔴 **${e.check}** ผิดปกติ — ${e.reason} (ตั้งแต่ ${t(e.since)}, ติดกัน ${e.fails} ครั้ง) ${e.url}`;
    case 'still_down': return `🔴 **${e.check}** ยังผิดปกติ ${dur(e.durationMin)} — ${e.reason} ${e.url}`;
    case 'recovered': return `🟢 **${e.check}** กลับมาปกติ (ผิดปกติ ${dur(e.durationMin)}; ล่าสุด: ${e.lastReason || '-'}) ${e.url}`;
    case 'release_lag': return `🟠 **${e.check}** main เป็น ${e.expected} แต่เว็บยังเสิร์ฟ ${e.served} (ตั้งแต่ ${t(e.since)})`;
    case 'release_lag_cleared': return `🟢 **${e.check}** เว็บเสิร์ฟ ${e.served} ตรงกับ main แล้ว`;
    case 'release': return `🚀 ออกเวอร์ชัน **${e.to}** (จาก ${e.from})${e.repoUrl ? ` — ${e.repoUrl}/releases/tag/v${e.to}` : ''}`;
    default: return `${e.type}`;
  }
}

function monitorText(e) {
  const head = { down: '🟠 **ตัวตรวจมีปัญหา** (ไม่ใช่เว็บล่ม — ผลรอบนี้เชื่อไม่ได้)', still_down: '🟠 **ตัวตรวจยังมีปัญหา**', recovered: '🟢 **ตัวตรวจกลับมาปกติ**' }[e.type];
  const body = e.type === 'recovered' ? `ผิดปกติ ${dur(e.durationMin)}; ล่าสุด: ${e.lastReason || '-'}` : (e.issues || []).map((i) => `• ${i}`).join('\n');
  return `${head}\n${body}`;
}

export const clip = (s) => (s.length <= LIMIT ? s : s.slice(0, LIMIT - 20) + '\n… (ตัดข้อความ)');

export function compose(events, { shared, projects }) {
  const byId = Object.fromEntries(projects.map((p) => [p.id, p]));
  const groups = new Map();
  const add = (route, title, text) => {
    const k = `${route}\u0000${title}`;
    if (!groups.has(k)) groups.set(k, { route, title, lines: [] });
    groups.get(k).lines.push(text);
  };
  for (const e of events) {
    if (e.scope === 'monitor') { add(routeOf(shared, null, 'monitor'), '', monitorText(e)); continue; }
    const p = byId[e.project];
    const kind = e.scope === 'release' ? 'releases' : 'alerts';
    add(routeOf(shared, p, kind), `**${p?.name || e.project}**`, line(e));
  }
  return [...groups.values()].map((g) => ({ route: g.route, content: clip([g.title, ...g.lines].filter(Boolean).join('\n')) }));
}
