"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/types";

const Ctx = createContext<{ settings: Settings; update: (p: Partial<Settings>) => Promise<void> }>({
  settings: DEFAULT_SETTINGS,
  update: async () => undefined,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  useEffect(() => {
    api<Settings>("/api/settings").then(setSettings).catch(() => undefined);
  }, []);
  const update = useCallback(async (p: Partial<Settings>) => {
    setSettings((s) => ({ ...s, ...p }));
    await api<Settings>("/api/settings", { method: "PUT", body: p });
  }, []);
  return <Ctx.Provider value={{ settings, update }}>{children}</Ctx.Provider>;
}

export const useSettings = () => useContext(Ctx);
