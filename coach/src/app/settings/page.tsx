"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Plug, CheckCircle2 } from "lucide-react";
import clsx from "clsx";
import { api } from "@/lib/client";
import { useSettings } from "@/components/settings";
import { Badge, Button, ErrorBox, Field, PageHeader, Panel, inputCls } from "@/components/ui";

function Toggle({ on, onChange, label, sub }: { on: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <button onClick={() => onChange(!on)} className="flex items-center justify-between gap-4 w-full rounded-xl border border-line bg-ink/40 p-3 text-left">
      <div>
        <div className="font-medium">{label}</div>
        {sub && <div className="text-sm text-muted">{sub}</div>}
      </div>
      <span className={clsx("w-12 h-7 rounded-full p-1 flex transition-colors", on ? "bg-accent justify-end" : "bg-line justify-start")}>
        <motion.span layout className="w-5 h-5 rounded-full bg-white" transition={{ type: "spring", stiffness: 500, damping: 30 }} />
      </span>
    </button>
  );
}

export default function SettingsPage() {
  const { settings, update } = useSettings();
  const [ping, setPing] = useState<{ ok: boolean; message: string; mock: boolean; ms: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<unknown>(null);

  const test = async () => {
    setBusy(true);
    setErr(null);
    setPing(null);
    try {
      setPing(await api("/api/ping"));
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl flex flex-col gap-6">
      <PageHeader title="Settings" />
      <Panel>
        <h3 className="font-semibold mb-3">Claude connection</h3>
        <p className="text-sm text-muted mb-3">The app uses the Claude Code installed on this PC (your subscription). Make sure you ran <code>claude</code> once in a terminal and logged in.</p>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Model">
            <select className={inputCls} value={settings.model} onChange={(e) => update({ model: e.target.value })}>
              <option value="">Claude Code default</option>
              <option value="sonnet">Sonnet (faster)</option>
              <option value="opus">Opus (smartest)</option>
              <option value="haiku">Haiku (fastest)</option>
            </select>
          </Field>
          <Button onClick={test} loading={busy}>
            <Plug size={16} /> Test connection
          </Button>
        </div>
        {ping && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-xl border border-good/40 bg-good/5 p-3 text-sm flex items-center gap-2">
            <CheckCircle2 className="text-good" size={18} />
            <span>{ping.message}</span>
            <Badge>{(ping.ms / 1000).toFixed(1)}s</Badge>
            {ping.mock && <Badge tone="warn">mock mode</Badge>}
          </motion.div>
        )}
        <div className="mt-3">
          <ErrorBox error={err} />
        </div>
      </Panel>
      <Panel>
        <h3 className="font-semibold mb-3">Explanation languages</h3>
        <div className="flex flex-col gap-2">
          <Toggle on={settings.showEn} onChange={(v) => update({ showEn: v })} label="🇬🇧 English" />
          <Toggle on={settings.showAr} onChange={(v) => update({ showAr: v })} label="🇸🇦 العربية (Arabic)" sub="French lessons only" />
          <Toggle on={settings.showDarija} onChange={(v) => update({ showDarija: v })} label="🇲🇦 Darija (Latin letters)" sub="Coding + French" />
        </div>
      </Panel>
      <Panel>
        <h3 className="font-semibold mb-2">Where your data lives</h3>
        <p className="text-sm text-muted">
          Everything is saved as files in the repo: <code>data/</code> (progress, mistakes, cards), <code>french/journal/</code>, <code>relearn/</code>, <code>interviews/logs/</code>, <code>jobs/</code>, <code>reports/</code>. Commit and push to keep it safe and in sync with your Claude Code sessions.
        </p>
      </Panel>
    </div>
  );
}
