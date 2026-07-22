"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PageLoader from "@/app/components/PageLoader";
import DefaultBottomNav from "@/app/components/DefaultBottomNav";

export type ShopRole = "owner" | "admin" | "staff" | "viewer";

interface ShopAccessContextValue {
  shopId: string;
  myRole: ShopRole;
}

const ShopAccessContext = createContext<ShopAccessContextValue | null>(null);

export function useShopAccess() {
  const ctx = useContext(ShopAccessContext);
  if (!ctx) throw new Error("useShopAccess must be used inside shop-dashboard layout");
  return ctx;
}

export default function ShopDashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const shopId = params?.id as string;

  const [role, setRole] = useState<ShopRole | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!shopId) return;
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const uid = session.user.id;

      const { data: wsRow } = await supabase
        .from("workspaces")
        .select("id, workspace_members!inner(role)")
        .eq("type", "shop")
        .eq("entity_id", parseInt(shopId))
        .eq("workspace_members.user_id", uid)
        .maybeSingle();

      if (wsRow) {
        setRole(((wsRow as any).workspace_members?.[0]?.role ?? "viewer") as ShopRole);
        setChecking(false);
        return;
      }

      const { data: shopRow } = await supabase
        .from("shops").select("id").eq("id", shopId).eq("user_id", uid).maybeSingle();

      if (shopRow) { setRole("owner"); setChecking(false); return; }
      router.push("/partner");
    };
    check();
  }, [shopId, router]);

  if (checking) return <PageLoader />;

  return (
    <ShopAccessContext.Provider value={{ shopId, myRole: role! }}>
      {children}
      <DefaultBottomNav />
    </ShopAccessContext.Provider>
  );
}
