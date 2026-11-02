// State between runs: open incidents (down since …), release baseline, monitor health, and the outbox of messages not
// yet delivered. The storage itself (Actions cache / artifact / state branch) is the runtime's job; this module only
// turns text ↔ state, and says when the previous state is MISSING or CORRUPT so the run can report what that loses.
import { emptyState } from './engine.mjs';

export const VERSION = 1;

// Stable text: sorted keys, no run timestamp → a healthy run produces the same text as the run before it
// (no needless saves / commits).
export function serialize(state) {
  const { lastRunAt, ...keep } = state; // eslint-disable-line no-unused-vars
  const sort = (v) => (Array.isArray(v) ? v.map(sort) : v && typeof v === 'object'
    ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sort(v[k])])) : v);
  return JSON.stringify(sort({ ...keep, v: VERSION }), null, 1) + '\n';
}

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
function valid(s) {
  if (!isObj(s) || s.v !== VERSION) return false;
  if (!isObj(s.checks) || !isObj(s.releases) || !Array.isArray(s.outbox)) return false;
  for (const c of Object.values(s.checks)) if (!isObj(c) || !['ok', 'down', 'unknown'].includes(c.status)) return false;
  for (const m of s.outbox) if (!isObj(m) || typeof m.route !== 'string' || typeof m.content !== 'string') return false;
  return true;
}

// text: file content, or null when there is no file. firstRun: the runtime knows there was never a state (install).
export function parseState(text, { firstRun = false } = {}) {
  if (text == null || text === '') return { state: emptyState(), problem: firstRun ? null : 'missing' };
  let s;
  try { s = JSON.parse(text); } catch { return { state: emptyState(), problem: 'corrupt' }; }
  if (!valid(s)) return { state: emptyState(), problem: s?.v !== VERSION ? 'unsupported version' : 'corrupt' };
  return { state: s, problem: null };
}

// What a lost state means, in the words of the notice the run posts (monitor route, immediately, no threshold).
export const lossNotice = (problem) =>
  `🟠 **ตัวตรวจ: state ${problem === 'missing' ? 'หาย' : 'อ่านไม่ได้'} (${problem}) — เริ่มนับใหม่**\n` +
  '• เหตุที่กำลังติดตามอยู่ถูกลืม: ถ้ายังผิดปกติจะถูกแจ้ง "ผิดปกติ" ใหม่หลังตรวจพบซ้ำตามเกณฑ์ และข้อความ "กลับมาปกติ" ของเหตุเดิมจะไม่มา\n' +
  '• ข้อความที่ค้างส่ง (outbox) ของรอบก่อนหายไป — ตรวจสถานะเว็บเองถ้ามีเหตุค้างอยู่\n' +
  '• เวอร์ชันที่เสิร์ฟรอบนี้ถูกใช้เป็นจุดเริ่มใหม่ (ไม่แจ้งว่าเปลี่ยน)';
