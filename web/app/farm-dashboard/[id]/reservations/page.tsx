"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import PageLoader from "@/app/components/PageLoader";
import { useLocale, useTranslations } from "@/i18n/context";
import { PET_STATUS } from "@/lib/constants";
import { useFarmAccess } from "@/app/farm-dashboard/[id]/layout";

const F = {
  ink: "#111827", inkSoft: "#4B5563", muted: "#9CA3AF",
  pink: "#E84677", pinkSoft: "#FDF2F5", pinkBorder: "#FBCFE8",
  green: "#16A34A", greenSoft: "#F0FDF4", greenBorder: "#BBF7D0",
  amber: "#D97706", amberSoft: "#FFFBEB", amberBorder: "#FDE68A",
  line: "#F3F4F6", lineMid: "#E5E7EB", bg: "#fffafc",
};

// ข้อความอยู่ใน messages/*.json → reservations.status_<status>
const STATUS_KEYS = ["pending", "confirmed", "cancelled", "converted", "expired"];
const STATUS_COLOR: Record<string, { bg: string; fg: string; bd: string }> = {
  pending:   { bg: F.amberSoft, fg: F.amber, bd: F.amberBorder },
  confirmed: { bg: F.greenSoft, fg: F.green, bd: F.greenBorder },
  cancelled: { bg: F.line, fg: F.muted, bd: F.lineMid },
  converted: { bg: F.pinkSoft, fg: F.pink, bd: F.pinkBorder },
  expired:   { bg: F.line, fg: F.muted, bd: F.lineMid },
};

interface ReservationRow {
  id: number;
  pet_id: number;
  status: string;
  created_at: string;
  pet: { id: number; name: string | null; image_url: string | null; status: string | null; user_id: string | null } | null;
  buyer: { id: string; full_name: string | null; username: string | null; avatar_url: string | null } | null;
}

export default function FarmReservationsPage() {
  const t = useTranslations("reservations");
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const farmId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ReservationRow[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  // pet_id → transfer ที่ยัง pending (ใช้กันส่งคำขอโอนซ้ำ และแสดงสถานะรอผู้ซื้อยอมรับ)
  const [pendingTransfers, setPendingTransfers] = useState<Record<number, { id: number; to_user_id: string; reservation_id: number | null }>>({});
  const { myRole } = useFarmAccess();
  // ตรงกับเงื่อนไขใน farm_set_reservation_status(): owner/manager เท่านั้น
  const canDecide = myRole === "owner" || myRole === "manager";

  const load = async () => {
    const { data: pets } = await supabase.from("pets").select("id").eq("farm_id", farmId);
    const petIds = (pets || []).map(p => p.id);
    if (petIds.length === 0) { setRows([]); setLoading(false); return; }

    const { data } = await supabase
      .from("pet_reservations")
      .select("id, pet_id, status, created_at, pet:pet_id(id, name, image_url, status, user_id), buyer:buyer_id(id, full_name, username, avatar_url)")
      .in("pet_id", petIds)
      .order("created_at", { ascending: false });

    const { data: transfers } = await supabase
      .from("pet_ownership_transfers")
      .select("id, pet_id, to_user_id, reservation_id")
      .in("pet_id", petIds)
      .eq("status", "pending");
    const byPet: Record<number, { id: number; to_user_id: string; reservation_id: number | null }> = {};
    (transfers || []).forEach(t => { byPet[t.pet_id] = { id: t.id, to_user_id: t.to_user_id, reservation_id: t.reservation_id }; });
    setPendingTransfers(byPet);

    setRows((data || []) as unknown as ReservationRow[]);
    setLoading(false);
  };

  useEffect(() => { if (farmId) load(); }, [farmId]);

  const updateStatus = async (row: ReservationRow, status: "confirmed" | "cancelled") => {
    if (busyId !== null) return; // กันกดซ้ำระหว่างรอผล
    setBusyId(row.id);
    setError("");
    try {
      // ทางหลัก: RPC อัปเดตการจอง + สถานะสัตว์ใน transaction เดียว (supabase/migrations/20261029_reservation_transfer_pipeline.sql)
      const { error: rpcErr } = await supabase.rpc("farm_set_reservation_status", { p_reservation_id: row.id, p_status: status });
      if (rpcErr && rpcErr.code !== "PGRST202") throw rpcErr;

      if (rpcErr?.code === "PGRST202") {
        // ยังไม่ได้ติดตั้ง migration — ใช้วิธีเดิม (ไม่ atomic) แต่ตรวจผลทุกขั้นและอิงสถานะจริงจาก DB ไม่ใช่ค่าในหน้าจอ
        const { data: current, error: curErr } = await supabase.from("pet_reservations").select("status").eq("id", row.id).single();
        if (curErr) throw curErr;
        if (current.status === status) { await load(); return; }
        const { error: updErr } = await supabase
          .from("pet_reservations")
          .update({ status, confirmed_at: status === "confirmed" ? new Date().toISOString() : null })
          .eq("id", row.id)
          .eq("status", current.status);
        if (updErr) throw updErr;

        const nextPetStatus = status === "confirmed" ? PET_STATUS.RESERVED
          : current.status === "confirmed" ? PET_STATUS.OPEN_RESERVE : null;
        if (nextPetStatus) {
          const { error: petErr } = await supabase.from("pets").update({ status: nextPetStatus }).eq("id", row.pet_id);
          if (petErr) {
            // ย้อนรายการจองกลับ เพื่อไม่ให้เกิด "จองสำเร็จแต่สัตว์ยังพร้อมขาย"
            await supabase.from("pet_reservations").update({ status: current.status }).eq("id", row.id);
            throw petErr;
          }
        }
      }

      await load();
    } catch (e: any) {
      setError(
        e.message?.includes("one_confirmed_reservation")
          ? t("errAlreadyConfirmed")
          : e.message?.includes("forbidden")
          ? t("errForbidden")
          : t("errFailed") + e.message
      );
      await load();
    } finally {
      setBusyId(null);
    }
  };

  // ─── จองยืนยันแล้ว → ส่งคำขอโอนเจ้าของให้ผู้จอง (ใช้ pet_ownership_transfers เดิม ผู้ซื้อต้องกดยอมรับเอง) ───
  const sendTransfer = async (row: ReservationRow) => {
    if (busyId !== null || !row.buyer || !row.pet?.user_id) return;
    if (row.buyer.id === row.pet.user_id) { setError(t("errSelf")); return; }
    setBusyId(row.id);
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: existing } = await supabase.from("pet_ownership_transfers")
        .select("id").eq("pet_id", row.pet_id).eq("status", "pending").maybeSingle();
      if (existing) { await load(); return; } // มีคำขอค้างอยู่แล้ว ไม่สร้างซ้ำ
      const { error: insErr } = await supabase.from("pet_ownership_transfers").insert({
        pet_id: row.pet_id,
        from_user_id: row.pet.user_id,
        to_user_id: row.buyer.id,
        initiated_by: session?.user.id,
        status: "pending",
        reservation_id: row.id,
      });
      if (insErr) throw insErr;
      await load();
    } catch (e) {
      setError(t("errTransfer") + (e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e)));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <PageLoader />;

  const pending = rows.filter(r => r.status === "pending");
  const others = rows.filter(r => r.status !== "pending");

  const renderRow = (row: ReservationRow) => {
    const buyerName = row.buyer?.full_name || row.buyer?.username || t("noBuyerName");
    const c = STATUS_COLOR[row.status] || STATUS_COLOR.pending;
    return (
      <div key={row.id} className="rv-row">
        <Link href={`/pets/${row.pet_id}`} className="rv-pet-thumb">
          {row.pet?.image_url
            ? <img src={row.pet.image_url} alt={row.pet.name || ""} />
            : <img className="rv-pet-thumb-placeholder" src="/icons/icon-paw-pink.png" alt="" />
          }
        </Link>
        <div className="rv-info">
          <div className="rv-pet-name">{row.pet?.name || t("noName")}</div>
          <div className="rv-buyer">
            <div className="rv-buyer-avatar">
              {row.buyer?.avatar_url ? <img src={row.buyer.avatar_url} alt="" /> : (buyerName[0] || "?")}
            </div>
            {buyerName}
          </div>
          <div className="rv-date">{new Date(row.created_at).toLocaleString((locale === "en" ? "en-GB" : "th-TH"), { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
        </div>
        <div className="rv-actions">
          <span className="rv-status" style={{ background: c.bg, color: c.fg, border: `1px solid ${c.bd}` }}>{STATUS_KEYS.includes(row.status) ? t("status_" + row.status) : row.status}</span>
          {canDecide && row.status === "pending" && (
            <div style={{ display: "flex", gap: 6 }}>
              <button className="rv-btn rv-btn-confirm" disabled={busyId === row.id} onClick={() => updateStatus(row, "confirmed")}>{t("confirm")}</button>
              <button className="rv-btn rv-btn-cancel" disabled={busyId === row.id} onClick={() => updateStatus(row, "cancelled")}>{t("reject")}</button>
            </div>
          )}
          {canDecide && row.status === "confirmed" && (() => {
            const pt = pendingTransfers[row.pet_id];
            if (pt && pt.to_user_id === row.buyer?.id) {
              return <span className="rv-date">{t("transferSent")}</span>;
            }
            return (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {myRole === "owner" && !pt && (
                  <button className="rv-btn rv-btn-confirm" disabled={busyId === row.id} onClick={() => sendTransfer(row)}>{t("sendTransfer")}</button>
                )}
                <button className="rv-btn rv-btn-cancel" disabled={busyId === row.id || !!pt} onClick={() => updateStatus(row, "cancelled")}>{t("cancel")}</button>
              </div>
            );
          })()}
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .rv-page { font-family: inherit; min-height: 100vh; background: ${F.bg}; color: ${F.ink}; }
        .rv-body { max-width: 720px; margin: 0 auto; padding: 24px 16px calc(68px + env(safe-area-inset-bottom,0px) + 24px); }
        .rv-top { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
        .rv-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid ${F.lineMid}; flex-shrink: 0; }
        .rv-title { font-size: 22px; font-weight: 700; color: ${F.ink}; }
        .rv-sub { font-size: 12px; color: ${F.muted}; margin-top: 2px; }

        .rv-sec-label { font-size: 13px; font-weight: 700; color: ${F.inkSoft}; margin: 20px 0 10px; }
        .rv-error { background: #FEF2F2; border: 1px solid #FECACA; color: #DC2626; border-radius: 12px; padding: 12px 16px; font-size: 13px; margin-bottom: 16px; }

        .rv-row { display: flex; align-items: center; gap: 12px; background: white; border: 1px solid ${F.lineMid}; border-radius: 14px; padding: 12px 14px; margin-bottom: 8px; }
        .rv-pet-thumb { width: 48px; height: 48px; border-radius: 50%; overflow: hidden; background: ${F.line}; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .rv-pet-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .rv-pet-thumb-placeholder { width: 55%; height: 55%; opacity: .3; object-fit: contain; }
        .rv-info { flex: 1; min-width: 0; }
        .rv-pet-name { font-size: 13.5px; font-weight: 700; color: ${F.ink}; }
        .rv-buyer { display: flex; align-items: center; gap: 6px; font-size: 12px; color: ${F.inkSoft}; margin-top: 3px; }
        .rv-buyer-avatar { width: 18px; height: 18px; border-radius: 50%; background: ${F.pinkSoft}; color: ${F.pink}; font-size: 9px; font-weight: 700; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
        .rv-buyer-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .rv-date { font-size: 10.5px; color: ${F.muted}; margin-top: 2px; }
        .rv-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
        .rv-status { font-size: 10.5px; font-weight: 700; padding: 3px 9px; border-radius: 999px; white-space: nowrap; }
        .rv-btn { font-family: inherit; font-size: 11px; font-weight: 700; padding: 6px 12px; border-radius: 8px; border: none; cursor: pointer; }
        .rv-btn:disabled { opacity: .5; cursor: not-allowed; }
        .rv-btn-confirm { background: ${F.green}; color: white; }
        .rv-btn-cancel { background: white; color: #DC2626; border: 1px solid #FCA5A5; }

        .rv-empty { text-align: center; padding: 48px 20px; color: ${F.muted}; font-size: 14px; background: white; border: 1px dashed ${F.lineMid}; border-radius: 16px; }
      `}</style>

      <div className="rv-page">
        <div className="rv-body">
          <div className="rv-top">
            <button className="rv-back" onClick={() => router.push(`/farm-dashboard/${farmId}`)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div>
              <div className="rv-title">{t("title")}</div>
              <div className="rv-sub">{t("sub")}</div>
            </div>
          </div>

          {error && <div className="rv-error">{error}</div>}

          {rows.length === 0 ? (
            <div className="rv-empty">{t("empty")}</div>
          ) : (
            <>
              {pending.length > 0 && (
                <>
                  <div className="rv-sec-label">{t("status_pending")} ({pending.length})</div>
                  {pending.map(renderRow)}
                </>
              )}
              {others.length > 0 && (
                <>
                  <div className="rv-sec-label">{t("history")}</div>
                  {others.map(renderRow)}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
