"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import PageLoader from "@/app/components/PageLoader";

const F = {
  ink: "#111827", inkSoft: "#4B5563", muted: "#9CA3AF",
  pink: "#E84677", pinkSoft: "#FDF2F5", pinkBorder: "#FBCFE8",
  green: "#16A34A", greenSoft: "#F0FDF4", greenBorder: "#BBF7D0",
  amber: "#D97706", amberSoft: "#FFFBEB", amberBorder: "#FDE68A",
  line: "#F3F4F6", lineMid: "#E5E7EB", bg: "#fffafc",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "รอยืนยัน", confirmed: "ยืนยันแล้ว", cancelled: "ยกเลิกแล้ว",
  converted: "โอนย้ายแล้ว", expired: "หมดอายุ",
};
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
  pet: { id: number; name: string | null; image_url: string | null; status: string | null } | null;
  buyer: { id: string; full_name: string | null; username: string | null; avatar_url: string | null } | null;
}

export default function FarmReservationsPage() {
  const params = useParams();
  const router = useRouter();
  const farmId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ReservationRow[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    const { data: pets } = await supabase.from("pets").select("id").eq("farm_id", farmId);
    const petIds = (pets || []).map(p => p.id);
    if (petIds.length === 0) { setRows([]); setLoading(false); return; }

    const { data } = await supabase
      .from("pet_reservations")
      .select("id, pet_id, status, created_at, pet:pet_id(id, name, image_url, status), buyer:buyer_id(id, full_name, username, avatar_url)")
      .in("pet_id", petIds)
      .order("created_at", { ascending: false });

    setRows((data || []) as unknown as ReservationRow[]);
    setLoading(false);
  };

  useEffect(() => { if (farmId) load(); }, [farmId]);

  const updateStatus = async (row: ReservationRow, status: "confirmed" | "cancelled") => {
    setBusyId(row.id);
    setError("");
    try {
      const { error: updErr } = await supabase
        .from("pet_reservations")
        .update({ status, confirmed_at: status === "confirmed" ? new Date().toISOString() : null })
        .eq("id", row.id);
      if (updErr) throw updErr;
      await load();
    } catch (e: any) {
      setError(
        e.message?.includes("one_confirmed_reservation")
          ? "สัตว์ตัวนี้มีคนจองที่ยืนยันแล้วอยู่ก่อนแล้ว ยกเลิกรายการเดิมก่อนถึงจะยืนยันรายการใหม่ได้"
          : "ทำรายการไม่สำเร็จ: " + e.message
      );
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <PageLoader />;

  const pending = rows.filter(r => r.status === "pending");
  const others = rows.filter(r => r.status !== "pending");

  const renderRow = (row: ReservationRow) => {
    const buyerName = row.buyer?.full_name || row.buyer?.username || "ผู้ใช้ไม่ระบุชื่อ";
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
          <div className="rv-pet-name">{row.pet?.name || "ไม่ระบุชื่อ"}</div>
          <div className="rv-buyer">
            <div className="rv-buyer-avatar">
              {row.buyer?.avatar_url ? <img src={row.buyer.avatar_url} alt="" /> : (buyerName[0] || "?")}
            </div>
            {buyerName}
          </div>
          <div className="rv-date">{new Date(row.created_at).toLocaleString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
        </div>
        <div className="rv-actions">
          <span className="rv-status" style={{ background: c.bg, color: c.fg, border: `1px solid ${c.bd}` }}>{STATUS_LABEL[row.status] || row.status}</span>
          {row.status === "pending" && (
            <div style={{ display: "flex", gap: 6 }}>
              <button className="rv-btn rv-btn-confirm" disabled={busyId === row.id} onClick={() => updateStatus(row, "confirmed")}>ยืนยัน</button>
              <button className="rv-btn rv-btn-cancel" disabled={busyId === row.id} onClick={() => updateStatus(row, "cancelled")}>ปฏิเสธ</button>
            </div>
          )}
          {row.status === "confirmed" && (
            <button className="rv-btn rv-btn-cancel" disabled={busyId === row.id} onClick={() => updateStatus(row, "cancelled")}>ยกเลิกการจอง</button>
          )}
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
              <div className="rv-title">การจองสัตว์เลี้ยง</div>
              <div className="rv-sub">รายการจองจากผู้ซื้อ — ยืนยันเพื่อปลดล็อกข้อมูลระดับ &quot;ผู้ที่จองไว้&quot;</div>
            </div>
          </div>

          {error && <div className="rv-error">{error}</div>}

          {rows.length === 0 ? (
            <div className="rv-empty">ยังไม่มีใครจองสัตว์เลี้ยงในฟาร์มนี้</div>
          ) : (
            <>
              {pending.length > 0 && (
                <>
                  <div className="rv-sec-label">รอยืนยัน ({pending.length})</div>
                  {pending.map(renderRow)}
                </>
              )}
              {others.length > 0 && (
                <>
                  <div className="rv-sec-label">ประวัติ</div>
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
