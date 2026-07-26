"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { deriveOwnerSteps, summarizeSteps } from "@/lib/onboarding/ownerSteps";
import { getOwnerProgress, patchOwnerProgress } from "@/lib/onboarding/client";
import type { OnboardingProgressRow, OnboardingStep, OwnerIntent } from "@/lib/onboarding/types";
import { trackOnboardingEvent } from "@/app/components/onboarding/events";

export function useOwnerOnboardingProgress() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressRow, setProgressRow] = useState<OnboardingProgressRow | null>(null);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setUserId(null);
        setSteps([]);
        setProgressRow(null);
        return;
      }

      const uid = session.user.id;
      setUserId(uid);

      const [profileRes, ownedPetsRes, coOwnedRes, progressRow0] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", uid).maybeSingle(),
        supabase.from("pets").select("id, name, species, gender, birth_date").eq("user_id", uid),
        supabase
          .from("pet_co_owners")
          .select("pet_id, pets(id, name, species, gender, birth_date)")
          .eq("user_id", uid),
        getOwnerProgress(uid),
      ]);

      const ownedPets = ownedPetsRes.data ?? [];
      const coOwnedPets = ((coOwnedRes.data ?? []) as any[])
        .map((row) => row.pets)
        .filter(Boolean);
      const mergedById = new Map<number, any>();
      [...ownedPets, ...coOwnedPets].forEach((p) => mergedById.set(p.id, p));
      const pets = Array.from(mergedById.values());
      const petIds = pets.map((p) => p.id);

      let hasHealthRecord = false;
      if (petIds.length > 0) {
        const [vaccinesRes, weightsRes, apptRes] = await Promise.all([
          supabase.from("vaccines").select("id").in("pet_id", petIds).limit(1),
          supabase.from("pet_weights").select("id").in("pet_id", petIds).limit(1),
          supabase
            .from("appointments")
            .select("id")
            .or(`user_id.eq.${uid},pet_id.in.(${petIds.join(",")})`)
            .limit(1),
        ]);
        hasHealthRecord = !!(vaccinesRes.data?.length || weightsRes.data?.length || apptRes.data?.length);
      } else {
        const { data: apptData } = await supabase.from("appointments").select("id").eq("user_id", uid).limit(1);
        hasHealthRecord = !!apptData?.length;
      }

      const derivedSteps = deriveOwnerSteps({
        fullName: profileRes.data?.full_name,
        pets,
        hasHealthRecord,
        viewedOwnPublicProfileAt: progressRow0?.metadata?.viewed_own_public_profile_at,
      });

      let finalProgressRow = progressRow0;
      const { allDone } = summarizeSteps(derivedSteps);
      if (allDone && !progressRow0?.completed_at) {
        finalProgressRow = await patchOwnerProgress(uid, {
          completed_at: new Date().toISOString(),
          checklist_collapsed: true,
        });
        trackOnboardingEvent({ event: "onboarding_completed", onboardingType: "owner", userId: uid });
      }

      setProgressRow(finalProgressRow);
      setSteps(derivedSteps);
    } catch (e: any) {
      setError(e?.message ?? "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dismissWelcome = useCallback(async () => {
    if (!userId) return;
    const row = await patchOwnerProgress(userId, { dismissed_welcome_at: new Date().toISOString() });
    setProgressRow(row);
    trackOnboardingEvent({ event: "onboarding_dismissed", onboardingType: "owner", userId });
  }, [userId]);

  const toggleCollapse = useCallback(
    async (collapsed: boolean) => {
      if (!userId) return;
      const row = await patchOwnerProgress(userId, { checklist_collapsed: collapsed });
      setProgressRow(row);
    },
    [userId]
  );

  const setIntent = useCallback(
    async (intent: OwnerIntent) => {
      if (!userId) return;
      const metadata = { ...(progressRow?.metadata ?? {}), intent };
      const row = await patchOwnerProgress(userId, { metadata });
      setProgressRow(row);
    },
    [userId, progressRow]
  );

  const reopen = useCallback(async () => {
    if (!userId) return;
    const row = await patchOwnerProgress(userId, { dismissed_welcome_at: null, checklist_collapsed: false });
    setProgressRow(row);
  }, [userId]);

  return {
    userId,
    loading,
    error,
    steps,
    progressRow,
    dismissWelcome,
    toggleCollapse,
    setIntent,
    reopen,
    refresh: load,
  };
}
