"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { deriveFarmSteps, summarizeFarmSteps } from "@/lib/onboarding/farmSteps";
import { getFarmProgress, patchFarmProgress } from "@/lib/onboarding/client";
import type { OnboardingProgressRow, OnboardingStep } from "@/lib/onboarding/types";
import { trackOnboardingEvent } from "@/app/components/onboarding/events";

export function useFarmOnboardingProgress(farmId: number | null) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressRow, setProgressRow] = useState<OnboardingProgressRow | null>(null);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);

  const load = useCallback(async () => {
    if (!farmId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user.id ?? null;
      setUserId(uid);

      const [farmRes, petsRes, vsRes, littersRes, progressRow0] = await Promise.all([
        supabase
          .from("farms")
          .select("farm_name, bio, phone, facebook_link, line_id, image_url, cover_url")
          .eq("id", farmId)
          .maybeSingle(),
        supabase.from("pets").select("id, status, image_url, birth_date").eq("farm_id", farmId),
        supabase.from("farm_visibility_settings").select("farm_id", { count: "exact", head: true }).eq("farm_id", farmId),
        supabase.from("litters").select("id", { count: "exact", head: true }).eq("farm_id", String(farmId)),
        getFarmProgress(farmId),
      ]);

      const derivedSteps = deriveFarmSteps({
        farmId,
        farm: farmRes.data ?? null,
        visibilitySettingsCount: vsRes.count ?? 0,
        pets: petsRes.data ?? [],
        littersCount: littersRes.count ?? 0,
        skippedSteps: progressRow0?.metadata?.skipped_steps ?? [],
        sharedProfileAt: progressRow0?.metadata?.shared_profile_at,
      });

      let finalProgressRow = progressRow0;
      const { allDone } = summarizeFarmSteps(derivedSteps);
      if (allDone && !progressRow0?.completed_at && uid) {
        finalProgressRow = await patchFarmProgress(farmId, uid, {
          completed_at: new Date().toISOString(),
          checklist_collapsed: true,
        });
        trackOnboardingEvent({ event: "onboarding_completed", onboardingType: "farm", userId: uid, workspaceId: String(farmId) });
      }

      setProgressRow(finalProgressRow);
      setSteps(derivedSteps);
    } catch (e: any) {
      setError(e?.message ?? "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    load();
  }, [load]);

  const dismissWelcome = useCallback(async () => {
    if (!farmId || !userId) return;
    const row = await patchFarmProgress(farmId, userId, { dismissed_welcome_at: new Date().toISOString() });
    setProgressRow(row);
    trackOnboardingEvent({ event: "onboarding_dismissed", onboardingType: "farm", userId, workspaceId: String(farmId) });
  }, [farmId, userId]);

  const toggleCollapse = useCallback(
    async (collapsed: boolean) => {
      if (!farmId || !userId) return;
      const row = await patchFarmProgress(farmId, userId, { checklist_collapsed: collapsed });
      setProgressRow(row);
    },
    [farmId, userId]
  );

  const skipStep = useCallback(
    async (stepKey: string) => {
      if (!farmId || !userId) return;
      const existing: string[] = progressRow?.metadata?.skipped_steps ?? [];
      if (existing.includes(stepKey)) return;
      const metadata = { ...(progressRow?.metadata ?? {}), skipped_steps: [...existing, stepKey] };
      const row = await patchFarmProgress(farmId, userId, { metadata });
      setProgressRow(row);
      trackOnboardingEvent({ event: "onboarding_step_skipped", onboardingType: "farm", step: stepKey, userId, workspaceId: String(farmId) });
    },
    [farmId, userId, progressRow]
  );

  const reopen = useCallback(async () => {
    if (!farmId || !userId) return;
    const row = await patchFarmProgress(farmId, userId, { dismissed_welcome_at: null, checklist_collapsed: false });
    setProgressRow(row);
  }, [farmId, userId]);

  return {
    userId,
    loading,
    error,
    steps,
    progressRow,
    dismissWelcome,
    toggleCollapse,
    skipStep,
    reopen,
    refresh: load,
  };
}
