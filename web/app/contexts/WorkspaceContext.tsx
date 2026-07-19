"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase";

export type WorkspaceType = "personal" | "farm" | "shop" | "service";
export type MemberRole = "owner" | "admin" | "staff" | "viewer";

export interface Workspace {
  id: string;
  type: WorkspaceType;
  name: string;
  owner_id: string;
  entity_id: number | null;
  avatar_url: string | null;
  created_at: string;
  myRole: MemberRole;
}

interface WorkspaceContextValue {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  loading: boolean;
  switchWorkspace: (id: string) => void;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspaces: [],
  activeWorkspace: null,
  loading: true,
  switchWorkspace: () => {},
  refreshWorkspaces: async () => {},
});

export function useWorkspace() {
  return useContext(WorkspaceContext);
}

const STORAGE_KEY = "whiskora_active_workspace";

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadWorkspaces = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setWorkspaces([]); setActiveId(null); setLoading(false); return; }

    const { data, error } = await supabase
      .from("workspace_members")
      .select("role, workspaces(*)")
      .eq("user_id", session.user.id);

    if (error || !data) { setLoading(false); return; }

    const ws: Workspace[] = (data as any[])
      .filter((row) => row.workspaces)
      .map((row) => ({ ...(row.workspaces as any), myRole: row.role as MemberRole }));

    ws.sort((a, b) => {
      if (a.type === "personal") return -1;
      if (b.type === "personal") return 1;
      return a.name.localeCompare(b.name, "th");
    });

    setWorkspaces(ws);

    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const valid = ws.find((w) => w.id === saved);
    const defaultWs = ws.find((w) => w.type === "personal") ?? ws[0];
    setActiveId(valid?.id ?? defaultWs?.id ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadWorkspaces();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") { setWorkspaces([]); setActiveId(null); setLoading(false); }
      else if (event === "SIGNED_IN") { loadWorkspaces(); }
    });
    return () => subscription.unsubscribe();
  }, [loadWorkspaces]);

  const switchWorkspace = useCallback((id: string) => {
    setActiveId(id);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const activeWorkspace = workspaces.find((w) => w.id === activeId) ?? null;

  return (
    <WorkspaceContext.Provider value={{ workspaces, activeWorkspace, loading, switchWorkspace, refreshWorkspaces: loadWorkspaces }}>
      {children}
    </WorkspaceContext.Provider>
  );
}
