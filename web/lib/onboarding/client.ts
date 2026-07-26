import { supabase } from "@/lib/supabase";
import type { OnboardingProgressRow } from "./types";

export type OnboardingProgressPatch = Partial<
  Pick<OnboardingProgressRow, "dismissed_welcome_at" | "checklist_collapsed" | "completed_at" | "metadata">
>;

type MatchScalar = Record<string, string | number>;

/**
 * The unique indexes on user_onboarding_progress are partial (WHERE onboarding_type = ...),
 * so a plain supabase-js `.upsert()` can't infer them as the ON CONFLICT arbiter — Postgres
 * requires the WHERE clause to be spelled out, which the JS client has no way to pass.
 * Select-then-insert-or-update instead.
 */
async function selectOrUpsert(
  match: MatchScalar,
  patch: OnboardingProgressPatch,
  insertRow: MatchScalar
): Promise<OnboardingProgressRow | null> {
  const { data: existing } = await supabase
    .from("user_onboarding_progress")
    .select("*")
    .match(match)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("user_onboarding_progress")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) throw error;
    return data as OnboardingProgressRow;
  }

  const { data, error } = await supabase
    .from("user_onboarding_progress")
    .insert({ ...insertRow, ...patch })
    .select("*")
    .single();
  if (error) throw error;
  return data as OnboardingProgressRow;
}

export async function getOwnerProgress(userId: string): Promise<OnboardingProgressRow | null> {
  const { data } = await supabase
    .from("user_onboarding_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("onboarding_type", "owner")
    .maybeSingle();
  return data as OnboardingProgressRow | null;
}

export async function patchOwnerProgress(userId: string, patch: OnboardingProgressPatch) {
  return selectOrUpsert(
    { user_id: userId, onboarding_type: "owner" },
    patch,
    { user_id: userId, onboarding_type: "owner" }
  );
}

export async function getFarmProgress(farmId: number): Promise<OnboardingProgressRow | null> {
  const { data } = await supabase
    .from("user_onboarding_progress")
    .select("*")
    .eq("farm_id", farmId)
    .eq("onboarding_type", "farm")
    .maybeSingle();
  return data as OnboardingProgressRow | null;
}

export async function patchFarmProgress(farmId: number, userId: string, patch: OnboardingProgressPatch) {
  return selectOrUpsert(
    { farm_id: farmId, onboarding_type: "farm" },
    patch,
    { farm_id: farmId, onboarding_type: "farm", user_id: userId }
  );
}
