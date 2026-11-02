/** The legacy vaccines table also holds deworming, flea treatments and free text.
 * Summarise recorded appointments only; names/counts cannot prove vaccine coverage.
 */
export interface CareRecord {
  next_due?: string | null;
}

export interface VaccineSummary {
  total: number;
  noDue: number;
  invalidDue: number;
  overdue: number;
  dueToday: number;
  upcoming: number;
}

const bangkokDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
});

export function dateInBangkok(now: Date): string {
  const parts = bangkokDate.formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)!.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function validDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1];
}

export function summarizeVaccines(records: readonly CareRecord[], now = new Date()): VaccineSummary {
  const today = dateInBangkok(now);
  const summary: VaccineSummary = { total: records.length, noDue: 0, invalidDue: 0, overdue: 0, dueToday: 0, upcoming: 0 };
  for (const record of records) {
    const due = record.next_due;
    if (due == null || due.trim() === '') summary.noDue++;
    else if (!validDateOnly(due)) summary.invalidDue++;
    // Both operands are validated YYYY-MM-DD calendar dates, never timestamps.
    else if (due < today) summary.overdue++;
    else if (due === today) summary.dueToday++;
    else summary.upcoming++;
  }
  return summary;
}
