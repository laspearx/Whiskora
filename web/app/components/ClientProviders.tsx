"use client";

import type { ReactNode } from "react";
import { WorkspaceProvider } from "@/app/contexts/WorkspaceContext";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return <WorkspaceProvider>{children}</WorkspaceProvider>;
}
