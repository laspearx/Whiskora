// ─── Onboarding: shared types ──────────────────────────────────────────────

export type StepStatus = "not_started" | "in_progress" | "done" | "skipped";

export interface OnboardingStep {
  key: string;
  title: string;
  description: string;
  status: StepStatus;
  optional: boolean;
  ctaLabel: string;
  ctaHref: string;
  /** Path under /public, e.g. "/icons/icon-my-pets.png" */
  icon: string;
  /** Set when the step supports an explicit "ไว้ภายหลัง" skip action. */
  skippable?: boolean;
}

export type OwnerIntent = "owner" | "buyer" | "family";

export interface OnboardingMetadata {
  intent?: OwnerIntent;
  viewed_own_public_profile_at?: string;
  shared_profile_at?: string;
  skipped_steps?: string[];
}

export interface OnboardingProgressRow {
  id: number;
  user_id: string;
  onboarding_type: "owner" | "farm";
  farm_id: number | null;
  dismissed_welcome_at: string | null;
  checklist_collapsed: boolean;
  completed_at: string | null;
  metadata: OnboardingMetadata;
  created_at: string;
  updated_at: string;
}
