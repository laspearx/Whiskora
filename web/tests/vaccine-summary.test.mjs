import test from 'node:test';
import assert from 'node:assert/strict';
import { dateInBangkok, summarizeVaccines } from '../lib/vaccine-summary.ts';

const now = new Date('2026-11-01T10:00:00Z');
const empty = { total: 0, noDue: 0, invalidDue: 0, overdue: 0, dueToday: 0, upcoming: 0 };

test('no recorded history', () => {
  assert.deepEqual(summarizeVaccines([], now), empty);
});

test('a record without an appointment is not a future/on-time appointment', () => {
  assert.deepEqual(summarizeVaccines([{}], now), { ...empty, total: 1, noDue: 1 });
});

for (const due of [null, undefined, '', '   ']) {
  test(`missing date: ${JSON.stringify(due)}`, () => {
    assert.deepEqual(summarizeVaccines([{ next_due: due }], now), { ...empty, total: 1, noDue: 1 });
  });
}

for (const due of ['invalid', '2026-2-01', '01/11/2026', '2026-02-29', '2026-04-31', '2026-00-10', '2026-13-01', '2026-11-00', '0000-01-01', '2026-11-01T00:00:00Z', ' 2026-11-01 ']) {
  test(`malformed or impossible date is unknown, never overdue/upcoming: ${due}`, () => {
    assert.deepEqual(summarizeVaccines([{ next_due: due }], now), { ...empty, total: 1, invalidDue: 1 });
  });
}

test('valid leap date, year boundary and month boundary', () => {
  assert.equal(summarizeVaccines([{ next_due: '2028-02-29' }], new Date('2028-02-29T05:00:00Z')).dueToday, 1);
  assert.equal(summarizeVaccines([{ next_due: '2027-01-01' }], new Date('2026-12-31T16:59:59Z')).upcoming, 1);
  assert.equal(summarizeVaccines([{ next_due: '2026-11-01' }], new Date('2026-10-31T16:59:59Z')).upcoming, 1);
});

test('just before and just after midnight Bangkok, independently of the machine timezone', () => {
  const before = new Date('2026-10-31T16:59:59.999Z');
  const after = new Date('2026-10-31T17:00:00.000Z');
  assert.equal(dateInBangkok(before), '2026-10-31');
  assert.equal(dateInBangkok(after), '2026-11-01');
  const records = [{ next_due: '2026-11-01' }, { next_due: '2026-10-31' }];
  assert.deepEqual(summarizeVaccines(records, before), { ...empty, total: 2, dueToday: 1, upcoming: 1 });
  assert.deepEqual(summarizeVaccines(records, after), { ...empty, total: 2, dueToday: 1, overdue: 1 });
});

test('today remains today through 23:59:59 Bangkok; becomes overdue on the next day', () => {
  const records = [{ next_due: '2026-11-01' }];
  for (const instant of ['2026-10-31T17:00:00Z', '2026-11-01T00:01:00Z', '2026-11-01T16:59:59.999Z']) {
    assert.deepEqual(summarizeVaccines(records, new Date(instant)), { ...empty, total: 1, dueToday: 1 });
  }
  assert.deepEqual(summarizeVaccines(records, new Date('2026-11-01T17:00:00Z')), { ...empty, total: 1, overdue: 1 });
});

test('multiple records preserve all known and unknown date groups; no mutation', () => {
  const records = Object.freeze([
    Object.freeze({ next_due: '2026-10-31' }), { next_due: '2026-11-01' },
    { next_due: '2026-11-02' }, { next_due: '2026-12-01' }, {}, { next_due: 'bad' },
  ]);
  assert.deepEqual(summarizeVaccines(records, now), { total: 6, noDue: 1, invalidDue: 1, overdue: 1, dueToday: 1, upcoming: 2 });
});

test('free text, combined vaccine, FVRCP, deworming and flea records only describe recorded appointments', () => {
  const records = ['วัคซีนรวม', 'FVRCP', 'ถ่ายพยาธิ', 'หยดหลังป้องกันเห็บหมัด', 'ไม่ทราบ'].map(vaccine_name => ({ vaccine_name, next_due: null }));
  assert.deepEqual(summarizeVaccines(records, now), { ...empty, total: 5, noDue: 5 });
  assert.deepEqual(summarizeVaccines([{ vaccine_name: 'ถ่ายพยาธิ', next_due: '2026-11-02' }], now), { ...empty, total: 1, upcoming: 1 });
});
