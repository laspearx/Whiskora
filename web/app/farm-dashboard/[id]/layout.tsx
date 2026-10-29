"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PageLoader from "@/app/components/PageLoader";
import FarmBottomNav from "@/app/components/FarmBottomNav";

export type FarmRole = "owner" | "manager" | "staff" | "viewer";

// หน้าที่สร้าง/แก้ข้อมูลในนามเจ้าของฟาร์ม (insert ใช้ user_id ของผู้กด และหน้า edit/verify แก้ข้อมูลส่วนตัวของเจ้าของ)
// จึงจำกัดเฉพาะ owner ไว้ก่อน — ไม่ขยายให้ทุกบทบาทเท่ากัน จนกว่า RLS/insert จะรองรับการทำแทนเจ้าของ
const OWNER_ONLY_SUFFIXES = ["/edit", "/verify", "/pets/create", "/pets/bulk-create", "/litters/create"];

export const canEditFarmProfile = (role: FarmRole) => role === "owner";

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
  const pathname = usePathname();

  const [role, setRole] = useState<FarmRole | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!farmId) return;

    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`); return; }

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

  const base = `/farm-dashboard/${farmId}`;
  const sub = pathname.slice(pathname.indexOf(base) + base.length);
  const ownerOnlyBlocked = role !== "owner" && OWNER_ONLY_SUFFIXES.includes(sub);

  return (
    <FarmAccessContext.Provider value={{ farmId, myRole: role! }}>
      {ownerOnlyBlocked ? (
        <div style={{ maxWidth: 480, margin: "48px auto", padding: "24px 20px", textAlign: "center", background: "#fff", border: "1px solid #FBCFE8", borderRadius: 16 }}>
          <div style={{ fontWeight: 700, color: "#111827" }}>หน้านี้สำหรับเจ้าของฟาร์มเท่านั้น</div>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 6 }}>บทบาทของคุณ ({role}) ดูข้อมูลฟาร์มได้ แต่การแก้ไขส่วนนี้ต้องให้เจ้าของฟาร์มทำ</p>
          <button onClick={() => router.push(base)} style={{ marginTop: 14, padding: "8px 18px", borderRadius: 10, background: "#E84677", color: "#fff", fontWeight: 700, fontSize: 13 }}>กลับหน้าฟาร์ม</button>
        </div>
      ) : children}
      <FarmBottomNav farmId={farmId} />
    </FarmAccessContext.Provider>
  );
}
