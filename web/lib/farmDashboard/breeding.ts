import { getGestationConfig } from "@/lib/species";
import { PET_STATUS } from "@/lib/constants";
import { daysDiff } from "./dateHelpers";
import type { DashboardLitter, DashboardPet } from "./types";

export type ActiveLitterStatus = 'waiting_confirmation' | 'pregnant' | 'near_due' | 'due_window' | 'overdue';

export interface LitterStatusInfo {
  status: ActiveLitterStatus;
  daysPregnant: number;
  daysUntilWindowStart: number;
  daysOverdue: number;
  minDueDate: Date | null;
  maxDueDate: Date | null;
}

export function deriveLitterStatus(litter: DashboardLitter, species: string | null | undefined): LitterStatusInfo {
  const cfg = getGestationConfig(species);
  if (!litter.mating_date) {
    return { status: 'waiting_confirmation', daysPregnant: 0, daysUntilWindowStart: cfg.gestationMin, daysOverdue: 0, minDueDate: null, maxDueDate: null };
  }
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const mating = new Date(litter.mating_date); mating.setHours(0, 0, 0, 0);
  const daysPregnant = Math.round((today.getTime() - mating.getTime()) / 86400000);
  const minDueDate = new Date(mating.getTime() + cfg.gestationMin * 86400000);
  const maxDueDate = new Date(mating.getTime() + cfg.gestationMax * 86400000);
  const daysUntilWindowStart = cfg.gestationMin - daysPregnant;
  const daysUntilWindowEnd   = cfg.gestationMax - daysPregnant;
  const daysOverdue = daysUntilWindowEnd < 0 ? Math.abs(daysUntilWindowEnd) : 0;

  let status: ActiveLitterStatus;
  if (daysUntilWindowEnd < 0 && daysOverdue > cfg.overdueTolerance) {
    status = 'overdue';
  } else if (daysUntilWindowStart <= 0) {
    status = 'due_window';
  } else if (daysUntilWindowStart <= cfg.nearDueThreshold) {
    status = 'near_due';
  } else {
    status = 'pregnant';
  }
  return { status, daysPregnant, daysUntilWindowStart, daysOverdue, minDueDate, maxDueDate };
}

export const STATUS_URGENCY: Record<ActiveLitterStatus, number> = {
  overdue: 0, due_window: 1, near_due: 2, pregnant: 3, waiting_confirmation: 4,
};

export interface TimelineEntry {
  litterId: number;
  litterCode: string;
  expectedDate: string;
  daysUntil: number;
  sireName: string;
  damName: string;
}

/** Litters expected to give birth within the given window, soonest first. */
export function buildUpcomingTimeline(litters: DashboardLitter[], windowDays: 7 | 14 | 30): TimelineEntry[] {
  return litters
    .filter(l => l.status === 'รอคลอด' && l.expected_birth_date)
    .map(l => ({
      litterId: l.id,
      litterCode: l.litter_code || 'TBA',
      expectedDate: l.expected_birth_date as string,
      daysUntil: daysDiff(l.expected_birth_date as string),
      sireName: l.sire?.name || '?',
      damName: l.dam?.name || '?',
    }))
    .filter(e => e.daysUntil <= windowDays)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

export interface BreedingStats {
  activePairs: number;
  pregnant: number;
  nearDue: number;
  bornRecent90d: number;
  kittensInLitter: number;
  kittensAvailable: number;
  kittensReserved: number;
  kittensUnassigned: number;
}

/**
 * "ลูกแมวขายแล้ว" is approximated by RESERVED status (ติดจอง) — the closest terminal state the
 * pets.status enum actually has; there is no separate "sold" status, and a pet that's fully
 * transferred away leaves the farm's own pets list entirely (farm_id gets cleared on accept), so
 * a true historical "sold" count isn't derivable from this farm-scoped snapshot without also
 * reading pet_ownership_transfers history — out of scope for this pass.
 */
export function computeBreedingStats(pets: DashboardPet[], litters: DashboardLitter[], littersBorn90d: number): BreedingStats {
  const activeLitters = litters.filter(l => l.status === 'รอคลอด');
  let pregnant = 0, nearDue = 0;
  for (const l of activeLitters) {
    const s = deriveLitterStatus(l, l.dam?.species).status;
    if (s === 'pregnant') pregnant++;
    if (s === 'near_due' || s === 'due_window' || s === 'overdue') nearDue++;
  }

  const litterPets = pets.filter(p => p.litter_id != null);
  const kittensAvailable = litterPets.filter(p => p.status === PET_STATUS.AVAILABLE || p.status === PET_STATUS.OPEN_RESERVE).length;
  const kittensReserved = litterPets.filter(p => p.status === PET_STATUS.RESERVED).length;
  const kittensUnassigned = litterPets.filter(p =>
    !p.status || p.status === PET_STATUS.KID || p.status === PET_STATUS.NOT_OPEN
  ).length;

  return {
    activePairs: activeLitters.length,
    pregnant,
    nearDue,
    bornRecent90d: littersBorn90d,
    kittensInLitter: litterPets.length,
    kittensAvailable,
    kittensReserved,
    kittensUnassigned,
  };
}
