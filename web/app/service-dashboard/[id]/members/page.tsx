"use client";

import { useParams } from "next/navigation";
import WorkspaceMembersPanel from "@/app/components/WorkspaceMembersPanel";

// members are managed only through the workspace RPCs (docs/WORKSPACE_MEMBERS_DESIGN.md)
export default function ServiceMembersPage() {
  const params = useParams();
  return <WorkspaceMembersPanel type="service" entityId={params?.id as string} />;
}
