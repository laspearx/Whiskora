// ─── Onboarding analytics event helper ─────────────────────────────────────
// No analytics provider is wired into this repo yet. This is a typed, ready-to-connect
// sink so a real provider can be dropped in later without touching call sites.
// Never pass health data or other sensitive personal info through this helper.

export type OnboardingEventName =
  | "onboarding_viewed"
  | "onboarding_started"
  | "onboarding_step_clicked"
  | "onboarding_step_completed"
  | "onboarding_step_skipped"
  | "onboarding_dismissed"
  | "onboarding_completed"
  | "public_profile_shared";

export interface OnboardingEvent {
  event: OnboardingEventName;
  onboardingType: "owner" | "farm";
  step?: string;
  userId?: string | null;
  workspaceId?: string | null;
}

export function trackOnboardingEvent(e: OnboardingEvent) {
  if (process.env.NODE_ENV !== "production") {
    console.debug("[onboarding]", e);
  }
  // Intentionally a no-op sink beyond the dev log above — wire a real provider here later.
}
