"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useFarmAccess } from "@/app/farm-dashboard/[id]/layout";
import PageLoader from "@/app/components/PageLoader";

const F = {
  ink: "#111827", inkSoft: "#4B5563", muted: "#9CA3AF",
  pink: "#E84677", pinkSoft: "#FDF2F5", pinkBorder: "#FBCFE8", pinkDeep: "#C4325F",
  teal: "#0D9488", tealSoft: "#F0FDFA",
  line: "#F3F4F6", lineMid: "#E5E7EB", bg: "#FAFAFA",
};

type Role = "owner" | "admin" | "staff" | "viewer";

const ROLES: { value: Role; label: string; desc: string }[] = [
  { value: "admin",  label: "แอดมิน",  desc: "จัดการได้ทุกอย่าง ยกเว้นลบฟาร์ม" },
  { value: "staff",  label: "สตาฟ",    desc: "เพิ่ม/แก้ไขข้อมูลสัตว์และครอก" },
  { value: "viewer", label: "ผู้ดู",   desc: "ดูข้อมูลได้อย่างเดียว" },
];

const ROLE_COLOR: Record<Role, string> = {
  owner:  "#7C3AED",
  admin:  F.pink,
  staff:  F.teal,
  viewer: F.muted,
};

const ROLE_LABEL: Record<Role, string> = {
  owner: "เจ้าของ", admin: "แอดมิน", staff: "สตาฟ", viewer: "ผู้ดู",
};

interface Member {
  id: string;
  role: Role;
  user_id: string;
  joined_at: string;
  profiles: {
    full_name: string | null;
    username: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

interface SearchResult {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
}

export default function FarmMembersPage() {
  const router = useRouter();
  const params = useParams();
  const farmId = params?.id as string;
  const { myRole } = useFarmAccess();

  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [myUserId, setMyUserId] = useState<string>("");

  const [searchQ, setSearchQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [addRole, setAddRole] = useState<Role>("staff");
  const [addingId, setAddingId] = useState<string | null>(null);

  const [roleMenuId, setRoleMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const canManage = myRole === "owner" || myRole === "admin";

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setMyUserId(session.user.id);

      const { data: ws } = await supabase
        .from("workspaces")
        .select("id")
        .eq("type", "farm")
        .eq("entity_id", parseInt(farmId))
        .maybeSingle();

      if (!ws) { setLoading(false); return; }
      setWorkspaceId(ws.id);

      const { data: rows } = await supabase
        .from("workspace_members")
        .select("id, role, user_id, joined_at, profiles(full_name, username, email, avatar_url)")
        .eq("workspace_id", ws.id)
        .order("joined_at");

      setMembers((rows as any) || []);
      setLoading(false);
    };
    load();
  }, [farmId]);

  // Close role menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setRoleMenuId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const searchUsers = async () => {
    const q = searchQ.trim();
    if (!q) return;
    setSearching(true);
    setSearchResults([]);

    const existing = new Set(members.map((m) => m.user_id));

    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, username, email, avatar_url")
      .or(`username.ilike.%${q}%,email.ilike.%${q}%,full_name.ilike.%${q}%`)
      .limit(5);

    const filtered = (data || []).filter((p: any) => !existing.has(p.id));
    setSearchResults(filtered as SearchResult[]);
    setSearching(false);
  };

  const addMember = async (profile: SearchResult) => {
    if (!workspaceId) return;
    setAddingId(profile.id);
    const { error } = await supabase.from("workspace_members").insert({
      workspace_id: workspaceId,
      user_id: profile.id,
      role: addRole,
    });
    if (!error) {
      setMembers((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: addRole,
        user_id: profile.id,
        joined_at: new Date().toISOString(),
        profiles: profile,
      }]);
      setSearchResults((prev) => prev.filter((p) => p.id !== profile.id));
      setSearchQ("");
    }
    setAddingId(null);
  };

  const changeRole = async (memberId: string, newRole: Role) => {
    await supabase.from("workspace_members").update({ role: newRole }).eq("id", memberId);
    setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role: newRole } : m));
    setRoleMenuId(null);
  };

  const removeMember = async (memberId: string) => {
    if (!confirm("ต้องการลบสมาชิกคนนี้ออกจากฟาร์มไหม?")) return;
    await supabase.from("workspace_members").delete().eq("id", memberId);
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  const displayName = (m: Member | SearchResult) => {
    const p = "profiles" in m ? m.profiles : m;
    return p?.full_name || p?.username || p?.email || "ไม่ระบุชื่อ";
  };

  if (loading) return <PageLoader />;

  return (
    <>
      <style>{`
        .fm-page { max-width: 600px; margin: 0 auto; padding: 24px 16px 100px; color: ${F.ink}; font-family: inherit; }
        .fm-header { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
        .fm-back { width: 40px; height: 40px; border-radius: 12px; border: 1px solid ${F.lineMid}; background: white; display: flex; align-items: center; justify-content: center; cursor: pointer; color: ${F.inkSoft}; transition: background .15s; flex-shrink: 0; }
        .fm-back:hover { background: ${F.line}; }
        .fm-title { font-size: 20px; font-weight: 700; color: ${F.ink}; margin: 0; }
        .fm-sub { font-size: 12px; color: ${F.muted}; margin: 2px 0 0; }
        .fm-section { margin-bottom: 20px; }
        .fm-section-title { font-size: 11px; font-weight: 700; color: ${F.muted}; text-transform: uppercase; letter-spacing: .07em; margin-bottom: 10px; }
        .fm-card { background: white; border: 1px solid ${F.lineMid}; border-radius: 16px; overflow: hidden; }
        .fm-member { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-bottom: 1px solid ${F.line}; }
        .fm-member:last-child { border-bottom: none; }
        .fm-avatar { width: 40px; height: 40px; border-radius: 50%; background: ${F.pinkSoft}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; color: ${F.pink}; font-size: 15px; font-weight: 700; }
        .fm-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .fm-info { flex: 1; min-width: 0; }
        .fm-name { font-size: 14px; font-weight: 600; color: ${F.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .fm-email { font-size: 11px; color: ${F.muted}; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .fm-role-badge { padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; flex-shrink: 0; }
        .fm-role-btn { padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; flex-shrink: 0; border: none; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: opacity .15s; }
        .fm-role-btn:hover { opacity: .8; }
        .fm-remove-btn { width: 30px; height: 30px; border-radius: 8px; border: 1px solid ${F.lineMid}; background: white; color: ${F.muted}; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: all .15s; }
        .fm-remove-btn:hover { border-color: #FCA5A5; color: #EF4444; background: #FEF2F2; }
        .fm-role-menu { position: absolute; right: 0; top: calc(100% + 4px); width: 200px; background: white; border: 1px solid ${F.lineMid}; border-radius: 14px; box-shadow: 0 8px 24px rgba(0,0,0,.1); z-index: 50; overflow: hidden; padding: 4px; }
        .fm-role-opt { display: flex; flex-direction: column; gap: 1px; padding: 8px 12px; border-radius: 10px; cursor: pointer; transition: background .12s; border: none; background: transparent; width: 100%; text-align: left; }
        .fm-role-opt:hover { background: ${F.line}; }
        .fm-role-opt-label { font-size: 13px; font-weight: 600; color: ${F.ink}; }
        .fm-role-opt-desc { font-size: 11px; color: ${F.muted}; }
        .fm-search-row { display: flex; gap: 8px; margin-bottom: 10px; }
        .fm-search-input { flex: 1; padding: 11px 14px; border: 1px solid ${F.lineMid}; border-radius: 12px; font-size: 14px; color: ${F.ink}; outline: none; font-family: inherit; transition: border-color .15s; }
        .fm-search-input:focus { border-color: ${F.pink}; box-shadow: 0 0 0 3px ${F.pinkSoft}; }
        .fm-search-btn { padding: 11px 16px; border: none; border-radius: 12px; background: ${F.ink}; color: white; font-size: 13px; font-weight: 600; cursor: pointer; transition: opacity .15s; white-space: nowrap; font-family: inherit; }
        .fm-search-btn:hover { opacity: .85; }
        .fm-search-btn:disabled { opacity: .5; cursor: not-allowed; }
        .fm-result { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid ${F.line}; }
        .fm-result:last-child { border-bottom: none; }
        .fm-add-row { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
        .fm-role-select { padding: 6px 10px; border: 1px solid ${F.lineMid}; border-radius: 8px; font-size: 12px; color: ${F.ink}; outline: none; background: white; font-family: inherit; cursor: pointer; }
        .fm-add-btn { padding: 7px 14px; border: none; border-radius: 9px; background: ${F.pink}; color: white; font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: opacity .15s; font-family: inherit; }
        .fm-add-btn:hover { opacity: .88; }
        .fm-add-btn:disabled { opacity: .5; cursor: not-allowed; }
        .fm-empty { padding: 24px 16px; text-align: center; color: ${F.muted}; font-size: 13px; }
        .fm-no-ws { background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 14px; padding: 16px; text-align: center; color: #92400E; font-size: 13px; }
      `}</style>

      <div className="fm-page">
        {/* Header */}
        <div className="fm-header">
          <button className="fm-back" onClick={() => router.back()} aria-label="ย้อนกลับ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div>
            <h1 className="fm-title">จัดการสมาชิก</h1>
            <p className="fm-sub">ควบคุมสิทธิ์การเข้าถึงฟาร์มของคุณ</p>
          </div>
        </div>

        {!workspaceId && (
          <div className="fm-no-ws">
            ยังไม่พบ workspace สำหรับฟาร์มนี้ — ลองโหลดหน้าใหม่อีกครั้ง
          </div>
        )}

        {workspaceId && (
          <>
            {/* Current members */}
            <div className="fm-section">
              <div className="fm-section-title">สมาชิกปัจจุบัน ({members.length})</div>
              <div className="fm-card">
                {members.length === 0 && <div className="fm-empty">ยังไม่มีสมาชิก</div>}
                {members.map((m) => {
                  const isMe = m.user_id === myUserId;
                  const isOwner = m.role === "owner";
                  const canEdit = canManage && !isOwner && !isMe;
                  const color = ROLE_COLOR[m.role];
                  const initials = displayName(m).charAt(0).toUpperCase();

                  return (
                    <div key={m.id} className="fm-member">
                      {/* Avatar */}
                      <div className="fm-avatar">
                        {m.profiles?.avatar_url
                          ? <img src={m.profiles.avatar_url} alt="" />
                          : initials}
                      </div>

                      {/* Info */}
                      <div className="fm-info">
                        <div className="fm-name">{displayName(m)}{isMe ? " (คุณ)" : ""}</div>
                        <div className="fm-email">{m.profiles?.email || m.profiles?.username || "—"}</div>
                      </div>

                      {/* Role */}
                      {canEdit ? (
                        <div style={{ position: "relative" }} ref={roleMenuId === m.id ? menuRef : undefined}>
                          <button
                            className="fm-role-btn"
                            style={{ background: color + "18", color }}
                            onClick={() => setRoleMenuId(roleMenuId === m.id ? null : m.id)}
                          >
                            {ROLE_LABEL[m.role]}
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                          </button>
                          {roleMenuId === m.id && (
                            <div className="fm-role-menu">
                              {ROLES.map((r) => (
                                <button key={r.value} className="fm-role-opt" onClick={() => changeRole(m.id, r.value)}>
                                  <span className="fm-role-opt-label" style={{ color: ROLE_COLOR[r.value] }}>{r.label}</span>
                                  <span className="fm-role-opt-desc">{r.desc}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="fm-role-badge" style={{ background: color + "18", color }}>
                          {ROLE_LABEL[m.role]}
                        </span>
                      )}

                      {/* Remove button */}
                      {canEdit && (
                        <button className="fm-remove-btn" onClick={() => removeMember(m.id)} aria-label="ลบสมาชิก">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Invite section — owner/admin only */}
            {canManage && (
              <div className="fm-section">
                <div className="fm-section-title">เชิญสมาชิกใหม่</div>

                <div className="fm-search-row">
                  <input
                    className="fm-search-input"
                    placeholder="ค้นหาด้วยชื่อ, username หรือ email"
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                  />
                  <button className="fm-search-btn" onClick={searchUsers} disabled={searching || !searchQ.trim()}>
                    {searching ? "..." : "ค้นหา"}
                  </button>
                </div>

                {/* Role selector */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: F.muted, fontWeight: 600 }}>สิทธิ์ที่จะให้:</span>
                  <select
                    className="fm-role-select"
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value as Role)}
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>
                    ))}
                  </select>
                </div>

                {/* Search results */}
                {searchResults.length > 0 && (
                  <div className="fm-card">
                    {searchResults.map((p) => {
                      const initials = (p.full_name || p.username || "?").charAt(0).toUpperCase();
                      return (
                        <div key={p.id} className="fm-result">
                          <div className="fm-avatar">
                            {p.avatar_url ? <img src={p.avatar_url} alt="" /> : initials}
                          </div>
                          <div className="fm-info">
                            <div className="fm-name">{p.full_name || p.username || "—"}</div>
                            <div className="fm-email">{p.email || p.username}</div>
                          </div>
                          <button
                            className="fm-add-btn"
                            onClick={() => addMember(p)}
                            disabled={addingId === p.id}
                          >
                            {addingId === p.id ? "..." : "+ เพิ่ม"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {searchResults.length === 0 && searchQ && !searching && (
                  <div style={{ fontSize: 13, color: F.muted, textAlign: "center", padding: "16px 0" }}>
                    ไม่พบผู้ใช้ที่ตรงกัน
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
