// Date-range math for the admin Platform Overview KPIs.
// Thailand has no DST and is always UTC+7 — boundaries are computed against that fixed
// offset (not the viewing admin's browser timezone) so "today"/"this month" match the
// business's actual calendar day regardless of where the admin happens to be sitting.
const ICT_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export type DateRangePreset = 'today' | 'last7' | 'last30' | 'this_month' | 'prev_month' | 'custom' | 'all';

export interface ResolvedDateRange {
  start: Date;
  end: Date; // exclusive upper bound
  compareStart: Date;
  compareEnd: Date; // exclusive upper bound
  hasComparison: boolean;
  label: string;
}

function ictStartOfDay(date: Date): Date {
  const ict = new Date(date.getTime() + ICT_OFFSET_MS);
  ict.setUTCHours(0, 0, 0, 0);
  return new Date(ict.getTime() - ICT_OFFSET_MS);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function ictStartOfMonth(date: Date): Date {
  const ict = new Date(date.getTime() + ICT_OFFSET_MS);
  const startOfMonthIct = new Date(Date.UTC(ict.getUTCFullYear(), ict.getUTCMonth(), 1));
  return new Date(startOfMonthIct.getTime() - ICT_OFFSET_MS);
}

export const PRESET_LABELS: Record<DateRangePreset, string> = {
  today: 'วันนี้',
  last7: '7 วันล่าสุด',
  last30: '30 วันล่าสุด',
  this_month: 'เดือนนี้',
  prev_month: 'เดือนที่แล้ว',
  custom: 'กำหนดเอง',
  all: 'ทั้งหมด',
};

export function resolveDateRange(
  preset: DateRangePreset,
  customFrom?: string,
  customTo?: string
): ResolvedDateRange {
  const now = new Date();
  const todayStart = ictStartOfDay(now);
  const todayEnd = addDays(todayStart, 1);

  switch (preset) {
    case 'today':
      return { start: todayStart, end: todayEnd, compareStart: addDays(todayStart, -1), compareEnd: todayStart, hasComparison: true, label: PRESET_LABELS.today };
    case 'last7': {
      const start = addDays(todayStart, -6);
      return { start, end: todayEnd, compareStart: addDays(start, -7), compareEnd: start, hasComparison: true, label: PRESET_LABELS.last7 };
    }
    case 'last30': {
      const start = addDays(todayStart, -29);
      return { start, end: todayEnd, compareStart: addDays(start, -30), compareEnd: start, hasComparison: true, label: PRESET_LABELS.last30 };
    }
    case 'this_month': {
      const start = ictStartOfMonth(now);
      const prevStart = ictStartOfMonth(addDays(start, -1));
      return { start, end: todayEnd, compareStart: prevStart, compareEnd: start, hasComparison: true, label: PRESET_LABELS.this_month };
    }
    case 'prev_month': {
      const thisMonthStart = ictStartOfMonth(now);
      const prevMonthStart = ictStartOfMonth(addDays(thisMonthStart, -1));
      const prevPrevMonthStart = ictStartOfMonth(addDays(prevMonthStart, -1));
      return { start: prevMonthStart, end: thisMonthStart, compareStart: prevPrevMonthStart, compareEnd: prevMonthStart, hasComparison: true, label: PRESET_LABELS.prev_month };
    }
    case 'custom': {
      if (!customFrom || !customTo) return resolveDateRange('last7');
      const start = ictStartOfDay(new Date(customFrom + 'T00:00:00Z'));
      const end = addDays(ictStartOfDay(new Date(customTo + 'T00:00:00Z')), 1);
      const spanMs = end.getTime() - start.getTime();
      return { start, end, compareStart: new Date(start.getTime() - spanMs), compareEnd: start, hasComparison: true, label: PRESET_LABELS.custom };
    }
    case 'all':
    default:
      return { start: new Date(0), end: todayEnd, compareStart: new Date(0), compareEnd: new Date(0), hasComparison: false, label: PRESET_LABELS.all };
  }
}
