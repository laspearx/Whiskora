// Single source of truth for "what counts as incomplete pet data" — consumed by
// farm-dashboard/[id]/data-check (inline-fix UI), lib/onboarding/farmSteps.ts (data_check step),
// and lib/farmDashboard/smartLists.ts (Animals Requiring Attention). Previously this exact
// 3-predicate logic was duplicated independently in the first two; do not add a fourth copy.

export interface PetCompletenessInput {
  id: number;
  status: string | null;
  image_url: string | null;
  birth_date: string | null;
}

export const PET_COMPLETENESS_CHECKS = {
  noStatus: (p: PetCompletenessInput) => !p.status,
  noPhoto: (p: PetCompletenessInput) => !p.image_url,
  noBirth: (p: PetCompletenessInput) => !p.birth_date,
} as const;

export interface PetCompletenessScore<T extends PetCompletenessInput> {
  noStatus: T[];
  noPhoto: T[];
  noBirth: T[];
  totalFields: number;
  missingFields: number;
  ratio: number;
}

export function scorePetCompleteness<T extends PetCompletenessInput>(pets: T[]): PetCompletenessScore<T> {
  const noStatus = pets.filter(PET_COMPLETENESS_CHECKS.noStatus);
  const noPhoto = pets.filter(PET_COMPLETENESS_CHECKS.noPhoto);
  const noBirth = pets.filter(PET_COMPLETENESS_CHECKS.noBirth);
  const totalFields = pets.length * 3;
  const missingFields = noStatus.length + noPhoto.length + noBirth.length;
  const ratio = totalFields > 0 ? (totalFields - missingFields) / totalFields : 0;
  return { noStatus, noPhoto, noBirth, totalFields, missingFields, ratio };
}
