"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PageLoader from "@/app/components/PageLoader";

const F = {
  ink: "#1f1a1c", inkSoft: "#4a3f44", muted: "#8e7e84",
  pink: "#e84677", pinkSoft: "#fde2ea", pinkBorder: "#FBCFE8",
  line: "#f3dde3", lineMid: "#E5E7EB", bg: "#fffafc",
};

interface TransferRow {
  transfer_id: number;
  pet_id: number;
  pet_name: string | null;
  pet_image_url: string | null;
  pet_breed: string | null;
  from_user_id: string;
  from_name: string | null;
  initiated_at: string;
}

export default function MyTransfersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<TransferRow[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login?redirect=/profile/transfers"); return; }
    const { data } = await supabase.rpc("get_my_pending_transfers");
    setRows((data || []) as TransferRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const respond = async (row: TransferRow, status: "accepted" | "declined") => {
    setBusyId(row.transfer_id);
    setError("");
    try {
      const { error: updErr } = await supabase
        .from("pet_ownership_transfers")
        .update({ status })
        .eq("id", row.transfer_id);
      if (updErr) throw updErr;
      if (status === "accepted") {
        router.push(`/pets/${row.pet_id}`);
        return;
      }
      setRows(prev => prev.filter(r => r.transfer_id !== row.transfer_id));
    } catch (e: any) {
      setError("ทำรายการไม่สำเร็จ: " + e.message);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .tf-page { font-family: inherit; min-height: 100vh; background: ${F.bg}; color: ${F.ink}; }
        .tf-body { max-width: 560px; margin: 0 auto; padding: 24px 16px calc(68px + env(safe-area-inset-bottom,0px) + 24px); }
        .tf-top { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
        .tf-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid ${F.lineMid}; flex-shrink: 0; }
        .tf-title { font-size: 22px; font-weight: 700; color: ${F.ink}; }
        .tf-sub { font-size: 12px; color: ${F.muted}; margin-top: 2px; }

        .tf-error { background: #FEF2F2; border: 1px solid #FECACA; color: #DC2626; border-radius: 12px; padding: 12px 16px; font-size: 13px; margin-bottom: 16px; }

        .tf-card { background: white; border: 1px solid ${F.pinkBorder}; border-radius: 16px; padding: 16px; margin-bottom: 12px; }
        .tf-row { display: flex; align-items: center; gap: 12px; }
        .tf-thumb { width: 56px; height: 56px; border-radius: 14px; overflow: hidden; background: ${F.line}; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .tf-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .tf-thumb-placeholder { width: 55%; height: 55%; opacity: .3; object-fit: contain; }
        .tf-info { flex: 1; min-width: 0; }
        .tf-pet-name { font-size: 15px; font-weight: 700; color: ${F.ink}; }
        .tf-pet-breed { font-size: 12px; color: ${F.muted}; margin-top: 2px; }
        .tf-from { font-size: 12px; color: ${F.inkSoft}; margin-top: 6px; }
        .tf-from b { color: ${F.pink}; }
        .tf-date { font-size: 10.5px; color: ${F.muted}; margin-top: 2px; }

        .tf-actions { display: flex; gap: 10px; margin-top: 14px; }
        .tf-btn { flex: 1; padding: 12px; border-radius: 12px; border: none; font-family: inherit; font-size: 13.5px; font-weight: 700; cursor: pointer; }
        .tf-btn:disabled { opacity: .5; cursor: not-allowed; }
        .tf-btn-accept { background: ${F.pink}; color: white; }
        .tf-btn-decline { background: #F3F4F6; color: ${F.muted}; }

        .tf-empty { text-align: center; padding: 48px 20px; color: ${F.muted}; font-size: 14px; background: white; border: 1px dashed ${F.lineMid}; border-radius: 16px; }
      `}</style>

      <div className="tf-page">
        <div className="tf-body">
          <div className="tf-top">
            <button className="tf-back" onClick={() => router.push('/profile/pets')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div>
              <div className="tf-title">คำขอโอนย้ายสัตว์เลี้ยง</div>
              <div className="tf-sub">กดยืนยันเพื่อรับสิทธิ์เจ้าของ หรือปฏิเสธถ้าไม่ใช่คุณ</div>
            </div>
          </div>

          {error && <div className="tf-error">{error}</div>}

          {rows.length === 0 ? (
            <div className="tf-empty">ไม่มีคำขอโอนย้ายที่รอดำเนินการ</div>
          ) : (
            rows.map(row => (
              <div key={row.transfer_id} className="tf-card">
                <div className="tf-row">
                  <div className="tf-thumb">
                    {row.pet_image_url
                      ? <img src={row.pet_image_url} alt={row.pet_name || ""} />
                      : <img className="tf-thumb-placeholder" src="/icons/icon-paw-pink.png" alt="" />
                    }
                  </div>
                  <div className="tf-info">
                    <div className="tf-pet-name">{row.pet_name || "ไม่ระบุชื่อ"}</div>
                    {row.pet_breed && <div className="tf-pet-breed">{row.pet_breed}</div>}
                    <div className="tf-from">จาก <b>{row.from_name || "ผู้ใช้"}</b></div>
                    <div className="tf-date">{new Date(row.initiated_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</div>
                  </div>
                </div>
                <div className="tf-actions">
                  <button className="tf-btn tf-btn-decline" disabled={busyId === row.transfer_id} onClick={() => respond(row, "declined")}>ปฏิเสธ</button>
                  <button className="tf-btn tf-btn-accept" disabled={busyId === row.transfer_id} onClick={() => respond(row, "accepted")}>
                    {busyId === row.transfer_id ? "กำลังยืนยัน..." : "ยืนยันรับสิทธิ์"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
