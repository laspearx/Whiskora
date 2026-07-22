"use client";

import { useEffect } from "react";
import { registerSW } from "@/lib/push-client";

export default function PushSetup() {
  useEffect(() => {
    registerSW();
  }, []);
  return null;
}
