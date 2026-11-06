"use client";

import { createContext, useContext } from "react";

export type ServiceRole = "owner" | "manager" | "staff" | "viewer";

interface ServiceAccessContextValue {
  serviceId: string;
  myRole: ServiceRole;
}

export const ServiceAccessContext = createContext<ServiceAccessContextValue | null>(null);

export function useServiceAccess() {
  const ctx = useContext(ServiceAccessContext);
  if (!ctx) throw new Error("useServiceAccess must be used inside service-dashboard layout");
  return ctx;
}
