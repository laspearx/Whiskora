import type { VaccineSummary } from '@/lib/vaccine-summary';
import { neuteredText } from '@/lib/trust';

export default function PetHealthSummary({ summary, isNeutered, readError = false }: {
  summary: VaccineSummary | null;
  isNeutered?: boolean | null;
  readError?: boolean;
}) {
  const rows = summary ? [
    ...(summary.total === 0 ? [{ label: 'ยังไม่มีประวัติที่บันทึก', count: null }] : [
      { label: 'ประวัติวัคซีน / การดูแลที่บันทึก', count: summary.total },
      ...(summary.noDue ? [{ label: 'มีประวัติ แต่ไม่ได้ระบุวันนัดครั้งถัดไป', count: summary.noDue }] : []),
      ...(summary.invalidDue ? [{ label: 'วันนัดไม่ถูกต้อง — ยังสรุปกำหนดไม่ได้', count: summary.invalidDue }] : []),
      ...(summary.overdue ? [{ label: 'เลยวันนัดที่บันทึกไว้', count: summary.overdue }] : []),
      ...(summary.dueToday ? [{ label: 'ถึงวันนัดวันนี้', count: summary.dueToday }] : []),
      ...(summary.upcoming ? [{ label: 'มีวันนัดในอนาคต', count: summary.upcoming }] : []),
    ]),
  ] : [];

  return (
    <div className="health-tick-list" aria-label="สรุปข้อมูลสุขภาพที่บันทึก">
      {readError && <p className="health-tick-detail">โหลดประวัติไม่สำเร็จ กรุณาลองโหลดหน้าอีกครั้ง</p>}
      {rows.map(row => (
        <div key={row.label} className="health-tick-row">
          <span className="health-tick no" aria-hidden="true">—</span>
          <div className="health-tick-info">
            <div className="health-tick-label">{row.label}</div>
            {row.count !== null && <div className="health-tick-detail">{row.count} รายการ</div>}
          </div>
        </div>
      ))}
      {summary && <p className="health-tick-detail">สรุปตามวันนัดในเวลาไทย รายการอาจรวมถ่ายพยาธิหรือป้องกันเห็บหมัด จึงไม่ยืนยันว่าฉีดวัคซีนครบ</p>}
      <div className="health-tick-row">
        <span className={`health-tick ${isNeutered === true ? 'ok' : 'no'}`} aria-hidden="true">{isNeutered === true ? '✓' : '—'}</span>
        <div className="health-tick-info">
          <div className="health-tick-label">ทำหมัน</div>
          <div className="health-tick-detail">{neuteredText(isNeutered)}</div>
        </div>
      </div>
    </div>
  );
}
