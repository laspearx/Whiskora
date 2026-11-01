"use client";

// Invitations to join a farm / shop / service team. Accept / decline go through respond_workspace_invitation, which
// re-checks the inviter's current rights; the page shows the server's outcome, never an assumed success.
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PageLoader from "@/app/components/PageLoader";
import { memberErrorText } from "@/app/components/WorkspaceMembersPanel";

const F = { ink: "#1f1a1c", inkSoft: "#4a3f44", muted: "#8e7e84", pink: "#e84677", line: "#f3dde3", lineMid: "#E5E7EB", bg: "#fffafc" };

const ROLE_LABEL: Record<string, string> = { manager: "ผู้จัดการ", staff: "สตาฟ", viewer: "ผู้ดู" };
const TYPE_LABEL: Record<string, string> = { farm: "ฟาร์ม", shop: "ร้าน", service: "กิจการบริการ" };

const OUTCOME: Record<string, { ok: boolean; text: string }> = {
  accepted: { ok: true, text: "เข้าร่วมทีมแล้ว" },
  declined: { ok: true, text: "ปฏิเสธคำเชิญแล้ว" },
  expired: { ok: false, text: "คำเชิญนี้หมดอายุแล้ว — ขอให้ผู้เชิญส่งใหม่" },
  invalid_inviter: { ok: false, text: "ผู้เชิญไม่มีสิทธิ์ให้บทบาทนี้แล้ว คำเชิญจึงถูกยกเลิก — ยังไม่ได้เข้าร่วมทีม" },
  already_member: { ok: false, text: "คุณเป็นสมาชิกของธุรกิจนี้อยู่แล้ว — บทบาทเดิมไม่เปลี่ยน" },
};

interface InvitationRow {
  invitation_id: string; workspace_id: string; workspace_type: string; business_name: string | null;
  role: string; invited_by_name: string | null; created_at: string; expires_at: string;
}

export default function MyInvitationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<InvitationRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_my_workspace_invitations");
    if (error) setNotice({ ok: false, text: "โหลดคำเชิญไม่สำเร็จ — ลองใหม่อีกครั้ง" });
    setRows((data || []) as InvitationRow[]);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login?redirect=/profile/invitations"); return; }
      await load();
      setLoading(false);
    })();
  }, [load, router]);

  const respond = async (row: InvitationRow, action: "accept" | "decline") => {
    if (busyId) return;
    setBusyId(row.invitation_id); setNotice(null);
    const { data, error } = await supabase.rpc("respond_workspace_invitation", { p_invitation: row.invitation_id, p_action: action });
    await load();
    setBusyId(null);
    if (error) { setNotice({ ok: false, text: memberErrorText(error) }); return; }
    const outcome = OUTCOME[data as string] ?? { ok: false, text: "ไม่ทราบผลลัพธ์ — โหลดหน้าใหม่เพื่อตรวจสอบ" };
    setNotice({ ...outcome, text: data === "accepted" ? `เข้าร่วม${row.business_name || "ทีม"}เป็น${ROLE_LABEL[row.role] || row.role}แล้ว` : outcome.text });
  };

  if (loading) return <PageLoader />;

  return (
    <main style={{ minHeight: "100vh", background: F.bg, color: F.ink }}>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 16px calc(68px + env(safe-area-inset-bottom,0px) + 24px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <button onClick={() => router.back()} aria-label="ย้อนกลับ" style={{ width: 40, height: 40, borderRadius: 12, border: `1px solid ${F.lineMid}`, background: "white", cursor: "pointer", color: F.inkSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>คำเชิญเข้าร่วมทีม</h1>
            <p style={{ fontSize: 12, color: F.muted, margin: "2px 0 0" }}>ตรวจสอบธุรกิจ ผู้เชิญ และบทบาทก่อนตอบรับ</p>
          </div>
        </div>

        {notice && (
          <div role={notice.ok ? "status" : "alert"} data-testid="invitation-notice" style={{
            borderRadius: 12, padding: "10px 14px", fontSize: 13, marginBottom: 14,
            background: notice.ok ? "#F0FDFA" : "#FEF2F2", color: notice.ok ? "#0D9488" : "#B91C1C", border: `1px solid ${notice.ok ? "#99F6E4" : "#FECACA"}`,
          }}>{notice.text}</div>
        )}

        {rows.length === 0 && <div style={{ padding: "28px 16px", textAlign: "center", color: F.muted, fontSize: 13, background: "white", border: `1px solid ${F.lineMid}`, borderRadius: 16 }}>ไม่มีคำเชิญที่รอตอบรับ</div>}

        {rows.map((r) => (
          <div key={r.invitation_id} data-testid="my-invitation" style={{ background: "white", border: `1px solid ${F.lineMid}`, borderRadius: 16, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: F.muted, fontWeight: 700 }}>{TYPE_LABEL[r.workspace_type] || r.workspace_type}</div>
            <div style={{ fontSize: 16, fontWeight: 700, margin: "2px 0 6px" }}>{r.business_name || "—"}</div>
            <div style={{ fontSize: 13, color: F.inkSoft, lineHeight: 1.6 }}>
              {r.invited_by_name || "ผู้ใช้"} เชิญคุณเป็น <b>{ROLE_LABEL[r.role] || r.role}</b><br />
              <span style={{ fontSize: 11, color: F.muted }}>หมดอายุ {new Date(r.expires_at).toLocaleDateString("th-TH")}</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => respond(r, "decline")} disabled={!!busyId} style={{ flex: 1, padding: 11, borderRadius: 12, border: `1px solid ${F.lineMid}`, background: "white", color: F.inkSoft, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>ปฏิเสธ</button>
              <button onClick={() => respond(r, "accept")} disabled={!!busyId} style={{ flex: 1, padding: 11, borderRadius: 12, border: "none", background: F.pink, color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>{busyId === r.invitation_id ? "..." : "ตอบรับ"}</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
