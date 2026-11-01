"use client";

// Members of a farm / shop / service, managed only through the workspace RPCs (docs/WORKSPACE_MEMBERS_DESIGN.md).
// The server decides every permission; this panel shows what the server returns after each action and never
// claims success on a refusal. The caller's role comes from list_workspace_members (owner = the business owner,
// with or without an owner row).
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { searchUsersForInvite } from "@/lib/profile";
import PageLoader from "@/app/components/PageLoader";

const F = {
  ink: "#111827", inkSoft: "#4B5563", muted: "#9CA3AF",
  pink: "#E84677", pinkSoft: "#FDF2F5", pinkBorder: "#FBCFE8", pinkDeep: "#C4325F",
  teal: "#0D9488", tealSoft: "#F0FDFA",
  line: "#F3F4F6", lineMid: "#E5E7EB", bg: "#fffafc",
};

export type BusinessType = "farm" | "shop" | "service";
type Role = "owner" | "manager" | "staff" | "viewer";
type Assignable = Exclude<Role, "owner">;

const ROLE_LABEL: Record<Role, string> = { owner: "เจ้าของ", manager: "ผู้จัดการ", staff: "สตาฟ", viewer: "ผู้ดู" };
const ROLE_COLOR: Record<Role, string> = { owner: "#7C3AED", manager: F.pink, staff: F.teal, viewer: F.muted };
const BUSINESS_LABEL: Record<BusinessType, string> = { farm: "ฟาร์ม", shop: "ร้าน", service: "กิจการ" };

// what each role really allows today (business powers are not changed by the members feature)
const ROLE_DESC: Record<BusinessType, Record<Assignable, string>> = {
  farm: {
    manager: "ดูข้อมูลภายในฟาร์ม บันทึกน้ำหนัก ตั้งค่าความเป็นส่วนตัว ตอบรับการจอง และเชิญ/จัดการสตาฟกับผู้ดู — โอนสัตว์ แก้ข้อมูลสัตว์ และจัดการผู้จัดการคนอื่นไม่ได้",
    staff: "ดูข้อมูลภายในฟาร์มและบันทึกน้ำหนัก",
    viewer: "ดูข้อมูลภายในฟาร์มได้อย่างเดียว",
  },
  shop: {
    manager: "เปลี่ยนรูปโลโก้/ปก และเชิญ/จัดการสตาฟกับผู้ดู — แก้ข้อมูลร้านยังเป็นของเจ้าของ",
    staff: "อยู่ในทีมร้าน (ยังไม่มีสิทธิ์แก้ข้อมูลร้าน)",
    viewer: "อยู่ในทีมร้าน ดูรายชื่อทีมได้",
  },
  service: {
    manager: "เปลี่ยนรูปโลโก้/ปก และเชิญ/จัดการสตาฟกับผู้ดู — แก้ข้อมูลกิจการยังเป็นของเจ้าของ",
    staff: "อยู่ในทีมกิจการ (ยังไม่มีสิทธิ์แก้ข้อมูลกิจการ)",
    viewer: "อยู่ในทีมกิจการ ดูรายชื่อทีมได้",
  },
};

// mirrors workspace_role_can_assign() on the server
const assignable = (me: Role | null): Assignable[] =>
  me === "owner" ? ["manager", "staff", "viewer"] : me === "manager" ? ["staff", "viewer"] : [];

interface MemberRow { member_id: string | null; user_id: string; full_name: string | null; avatar_url: string | null; role: Role; is_me: boolean }
interface InvitationRow { invitation_id: string; invitee_id: string; full_name: string | null; avatar_url: string | null; role: Assignable; invited_by_name: string | null; expires_at: string }
interface UserCard { id: string; full_name: string | null; username: string | null; avatar_url: string | null }

export function memberErrorText(err: { message?: string; code?: string } | null): string {
  const m = (err?.message || "").toLowerCase();
  if (m.includes("already a member")) return "ผู้ใช้นี้เป็นสมาชิกอยู่แล้ว";
  if (m.includes("already pending")) return "มีคำเชิญที่รอตอบรับสำหรับผู้ใช้นี้อยู่แล้ว";
  if (m.includes("invite with this role")) return "คุณให้บทบาทนี้ไม่ได้";
  if (m.includes("no longer pending")) return "คำเชิญนี้ไม่อยู่ในสถานะรอตอบรับแล้ว";
  if (m.includes("cannot cancel")) return "คุณยกเลิกคำเชิญนี้ไม่ได้";
  if (m.includes("own role")) return "เปลี่ยนบทบาทของตัวเองไม่ได้";
  if (m.includes("change this role")) return "คุณเปลี่ยนบทบาทนี้ไม่ได้";
  if (m.includes("remove this member")) return "คุณนำสมาชิกคนนี้ออกไม่ได้";
  if (m.includes("owner cannot leave")) return "เจ้าของออกจากกิจการไม่ได้";
  if (m.includes("not found")) return "ไม่พบรายการนี้แล้ว — โหลดหน้าใหม่";
  if (m.includes("not a member")) return "คุณไม่ได้เป็นสมาชิกของกิจการนี้";
  return "ทำรายการไม่สำเร็จ — ลองใหม่อีกครั้ง";
}

export default function WorkspaceMembersPanel({ type, entityId }: { type: BusinessType; entityId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [invitations, setInvitations] = useState<InvitationRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [searchQ, setSearchQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<UserCard[]>([]);
  const [inviteRole, setInviteRole] = useState<Assignable>("staff");
  const [roleMenuId, setRoleMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const me = members.find((m) => m.is_me) ?? null;
  const myRole: Role | null = me?.role ?? null;
  const canAssign = assignable(myRole);

  const reload = useCallback(async (ws: string) => {
    const { data, error } = await supabase.rpc("list_workspace_members", { p_workspace: ws });
    if (error) { setLoadError(memberErrorText(error)); setMembers([]); return; }
    setLoadError(null);
    setMembers((data || []) as MemberRow[]);
    const role = ((data || []) as MemberRow[]).find((m) => m.is_me)?.role;
    if (role === "owner" || role === "manager") {
      const inv = await supabase.rpc("list_workspace_invitations", { p_workspace: ws });
      setInvitations(inv.error ? [] : ((inv.data || []) as InvitationRow[]));
    } else setInvitations([]);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: ws } = await supabase.from("workspaces").select("id").eq("type", type).eq("entity_id", parseInt(entityId)).maybeSingle();
      if (ws) { setWorkspaceId(ws.id); await reload(ws.id); }
      setLoading(false);
    })();
  }, [type, entityId, reload]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setRoleMenuId(null); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // run one RPC, then show the server's state — never an optimistic change
  const act = async (key: string, fn: () => PromiseLike<{ data: unknown; error: { message?: string; code?: string } | null }>, okText: string) => {
    if (!workspaceId) return false;
    setBusy(key); setNotice(null);
    const { error } = await fn();
    await reload(workspaceId);
    setBusy(null);
    setNotice(error ? { ok: false, text: memberErrorText(error) } : { ok: true, text: okText });
    return !error;
  };

  const search = async () => {
    const q = searchQ.trim(); if (!q) return;
    setSearching(true); setResults([]);
    try {
      const data = await searchUsersForInvite(q);
      const taken = new Set([...members.map((m) => m.user_id), ...invitations.map((i) => i.invitee_id)]);
      setResults((data || []).filter((p) => !taken.has(p.id)) as UserCard[]);
    } catch { setNotice({ ok: false, text: "ค้นหาไม่สำเร็จ" }); }
    setSearching(false); setSearched(true);
  };

  const invite = async (u: UserCard) => {
    const done = await act(`invite:${u.id}`, () => supabase.rpc("invite_workspace_member", { p_workspace: workspaceId, p_invitee: u.id, p_role: inviteRole }),
      `ส่งคำเชิญให้ ${u.full_name || u.username || "ผู้ใช้"} เป็น${ROLE_LABEL[inviteRole]}แล้ว — รอผู้รับกดตอบรับ`);
    if (done) { setResults((r) => r.filter((x) => x.id !== u.id)); }
  };
  const cancelInvite = (i: InvitationRow) =>
    act(`cancel:${i.invitation_id}`, () => supabase.rpc("cancel_workspace_invitation", { p_invitation: i.invitation_id }), "ยกเลิกคำเชิญแล้ว");
  const changeRole = async (m: MemberRow, role: Assignable) => {
    setRoleMenuId(null);
    if (!m.member_id) return;
    await act(`role:${m.member_id}`, () => supabase.rpc("set_workspace_member_role", { p_member: m.member_id, p_role: role }), `เปลี่ยนเป็น${ROLE_LABEL[role]}แล้ว`);
  };
  const remove = async (m: MemberRow) => {
    if (!m.member_id || !confirm(`นำ ${m.full_name || "สมาชิกคนนี้"} ออกจาก${BUSINESS_LABEL[type]}ไหม?`)) return;
    await act(`remove:${m.member_id}`, () => supabase.rpc("remove_workspace_member", { p_member: m.member_id }), "นำสมาชิกออกแล้ว");
  };
  const leave = async () => {
    if (!me?.member_id || !confirm(`ออกจาก${BUSINESS_LABEL[type]}นี้ไหม? คุณจะเข้าหน้าจัดการไม่ได้อีกจนกว่าจะได้รับเชิญใหม่`)) return;
    setBusy("leave"); setNotice(null);
    const { error } = await supabase.rpc("remove_workspace_member", { p_member: me.member_id });
    setBusy(null);
    if (error) { setNotice({ ok: false, text: memberErrorText(error) }); if (workspaceId) await reload(workspaceId); return; }
    router.push("/profile");
  };

  // which rows the caller may edit (mirrors the server; the server still decides)
  const editable = (m: MemberRow) => !m.is_me && m.role !== "owner" && !!m.member_id && canAssign.includes(m.role as Assignable);
  const initial = (n: string | null) => (n || "?").charAt(0).toUpperCase();

  if (loading) return <PageLoader />;

  return (
    <>
      <style>{`
        .fm-page { min-height: 100vh; color: ${F.ink}; font-family: inherit; background: ${F.bg}; }
        .fm-body { max-width: 600px; margin: 0 auto; padding: 24px 16px calc(68px + env(safe-area-inset-bottom,0px) + 24px); }
        .fm-header { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
        .fm-back { width: 40px; height: 40px; border-radius: 12px; border: 1px solid ${F.lineMid}; background: white; display: flex; align-items: center; justify-content: center; cursor: pointer; color: ${F.inkSoft}; flex-shrink: 0; }
        .fm-title { font-size: 20px; font-weight: 700; color: ${F.ink}; margin: 0; }
        .fm-sub { font-size: 12px; color: ${F.muted}; margin: 2px 0 0; }
        .fm-section { margin-bottom: 20px; }
        .fm-section-title { font-size: 11px; font-weight: 700; color: ${F.muted}; text-transform: uppercase; letter-spacing: .07em; margin-bottom: 10px; }
        .fm-card { background: white; border: 1px solid ${F.lineMid}; border-radius: 16px; overflow: visible; }
        .fm-member { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-bottom: 1px solid ${F.line}; }
        .fm-member:last-child { border-bottom: none; }
        .fm-avatar { width: 40px; height: 40px; border-radius: 50%; background: ${F.pinkSoft}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; color: ${F.pink}; font-size: 15px; font-weight: 700; }
        .fm-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .fm-info { flex: 1; min-width: 0; }
        .fm-name { font-size: 14px; font-weight: 600; color: ${F.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .fm-meta { font-size: 11px; color: ${F.muted}; margin-top: 1px; }
        .fm-role-badge, .fm-role-btn { padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; flex-shrink: 0; border: none; }
        .fm-role-btn { cursor: pointer; display: flex; align-items: center; gap: 4px; }
        .fm-icon-btn { min-width: 30px; height: 30px; padding: 0 8px; border-radius: 8px; border: 1px solid ${F.lineMid}; background: white; color: ${F.muted}; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; font-size: 12px; font-family: inherit; }
        .fm-icon-btn:hover { border-color: #FCA5A5; color: #EF4444; background: #FEF2F2; }
        .fm-icon-btn:disabled { opacity: .5; cursor: not-allowed; }
        .fm-role-menu { position: absolute; right: 0; top: calc(100% + 4px); width: 260px; background: white; border: 1px solid ${F.lineMid}; border-radius: 14px; box-shadow: 0 8px 24px rgba(0,0,0,.1); z-index: 50; padding: 4px; }
        .fm-role-opt { display: flex; flex-direction: column; gap: 1px; padding: 8px 12px; border-radius: 10px; cursor: pointer; border: none; background: transparent; width: 100%; text-align: left; }
        .fm-role-opt:hover { background: ${F.line}; }
        .fm-role-opt-label { font-size: 13px; font-weight: 600; }
        .fm-role-opt-desc { font-size: 11px; color: ${F.muted}; }
        .fm-search-row { display: flex; gap: 8px; margin-bottom: 10px; }
        .fm-search-input { flex: 1; padding: 11px 14px; border: 1px solid ${F.lineMid}; border-radius: 12px; font-size: 14px; color: ${F.ink}; outline: none; font-family: inherit; }
        .fm-search-input:focus { border-color: ${F.pink}; box-shadow: 0 0 0 3px ${F.pinkSoft}; }
        .fm-search-btn { padding: 11px 16px; border: none; border-radius: 12px; background: ${F.ink}; color: white; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .fm-search-btn:disabled { opacity: .5; cursor: not-allowed; }
        .fm-role-select { padding: 6px 10px; border: 1px solid ${F.lineMid}; border-radius: 8px; font-size: 12px; color: ${F.ink}; background: white; font-family: inherit; max-width: 100%; }
        .fm-add-btn { padding: 7px 14px; border: none; border-radius: 9px; background: ${F.pink}; color: white; font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap; font-family: inherit; }
        .fm-add-btn:disabled { opacity: .5; cursor: not-allowed; }
        .fm-empty { padding: 20px 16px; text-align: center; color: ${F.muted}; font-size: 13px; }
        .fm-warn { background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 14px; padding: 16px; text-align: center; color: #92400E; font-size: 13px; }
        .fm-notice { border-radius: 12px; padding: 10px 14px; font-size: 13px; margin-bottom: 14px; }
        .fm-notice.ok { background: ${F.tealSoft}; color: ${F.teal}; border: 1px solid #99F6E4; }
        .fm-notice.err { background: #FEF2F2; color: #B91C1C; border: 1px solid #FECACA; }
        .fm-roles-help { font-size: 12px; color: ${F.inkSoft}; line-height: 1.6; margin: 8px 0 0; padding: 0 0 0 18px; }
        .fm-leave { width: 100%; padding: 12px; border-radius: 12px; border: 1px solid #FECACA; background: white; color: #B91C1C; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
      `}</style>
      <div className="fm-page"><div className="fm-body">
        <div className="fm-header">
          <button className="fm-back" onClick={() => router.back()} aria-label="ย้อนกลับ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div>
            <h1 className="fm-title">สมาชิกของ{BUSINESS_LABEL[type]}</h1>
            <p className="fm-sub">เพิ่มสมาชิกได้ด้วยคำเชิญ ผู้รับต้องกดตอบรับก่อนจึงจะเข้าร่วม</p>
          </div>
        </div>

        {notice && <div className={`fm-notice ${notice.ok ? "ok" : "err"}`} role={notice.ok ? "status" : "alert"}>{notice.text}</div>}
        {!workspaceId && <div className="fm-warn">ยังไม่พบข้อมูลทีมของ{BUSINESS_LABEL[type]}นี้ — ลองโหลดหน้าใหม่อีกครั้ง</div>}
        {workspaceId && loadError && <div className="fm-warn">{loadError}</div>}

        {workspaceId && !loadError && (
          <>
            <div className="fm-section">
              <div className="fm-section-title">สมาชิกปัจจุบัน ({members.length})</div>
              <div className="fm-card">
                {members.length === 0 && <div className="fm-empty">ยังไม่มีสมาชิก</div>}
                {members.map((m) => {
                  const color = ROLE_COLOR[m.role];
                  const canEdit = editable(m);
                  const options = canAssign.filter((r) => r !== m.role);
                  const key = m.member_id ?? m.user_id;
                  return (
                    <div key={key} className="fm-member" data-testid="member-row" data-role={m.role}>
                      <div className="fm-avatar">{m.avatar_url ? <img src={m.avatar_url} alt="" /> : initial(m.full_name)}</div>
                      <div className="fm-info">
                        <div className="fm-name">{m.full_name || "ไม่ระบุชื่อ"}{m.is_me ? " (คุณ)" : ""}</div>
                      </div>
                      {canEdit && options.length > 0 ? (
                        <div style={{ position: "relative" }} ref={roleMenuId === key ? menuRef : undefined}>
                          <button className="fm-role-btn" style={{ background: color + "18", color }} disabled={busy !== null}
                                  onClick={() => setRoleMenuId(roleMenuId === key ? null : key)} aria-label={`เปลี่ยนบทบาทของ ${m.full_name || ""}`}>
                            {ROLE_LABEL[m.role]}
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                          </button>
                          {roleMenuId === key && (
                            <div className="fm-role-menu">
                              {options.map((r) => (
                                <button key={r} className="fm-role-opt" onClick={() => changeRole(m, r)}>
                                  <span className="fm-role-opt-label" style={{ color: ROLE_COLOR[r] }}>{ROLE_LABEL[r]}</span>
                                  <span className="fm-role-opt-desc">{ROLE_DESC[type][r]}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="fm-role-badge" style={{ background: color + "18", color }}>{ROLE_LABEL[m.role]}</span>
                      )}
                      {canEdit && (
                        <button className="fm-icon-btn" onClick={() => remove(m)} disabled={busy !== null} aria-label={`นำ ${m.full_name || "สมาชิก"} ออก`}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {canAssign.length > 0 && (
              <div className="fm-section">
                <div className="fm-section-title">คำเชิญที่รอตอบรับ ({invitations.length})</div>
                <div className="fm-card">
                  {invitations.length === 0 && <div className="fm-empty">ไม่มีคำเชิญที่รอตอบรับ</div>}
                  {invitations.map((i) => (
                    <div key={i.invitation_id} className="fm-member" data-testid="invitation-row">
                      <div className="fm-avatar">{i.avatar_url ? <img src={i.avatar_url} alt="" /> : initial(i.full_name)}</div>
                      <div className="fm-info">
                        <div className="fm-name">{i.full_name || "ไม่ระบุชื่อ"}</div>
                        <div className="fm-meta">เชิญเป็น{ROLE_LABEL[i.role]} · หมดอายุ {new Date(i.expires_at).toLocaleDateString("th-TH")}</div>
                      </div>
                      <button className="fm-icon-btn" onClick={() => cancelInvite(i)} disabled={busy !== null}>ยกเลิก</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {canAssign.length > 0 && (
              <div className="fm-section">
                <div className="fm-section-title">เชิญสมาชิกใหม่</div>
                <div className="fm-search-row">
                  <input className="fm-search-input" placeholder="ค้นหาด้วยชื่อ, username หรืออีเมลแบบเต็ม" value={searchQ}
                         onChange={(e) => { setSearchQ(e.target.value); setSearched(false); }} onKeyDown={(e) => e.key === "Enter" && search()} />
                  <button className="fm-search-btn" onClick={search} disabled={searching || !searchQ.trim()}>{searching ? "..." : "ค้นหา"}</button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: F.muted, fontWeight: 600 }}>บทบาทที่จะเชิญ:</span>
                  <select className="fm-role-select" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as Assignable)} aria-label="บทบาทที่จะเชิญ">
                    {canAssign.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                  </select>
                </div>
                <ul className="fm-roles-help">
                  {canAssign.map((r) => <li key={r}><b>{ROLE_LABEL[r]}</b>: {ROLE_DESC[type][r]}</li>)}
                </ul>
                {results.length > 0 && (
                  <div className="fm-card" style={{ marginTop: 10 }}>
                    {results.map((u) => (
                      <div key={u.id} className="fm-member fm-result" data-testid="search-result">
                        <div className="fm-avatar">{u.avatar_url ? <img src={u.avatar_url} alt="" /> : initial(u.full_name || u.username)}</div>
                        <div className="fm-info"><div className="fm-name">{u.full_name || u.username || "—"}</div></div>
                        <button className="fm-add-btn" onClick={() => invite(u)} disabled={busy !== null}>{busy === `invite:${u.id}` ? "..." : "ส่งคำเชิญ"}</button>
                      </div>
                    ))}
                  </div>
                )}
                {searched && results.length === 0 && !searching && <div className="fm-empty">ไม่พบผู้ใช้ที่เชิญได้</div>}
              </div>
            )}

            {me && me.role !== "owner" && me.member_id && (
              <div className="fm-section">
                <button className="fm-leave" onClick={leave} disabled={busy !== null}>ออกจาก{BUSINESS_LABEL[type]}นี้</button>
              </div>
            )}
          </>
        )}
      </div></div>
    </>
  );
}
