"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PageLoader from "@/app/components/PageLoader";
import FarmBottomNav from "@/app/components/FarmBottomNav";

export type FarmRole = "owner" | "manager" | "staff" | "viewer";

interface FarmAccessContextValue {
  farmId: string;
  myRole: FarmRole;
}

const FarmAccessContext = createContext<FarmAccessContextValue | null>(null);

export function useFarmAccess() {
  const ctx = useContext(FarmAccessContext);
  if (!ctx) throw new Error("useFarmAccess must be used inside farm-dashboard layout");
  return ctx;
}

export default function FarmDashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const farmId = params?.id as string;

  const [role, setRole] = useState<FarmRole | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!farmId) return;

    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const uid = session.user.id;

      // Check workspace membership first (new system)
      const { data: wsRow } = await supabase
        .from("workspaces")
        .select("id, workspace_members!inner(role)")
        .eq("type", "farm")
        .eq("entity_id", parseInt(farmId))
        .eq("workspace_members.user_id", uid)
        .maybeSingle();

      if (wsRow) {
        const memberRole = (wsRow as any).workspace_members?.[0]?.role ?? "viewer";
        setRole(memberRole as FarmRole);
        setChecking(false);
        return;
      }

      // Fallback: check direct farm ownership (legacy, before workspace backfill)
      const { data: farmRow } = await supabase
        .from("farms")
        .select("id")
        .eq("id", farmId)
        .eq("user_id", uid)
        .maybeSingle();

      if (farmRow) {
        setRole("owner");
        setChecking(false);
        return;
      }

      // No access
      router.push("/partner");
    };

    check();
  }, [farmId, router]);

  if (checking) return <PageLoader />;

  return (
    <FarmAccessContext.Provider value={{ farmId, myRole: role! }}>
      {children}
      <FarmBottomNav farmId={farmId} />
    </FarmAccessContext.Provider>
  );
}
