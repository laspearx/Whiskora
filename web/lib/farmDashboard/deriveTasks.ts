import { PET_STATUS } from '@/lib/constants';
import { daysDiff, fmtDate } from './dateHelpers';
import type { FarmDashboardSummary, Task } from './types';

/**
 * Pure derivation of the "Today's Tasks" list from the dashboard summary — every rule reads
 * freshly-fetched data, so tasks disappear on their own once the underlying row changes; there
 * is no manual dismissal/boolean state here by design.
 */
export function deriveTasks(summary: FarmDashboardSummary, farmId: string): Task[] {
  const tasks: Task[] = [];
  const petMap = Object.fromEntries(summary.pets.map(p => [p.id, p]));

  const activeLitters = summary.litters.filter(l => l.status === 'รอคลอด');
  activeLitters.forEach(l => {
    if (!l.expected_birth_date) return;
    const diff = daysDiff(l.expected_birth_date);
    const code = l.litter_code || 'TBA';
    if (diff < 0) {
      tasks.push({ id: `lb-${l.id}`, urgency: 'overdue', label: `ครอก ${code} เลยกำหนดคลอด ${Math.abs(diff)} วัน`, action: 'บันทึกคลอด', href: `/farm-dashboard/${farmId}/litters/${l.id}/birth`, icon: '/icons/icon-breeding.png' });
    } else if (diff === 0) {
      tasks.push({ id: `lb-${l.id}`, urgency: 'today', label: `ครอก ${code} — คาดคลอดวันนี้`, action: 'บันทึกคลอด', href: `/farm-dashboard/${farmId}/litters/${l.id}/birth`, icon: '/icons/icon-breeding.png' });
    } else if (diff <= 5) {
      tasks.push({ id: `lb-${l.id}`, urgency: 'upcoming', label: `ครอก ${code} — คาดคลอดใน ${diff} วัน`, action: 'ดู', href: `/farm-dashboard/${farmId}/litters/${l.id}`, icon: '/icons/icon-breeding.png' });
    }
  });

  summary.vaccines_due.forEach(v => {
    if (!v.next_due) return;
    const diff = daysDiff(v.next_due);
    const pn = petMap[v.pet_id]?.name || 'สัตว์';
    if (diff < 0) {
      tasks.push({ id: `vax-${v.id}`, urgency: 'overdue', label: `${pn} — วัคซีน ${v.vaccine_name} เลยกำหนด ${Math.abs(diff)} วัน`, action: 'จัดการ', href: `/pets/${v.pet_id}/vaccines`, icon: '/icons/icon-health.png' });
    } else if (diff === 0) {
      tasks.push({ id: `vax-${v.id}`, urgency: 'today', label: `${pn} — วัคซีน ${v.vaccine_name} ครบกำหนดวันนี้`, action: 'บันทึก', href: `/pets/${v.pet_id}/vaccines/create`, icon: '/icons/icon-health.png' });
    } else if (diff <= 7) {
      tasks.push({ id: `vax-${v.id}`, urgency: 'upcoming', label: `${pn} — วัคซีน ${v.vaccine_name} อีก ${diff} วัน`, action: 'ดู', href: `/pets/${v.pet_id}/vaccines`, icon: '/icons/icon-health.png' });
    }
  });

  if (summary.pending_reservations.length > 0) {
    tasks.push({ id: 'pending-reservations', urgency: 'today', label: `มีคนจองสัตว์ ${summary.pending_reservations.length} ตัว รอยืนยัน`, action: 'ตรวจสอบ', href: `/farm-dashboard/${farmId}/reservations`, icon: '/icons/icon-calendar.png' });
  }

  // new: reservation nearing expiry (≤2 days)
  summary.pending_reservations.forEach(r => {
    if (!r.expires_at) return;
    const diff = daysDiff(r.expires_at);
    if (diff >= 0 && diff <= 2) {
      const pn = petMap[r.pet_id]?.name || 'สัตว์';
      tasks.push({ id: `res-exp-${r.id}`, urgency: 'today', label: `การจอง ${pn} ใกล้หมดอายุใน ${diff} วัน`, action: 'ตรวจสอบ', href: `/farm-dashboard/${farmId}/reservations`, icon: '/icons/icon-calendar.png' });
    }
  });

  summary.open_appointments.forEach(a => {
    if (!a.appt_date) return;
    const diff = daysDiff(a.appt_date);
    if (diff < 0) {
      tasks.push({ id: `ap-${a.id}`, urgency: 'overdue', label: `นัดหมาย: ${a.title} (เลยกำหนด ${Math.abs(diff)} วัน)`, action: 'ดู', href: `/farm-dashboard/${farmId}/appointments`, icon: '/icons/icon-calendar.png' });
    } else if (diff === 0) {
      tasks.push({ id: `ap-${a.id}`, urgency: 'today', label: `นัดหมาย: ${a.title} — วันนี้`, action: 'ดู', href: `/farm-dashboard/${farmId}/appointments`, icon: '/icons/icon-calendar.png' });
    } else if (diff <= 7) {
      tasks.push({ id: `ap-${a.id}`, urgency: 'upcoming', label: `นัดหมาย: ${a.title} — ${fmtDate(a.appt_date, true)}`, action: 'ดู', href: `/farm-dashboard/${farmId}/appointments`, icon: '/icons/icon-calendar.png' });
    }
  });

  // new: pending ownership transfer awaiting the buyer's response
  summary.pending_transfers_out.forEach(t => {
    const diff = daysDiff(t.initiated_at);
    const pn = petMap[t.pet_id]?.name || 'สัตว์';
    if (diff <= -3) {
      tasks.push({ id: `tr-${t.id}`, urgency: 'today', label: `การโอนย้ายเจ้าของ ${pn} รอผู้รับยืนยันมา ${Math.abs(diff)} วัน`, action: 'ตรวจสอบ', href: `/profile/transfers`, icon: '/icons/icon-calendar.png' });
    } else {
      tasks.push({ id: `tr-${t.id}`, urgency: 'info', label: `การโอนย้ายเจ้าของ ${pn} รอผู้รับตอบรับ`, action: 'ดู', href: `/profile/transfers`, icon: '/icons/icon-calendar.png' });
    }
  });

  const bornLitters = summary.litters.filter(l => l.status !== 'รอคลอด');
  bornLitters.forEach(l => {
    const kittens = summary.pets.filter(p => p.litter_id === l.id);
    if (kittens.length === 0 && (!l.puppy_count || l.puppy_count === 0)) {
      tasks.push({ id: `nk-${l.id}`, urgency: 'today', label: `ครอก ${l.litter_code || 'TBA'} คลอดแล้วแต่ยังไม่บันทึกลูกสัตว์`, action: 'บันทึก', href: `/farm-dashboard/${farmId}/litters/${l.id}`, icon: '/icons/icon-feeding.png' });
    }
  });

  const noBirth = summary.pets.filter(p => !p.birth_date).length;
  if (noBirth > 0) {
    tasks.push({ id: 'no-birth', urgency: 'info', label: `สัตว์ ${noBirth} ตัวยังไม่มีวันเกิด`, action: 'แก้ไข', href: `/farm-dashboard/${farmId}/data-check?focus=birth`, icon: '/icons/icon-my-pets.png' });
  }
  const noImage = summary.pets.filter(p => !p.image_url).length;
  if (noImage > 0) {
    tasks.push({ id: 'no-img', urgency: 'info', label: `สัตว์ ${noImage} ตัวยังไม่มีรูปภาพ`, action: 'เพิ่มรูป', href: `/farm-dashboard/${farmId}/data-check?focus=photo`, icon: '/icons/icon-my-pets.png' });
  }
  const noStatus = summary.pets.filter(p => !p.status).length;
  if (noStatus > 0) {
    tasks.push({ id: 'no-status', urgency: 'info', label: `สัตว์ ${noStatus} ตัวยังไม่ใส่สถานะในฟาร์ม`, action: 'อัปเดตสถานะ', href: `/farm-dashboard/${farmId}/data-check?focus=status`, icon: '/icons/icon-my-pets.png' });
  }

  // new: sale-ready pet with no price set
  const noPriceCount = summary.pets.filter(p =>
    (p.status === PET_STATUS.OPEN_RESERVE || p.status === PET_STATUS.AVAILABLE) && !p.price
  ).length;
  if (noPriceCount > 0) {
    tasks.push({ id: 'no-price', urgency: 'info', label: `สัตว์ ${noPriceCount} ตัวเปิดขาย/พร้อมย้ายบ้านแต่ยังไม่ตั้งราคา`, action: 'แก้ไขสัตว์', href: `/farm-dashboard/${farmId}/pets?group=forsale`, icon: '/icons/icon-price-tag.png' });
  }

  const urgOrd = { overdue: 0, today: 1, upcoming: 2, info: 3 } as const;
  tasks.sort((a, b) => urgOrd[a.urgency] - urgOrd[b.urgency]);
  return tasks;
}
