"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PageLoader from "@/app/components/PageLoader";
import { speciesTh } from "@/lib/species";
import { useServiceAccess } from "../layout";
import type { ServiceBooking } from "@/lib/types";

const F = {
  ink: "#111827", inkSoft: "#4B5563", muted: "#9CA3AF",
  blue: "#2563EB", blueSoft: "#EFF6FF", blueBorder: "#BFDBFE",
  green: "#16A34A", greenSoft: "#F0FDF4", greenBorder: "#BBF7D0",
  amber: "#D97706", amberSoft: "#FFFBEB", amberBorder: "#FDE68A",
  line: "#F3F4F6", lineMid: "#E5E7EB", bg: "#fffafc",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "รอดำเนินการ", confirmed: "ยืนยันแล้ว", cancelled: "ยกเลิกแล้ว", completed: "เสร็จสิ้น",
};
const STATUS_COLOR: Record<string, { bg: string; fg: string; bd: string }> = {
  pending:   { bg: F.amberSoft, fg: F.amber, bd: F.amberBorder },
  confirmed: { bg: F.greenSoft, fg: F.green, bd: F.greenBorder },
  cancelled: { bg: F.line, fg: F.muted, bd: F.lineMid },
  completed: { bg: F.blueSoft, fg: F.blue, bd: F.blueBorder },
};

const TABS = ["all", "pending", "confirmed", "completed", "cancelled"] as const;
const TAB_LABEL: Record<typeof TABS[number], string> = {
  all: "ทั้งหมด", pending: "รอดำเนินการ", confirmed: "ยืนยันแล้ว", completed: "เสร็จสิ้น", cancelled: "ยกเลิกแล้ว",
};

function ServiceBookingsContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = params.id as string;
  const fromPage = searchParams.get("from") || "profile";
  const { myRole } = useServiceAccess();
  const canManage = myRole === "owner" || myRole === "manager";

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ServiceBooking[]>([]);
  const [tab, setTab] = useState<typeof TABS[number]>("all");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("service_bookings")
      .select("id, booking_date, booking_time, service_type, status, notes, created_at, pets(name, species), buyer:buyer_id(id, full_name, username, avatar_url)")
      .eq("service_id", serviceId)
      .order("booking_date", { ascending: true });
    setRows((data || []) as unknown as ServiceBooking[]);
    setLoading(false);
  };

  useEffect(() => { if (serviceId) load(); }, [serviceId]);

  const updateStatus = async (row: ServiceBooking, status: "confirmed" | "cancelled" | "completed") => {
    setBusyId(row.id);
    setError("");
    try {
      const { error: updErr } = await supabase.from("service_bookings").update({ status }).eq("id", row.id);
      if (updErr) throw updErr;
      await load();
    } catch (e: any) {
      setError("ทำรายการไม่สำเร็จ: " + e.message);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <PageLoader />;

  const filtered = tab === "all" ? rows : rows.filter(r => r.status === tab);

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .bk-page { font-family: inherit; min-height: 100vh; background: ${F.bg}; color: ${F.ink}; }
        .bk-body { max-width: 720px; margin: 0 auto; padding: 24px 16px calc(68px + env(safe-area-inset-bottom,0px) + 24px); }
        .bk-top { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
        .bk-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid ${F.lineMid}; flex-shrink: 0; }
        .bk-title { font-size: 22px; font-weight: 700; color: ${F.ink}; }
        .bk-sub { font-size: 12px; color: ${F.muted}; margin-top: 2px; }

        .bk-tabs { display: flex; gap: 6px; margin-bottom: 16px; overflow-x: auto; }
        .bk-tab { font-family: inherit; font-size: 12.5px; font-weight: 700; padding: 8px 14px; border-radius: 999px; border: 1px solid ${F.lineMid}; background: white; color: ${F.inkSoft}; cursor: pointer; white-space: nowrap; }
        .bk-tab.active { background: ${F.blue}; color: white; border-color: ${F.blue}; }

        .bk-error { background: #FEF2F2; border: 1px solid #FECACA; color: #DC2626; border-radius: 12px; padding: 12px 16px; font-size: 13px; margin-bottom: 16px; }

        .bk-row { background: white; border: 1px solid ${F.lineMid}; border-radius: 14px; padding: 14px 16px; margin-bottom: 8px; }
        .bk-row-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
        .bk-pet-name { font-size: 13.5px; font-weight: 700; color: ${F.ink}; }
        .bk-pet-species { font-size: 10.5px; color: ${F.muted}; }
        .bk-status { font-size: 10.5px; font-weight: 700; padding: 3px 9px; border-radius: 999px; white-space: nowrap; flex-shrink: 0; }
        .bk-meta { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; font-size: 12px; color: ${F.inkSoft}; }
        .bk-buyer { display: flex; align-items: center; gap: 6px; }
        .bk-buyer-avatar { width: 18px; height: 18px; border-radius: 50%; background: ${F.blueSoft}; color: ${F.blue}; font-size: 9px; font-weight: 700; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
        .bk-buyer-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .bk-notes { font-size: 12px; color: ${F.muted}; margin-top: 8px; background: ${F.line}; border-radius: 10px; padding: 8px 10px; }
        .bk-actions { display: flex; gap: 6px; margin-top: 10px; }
        .bk-btn { font-family: inherit; font-size: 11px; font-weight: 700; padding: 6px 12px; border-radius: 8px; border: none; cursor: pointer; }
        .bk-btn:disabled { opacity: .5; cursor: not-allowed; }
        .bk-btn-confirm { background: ${F.green}; color: white; }
        .bk-btn-complete { background: ${F.blue}; color: white; }
        .bk-btn-cancel { background: white; color: #DC2626; border: 1px solid #FCA5A5; }

        .bk-empty { text-align: center; padding: 48px 20px; color: ${F.muted}; font-size: 14px; background: white; border: 1px dashed ${F.lineMid}; border-radius: 16px; }
      `}</style>

      <div className="bk-page">
        <div className="bk-body">
          <div className="bk-top">
            <button className="bk-back" onClick={() => router.push(`/service-dashboard/${serviceId}?from=${fromPage}`)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div>
              <div className="bk-title">รายการจอง</div>
              <div className="bk-sub">คำขอจองบริการจากลูกค้า</div>
            </div>
          </div>

          <div className="bk-tabs">
            {TABS.map(t => (
              <button key={t} className={`bk-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{TAB_LABEL[t]}</button>
            ))}
          </div>

          {error && <div className="bk-error">{error}</div>}

          {filtered.length === 0 ? (
            <div className="bk-empty">ยังไม่มีการจองในหมวดนี้</div>
          ) : (
            filtered.map(row => {
              const buyerName = row.buyer?.full_name || row.buyer?.username || "ผู้ใช้ไม่ระบุชื่อ";
              const c = STATUS_COLOR[row.status] || STATUS_COLOR.pending;
              return (
                <div key={row.id} className="bk-row">
                  <div className="bk-row-top">
                    <div>
                      <div className="bk-pet-name">{row.service_type || "บริการ"}{row.pets?.name ? ` • ${row.pets.name}` : ""}</div>
                      {row.pets?.species && <div className="bk-pet-species">{speciesTh(row.pets.species)}</div>}
                    </div>
                    <span className="bk-status" style={{ background: c.bg, color: c.fg, border: `1px solid ${c.bd}` }}>{STATUS_LABEL[row.status] || row.status}</span>
                  </div>
                  <div className="bk-meta">
                    <div className="bk-buyer">
                      <div className="bk-buyer-avatar">
                        {row.buyer?.avatar_url ? <img src={row.buyer.avatar_url} alt="" /> : (buyerName[0] || "?")}
                      </div>
                      {buyerName}
                    </div>
                    <span>{new Date(row.booking_date).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}{row.booking_time ? ` • ${row.booking_time.slice(0, 5)} น.` : ""}</span>
                  </div>
                  {row.notes && <div className="bk-notes">{row.notes}</div>}
                  {canManage && row.status === "pending" && (
                    <div className="bk-actions">
                      <button className="bk-btn bk-btn-confirm" disabled={busyId === row.id} onClick={() => updateStatus(row, "confirmed")}>ยืนยัน</button>
                      <button className="bk-btn bk-btn-cancel" disabled={busyId === row.id} onClick={() => updateStatus(row, "cancelled")}>ปฏิเสธ</button>
                    </div>
                  )}
                  {canManage && row.status === "confirmed" && (
                    <div className="bk-actions">
                      <button className="bk-btn bk-btn-complete" disabled={busyId === row.id} onClick={() => updateStatus(row, "completed")}>เสร็จสิ้น</button>
                      <button className="bk-btn bk-btn-cancel" disabled={busyId === row.id} onClick={() => updateStatus(row, "cancelled")}>ยกเลิก</button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

export default function ServiceBookingsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ServiceBookingsContent />
    </Suspense>
  );
}
