"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { readZenDefault } from "@/lib/appearance/zen-preference";

type ZenValue = { zen: boolean; toggle: () => void; exit: () => void };

const ZenContext = createContext<ZenValue | null>(null);

export function ZenProvider({ children }: { children: React.ReactNode }) {
  const [zen, setZen] = useState(false);
  const toggle = useCallback(() => setZen((z) => !z), []);
  const exit = useCallback(() => setZen(false), []);

  // Apply the saved "start in zen mode" preference after mount, so the
  // server-rendered markup and the first client render agree.
  useEffect(() => {
    if (readZenDefault()) setZen(true);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setZen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return <ZenContext.Provider value={{ zen, toggle, exit }}>{children}</ZenContext.Provider>;
}

export function useZen(): ZenValue {
  const ctx = useContext(ZenContext);
  if (!ctx) throw new Error("useZen must be used within ZenProvider");
  return ctx;
}
