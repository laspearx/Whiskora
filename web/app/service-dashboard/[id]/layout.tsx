"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PageLoader from "@/app/components/PageLoader";

export type ServiceRole = "owner" | "admin" | "staff" | "viewer";

interface ServiceAccessContextValue {
  serviceId: string;
  myRole: ServiceRole;
}

const ServiceAccessContext = createContext<ServiceAccessContextValue | null>(null);

export function useServiceAccess() {
  const ctx = useContext(ServiceAccessContext);
  if (!ctx) throw new Error("useServiceAccess must be used inside service-dashboard layout");
  return ctx;
}

export default function ServiceDashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const serviceId = params?.id as string;

  const [role, setRole] = useState<ServiceRole | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!serviceId) return;
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const uid = session.user.id;

      const { data: wsRow } = await supabase
        .from("workspaces")
        .select("id, workspace_members!inner(role)")
        .eq("type", "service")
        .eq("entity_id", parseInt(serviceId))
        .eq("workspace_members.user_id", uid)
        .maybeSingle();

      if (wsRow) {
        setRole(((wsRow as any).workspace_members?.[0]?.role ?? "viewer") as ServiceRole);
        setChecking(false);
        return;
      }

      const { data: svcRow } = await supabase
        .from("services").select("id").eq("id", serviceId).eq("user_id", uid).maybeSingle();

      if (svcRow) { setRole("owner"); setChecking(false); return; }
      router.push("/partner");
    };
    check();
  }, [serviceId, router]);

  if (checking) return <PageLoader />;

  return (
    <ServiceAccessContext.Provider value={{ serviceId, myRole: role! }}>
      {children}
    </ServiceAccessContext.Provider>
  );
}
