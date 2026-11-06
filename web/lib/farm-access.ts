"use client";

import { createContext, useContext } from "react";

export type FarmRole = "owner" | "manager" | "staff" | "viewer";

export const canEditFarmProfile = (role: FarmRole) => role === "owner";

interface FarmAccessContextValue {
  farmId: string;
  myRole: FarmRole;
}

export const FarmAccessContext = createContext<FarmAccessContextValue | null>(null);

export function useFarmAccess() {
  const ctx = useContext(FarmAccessContext);
  if (!ctx) throw new Error("useFarmAccess must be used inside farm-dashboard layout");
  return ctx;
}
