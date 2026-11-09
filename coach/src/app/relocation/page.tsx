"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Check, ExternalLink } from "lucide-react";
import clsx from "clsx";
import { api, celebrate } from "@/lib/client";
import { CHECKLISTS } from "@/lib/relocation";
import { Badge, Button, PageHeader, Panel, Thinking } from "@/components/ui";

export default function RelocationPage() {
  const [country, setCountry] = useState<"IE" | "UK">("IE");
  const [state, setState] = useState<Record<string, string> | null>(null);
  useEffect(() => {
    api<Record<string, string>>("/api/checklist").then(setState).catch(() => setState({}));
  }, []);

  const list = CHECKLISTS[country];
  const all = list.phases.flatMap((p) => p.steps);
  const doneCount = all.filter((s) => state?.[s.id]).length;

  const toggle = async (id: string) => {
    const done = !state?.[id];
    setState((s) => {
      const n = { ...(s ?? {}) };
      if (done) n[id] = new Date().toISOString().slice(0, 10);
      else delete n[id];
      return n;
    });
    if (done) celebrate();
    await api("/api/checklist", { method: "PUT", body: { id, done } });
  };

  return (
    <div className="max-w-4xl">
      <PageHeader title="Relocation" subtitle="Step-by-step move checklist. Always confirm details on the official links.">
        <Button size="sm" variant={country === "IE" ? "primary" : "ghost"} onClick={() => setCountry("IE")}>
          🇮🇪 Ireland
        </Button>
        <Button size="sm" variant={country === "UK" ? "primary" : "ghost"} onClick={() => setCountry("UK")}>
          🇬🇧 UK
        </Button>
      </PageHeader>
      {!state ? (
        <Thinking label="Loading" />
      ) : (
        <>
          <Panel className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">{list.title}</span>
              <Badge tone="accent">
                {doneCount}/{all.length}
              </Badge>
            </div>
            <div className="h-3 rounded-full bg-line overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-accent to-good" animate={{ width: `${(doneCount / all.length) * 100}%` }} transition={{ type: "spring", stiffness: 80 }} />
            </div>
          </Panel>
          {list.phases.map((p, pi) => {
            const d = p.steps.filter((s) => state[s.id]).length;
            return (
              <Panel key={p.title} className="mb-4" delay={pi * 0.05}>
                <div className="flex justify-between mb-3">
                  <h3 className="font-semibold">{p.title}</h3>
                  <span className="text-sm text-muted">
                    {d}/{p.steps.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {p.steps.map((s) => {
                    const done = !!state[s.id];
                    return (
                      <motion.div key={s.id} layout className={clsx("flex gap-3 rounded-xl border p-3", done ? "border-good/30 bg-good/5" : "border-line bg-ink/40")}>
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() => toggle(s.id)}
                          className={clsx("mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0", done ? "bg-good border-good text-ink" : "border-muted")}
                        >
                          {done && (
                            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                              <Check size={16} strokeWidth={3} />
                            </motion.span>
                          )}
                        </motion.button>
                        <div className="flex-1 text-sm">
                          <div className={clsx("font-medium", done && "line-through text-muted")}>{s.title}</div>
                          {s.detail && <div className="text-muted mt-0.5">{s.detail}</div>}
                          {done && <div className="text-xs text-good mt-1">Done {state[s.id]}</div>}
                        </div>
                        {s.link && (
                          <a href={s.link} target="_blank" rel="noreferrer" className="text-accent-2 shrink-0" title="Official page">
                            <ExternalLink size={16} />
                          </a>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </Panel>
            );
          })}
        </>
      )}
    </div>
  );
}
