"use client";

// Shows a link to /profile/invitations when the signed-in user has pending business invitations (in-app only).
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function WorkspaceInvitationsBanner() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    supabase.rpc("get_my_workspace_invitations").then(({ data, error }) => {
      if (!error) setCount((data || []).length);
    });
  }, []);

  if (count === 0) return null;
  return (
    <Link href="/profile/invitations" data-testid="invitations-banner" style={{
      display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", marginBottom: 14, borderRadius: 14,
      background: "#fde2ea", border: "1px solid #FBCFE8", color: "#c4325f", textDecoration: "none",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>มีคำเชิญเข้าร่วมทีมธุรกิจ {count} รายการ</div>
        <div style={{ fontSize: 11, color: "#4a3f44", marginTop: 2 }}>แตะเพื่อดูรายละเอียดและตอบรับหรือปฏิเสธ</div>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="m9 18 6-6-6-6"/></svg>
    </Link>
  );
}
