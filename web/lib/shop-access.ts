"use client";

import { createContext, useContext } from "react";

export type ShopRole = "owner" | "manager" | "staff" | "viewer";

interface ShopAccessContextValue {
  shopId: string;
  myRole: ShopRole;
}

export const ShopAccessContext = createContext<ShopAccessContextValue | null>(null);

export function useShopAccess() {
  const ctx = useContext(ShopAccessContext);
  if (!ctx) throw new Error("useShopAccess must be used inside shop-dashboard layout");
  return ctx;
}
