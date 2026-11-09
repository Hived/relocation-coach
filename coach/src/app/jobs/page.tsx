"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { Plus, Trash2, ExternalLink, Copy, Sparkles, Search, Building2 } from "lucide-react";
import clsx from "clsx";
import { api } from "@/lib/client";
import type { Application, Contact } from "@/lib/types";
import { CITIES, TAX_YEAR_NOTE, VISA_FLOORS, takeHome } from "@/lib/salary";
import { Badge, Button, ErrorBox, Field, Md, PageHeader, Panel, Thinking, inputCls } from "@/components/ui";

const TABS = ["Tracker", "Sponsors & jobs", "Referrals", "Company briefs", "Salary"] as const;

export default function JobsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Tracker");
  return (
    <div>
      <PageHeader title="Jobs" subtitle="Ireland 🇮🇪 first, UK 🇬🇧 second · sponsored roles only · you apply by hand" />
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className="relative px-4 py-2 rounded-xl text-sm">
            {tab === t && <motion.span layoutId="jobs-tab" className="absolute inset-0 rounded-xl bg-accent/20 border border-accent/40" />}
            <span className={clsx("relative", tab === t ? "text-white" : "text-muted")}>{t}</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          {tab === "Tracker" && <Tracker />}
          {tab === "Sponsors & jobs" && <Sponsors />}
          {tab === "Referrals" && <Referrals />}
          {tab === "Company briefs" && <Briefs />}
          {tab === "Salary" && <Salary />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* --------------------------------- Tracker -------------------------------- */

const COLS: { id: Application["status"]; label: string; tone: string }[] = [
  { id: "saved", label: "Saved", tone: "border-line" },
  { id: "applied", label: "Applied", tone: "border-accent/50" },
  { id: "interview", label: "Interview", tone: "border-warn/50" },
  { id: "offer", label: "Offer 🎉", tone: "border-good/50" },
  { id: "rejected", label: "Rejected", tone: "border-bad/40" },
];

function Tracker() {
  const [apps, setApps] = useState<Application[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState<unknown>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const load = useCallback(() => {
    api<Application[]>("/api/jobs/applications").then(setApps).catch(setErr);
  }, []);
  useEffect(load, [load]);

  const onDragEnd = async (e: DragEndEvent) => {
    const id = String(e.active.id);
    const status = e.over?.id as Application["status"] | undefined;
    if (!status || !apps) return;
    const a = apps.find((x) => x.id === id);
    if (!a || a.status === status) return;
    setApps(apps.map((x) => (x.id === id ? { ...x, status } : x)));
    await api("/api/jobs/applications", { method: "PUT", body: { id, status } }).catch(setErr);
  };
  const remove = async (id: string) => {
    setApps((l) => l?.filter((x) => x.id !== id) ?? null);
    await api(`/api/jobs/applications?id=${id}`, { method: "DELETE" });
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Button size="sm" onClick={() => setAdding((a) => !a)}>
          <Plus size={14} /> Add application
        </Button>
        <span className="text-sm text-muted self-center">Drag cards between columns.</span>
      </div>
      <ErrorBox error={err} />
      <AnimatePresence>
        {adding && (
          <AppForm
            onSaved={() => {
              setAdding(false);
              load();
            }}
          />
        )}
      </AnimatePresence>
      {!apps ? (
        <Thinking label="Loading" />
      ) : (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="grid md:grid-cols-3 xl:grid-cols-5 gap-4">
            {COLS.map((c) => (
              <Column key={c.id} col={c} items={apps.filter((a) => a.status === c.id)} onRemove={remove} />
            ))}
          </div>
        </DndContext>
      )}
    </div>
  );
}

function Column({ col, items, onRemove }: { col: (typeof COLS)[number]; items: Application[]; onRemove: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  return (
    <div ref={setNodeRef} className={clsx("rounded-2xl border-2 border-dashed p-3 min-h-48 transition-colors", col.tone, isOver && "bg-accent/10")}>
      <div className="flex justify-between items-center mb-3">
        <span className="font-semibold text-sm">{col.label}</span>
        <Badge>{items.length}</Badge>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((a) => (
          <AppCard key={a.id} a={a} onRemove={onRemove} />
        ))}
      </div>
    </div>
  );
}

function AppCard({ a, onRemove }: { a: Application; onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: a.id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined }}
      className={clsx("glass rounded-xl p-3 cursor-grab active:cursor-grabbing text-sm", isDragging && "z-50 shadow-2xl shadow-accent/30 rotate-2")}
    >
      <div className="flex justify-between gap-2">
        <div className="font-semibold">{a.company}</div>
        <Badge>{a.country}</Badge>
      </div>
      <div className="text-muted">{a.role}</div>
      {a.nextAction && (
        <div className="text-xs mt-1 text-warn">
          → {a.nextAction} {a.nextDate && `(${a.nextDate})`}
        </div>
      )}
      <div className="flex gap-2 mt-2" onPointerDown={(e) => e.stopPropagation()}>
        {a.link && (
          <a href={a.link} target="_blank" rel="noreferrer" className="text-muted hover:text-accent-2">
            <ExternalLink size={14} />
          </a>
        )}
        <button onClick={() => onRemove(a.id)} className="text-muted hover:text-bad ml-auto">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function AppForm({ onSaved }: { onSaved: () => void }) {
  const [f, setF] = useState({ company: "", role: ".NET Developer", country: "IE", link: "", salary: "", nextAction: "", nextDate: "", notes: "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const save = async () => {
    await api("/api/jobs/applications", { body: { ...f, status: "saved" } });
    onSaved();
  };
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
      <Panel>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Field label="Company">
            <input className={inputCls} value={f.company} onChange={set("company")} />
          </Field>
          <Field label="Role">
            <input className={inputCls} value={f.role} onChange={set("role")} />
          </Field>
          <Field label="Country">
            <select className={inputCls} value={f.country} onChange={set("country")}>
              <option value="IE">Ireland</option>
              <option value="UK">UK</option>
              <option value="FR">France</option>
              <option value="Other">Other</option>
            </select>
          </Field>
          <Field label="Job link">
            <input className={inputCls} value={f.link} onChange={set("link")} />
          </Field>
          <Field label="Salary (if known)">
            <input className={inputCls} value={f.salary} onChange={set("salary")} />
          </Field>
          <Field label="Next action">
            <input className={inputCls} value={f.nextAction} onChange={set("nextAction")} placeholder="e.g. follow up" />
          </Field>
          <Field label="Next action date">
            <input type="date" className={inputCls} value={f.nextDate} onChange={set("nextDate")} />
          </Field>
        </div>
        <Button className="mt-4" size="sm" onClick={save} disabled={!f.company}>
          Save
        </Button>
      </Panel>
    </motion.div>
  );
}

/* -------------------------------- Sponsors -------------------------------- */

function Sponsors() {
  const [data, setData] = useState<{ targets: Record<string, string>[]; jobs: Record<string, string>[] } | null>(null);
  const [q, setQ] = useState("");
  const [err, setErr] = useState<unknown>(null);
  useEffect(() => {
    api<{ targets: Record<string, string>[]; jobs: Record<string, string>[] }>("/api/jobs/targets").then(setData).catch(setErr);
  }, []);
  const filter = (rows: Record<string, string>[]) => rows.filter((r) => !q || Object.values(r).join(" ").toLowerCase().includes(q.toLowerCase()));
  if (err) return <ErrorBox error={err} />;
  if (!data) return <Thinking label="Loading" />;
  return (
    <div className="flex flex-col gap-6">
      <Panel>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className={clsx(inputCls, "w-full pl-9")} placeholder="Filter companies, cities, titles…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Panel>
      <Panel>
        <h3 className="font-semibold mb-1">New .NET jobs (Dublin / London)</h3>
        <p className="text-sm text-muted mb-3">
          Run <code>python jobs/finder/jobspy_daily.py</code> to refresh. ⭐ = company is a known sponsor.
        </p>
        <Table rows={filter(data.jobs)} cols={["sponsor", "score", "title", "company", "location", "date_posted", "job_url"]} empty="No jobs yet — run the finder script." />
      </Panel>
      <Panel>
        <h3 className="font-semibold mb-1">Sponsor target list ({data.targets.length})</h3>
        <p className="text-sm text-muted mb-3">
          Built by <code>python jobs/sponsors/build_targets.py</code> from the UK register of licensed sponsors and Ireland&apos;s permits-by-company data.
        </p>
        <Table rows={filter(data.targets).slice(0, 300)} cols={["company", "country", "city", "evidence", "tech_signal"]} empty="No targets yet — run the sponsor scripts." />
      </Panel>
    </div>
  );
}

function Table({ rows, cols, empty }: { rows: Record<string, string>[]; cols: string[]; empty: string }) {
  if (!rows.length) return <div className="text-sm text-muted">{empty}</div>;
  const present = cols.filter((c) => c in rows[0]);
  return (
    <div className="overflow-x-auto max-h-[60vh]">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-panel">
          <tr>
            {present.map((c) => (
              <th key={c} className="text-left text-muted font-medium px-2 py-2 border-b border-line">
                {c.replace(/_/g, " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-panel-2/60">
              {present.map((c) => (
                <td key={c} className="px-2 py-1.5 border-b border-line/50 align-top">
                  {c.endsWith("url") && r[c] ? (
                    <a className="text-accent-2 inline-flex items-center gap-1" href={r[c]} target="_blank" rel="noreferrer">
                      open <ExternalLink size={12} />
                    </a>
                  ) : (
                    r[c]
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------- Referrals ------------------------------- */

const TEMPLATES = [
  {
    title: "Advice first (Moroccan / alumni at the company)",
    text: "Hi {name}, I'm a .NET engineer from Morocco (5 yrs, C# / ASP.NET Core / SQL). I'm planning to move to {city} and saw you made a similar move to {company} — I'd really appreciate 10 minutes of your advice on how you did it, or any tips about the .NET team there. I'm looking at this role: {link}. Thanks a lot!",
  },
  {
    title: "Asking for a referral (after they replied)",
    text: "Thanks a lot for your advice, {name}! If you feel comfortable, would you be open to referring me for {role}? Here is my CV and the job link: {link}. Happy to send anything that makes it easier for you. Either way, thank you for your time.",
  },
  {
    title: "Follow-up (no reply after ~7 days)",
    text: "Hi {name}, just a gentle follow-up on my message last week — I know you're busy. Even a quick tip about applying to {company} from abroad would help a lot. Thanks!",
  },
];

function Referrals() {
  const [list, setList] = useState<Contact[] | null>(null);
  const [f, setF] = useState({ name: "", company: "", role: "", howFound: "", link: "" });
  const [copied, setCopied] = useState<number | null>(null);
  const load = useCallback(() => {
    api<Contact[]>("/api/jobs/contacts").then(setList).catch(() => setList([]));
  }, []);
  useEffect(load, [load]);
  const add = async () => {
    await api("/api/jobs/contacts", { body: { ...f, status: "to-contact" } });
    setF({ name: "", company: "", role: "", howFound: "", link: "" });
    load();
  };
  const update = async (c: Contact, patch: Partial<Contact>) => {
    setList((l) => l?.map((x) => (x.id === c.id ? { ...x, ...patch } : x)) ?? null);
    await api("/api/jobs/contacts", { method: "PUT", body: { id: c.id, ...patch } });
  };
  const markMessaged = (c: Contact) => {
    const today = new Date();
    const follow = new Date(today);
    follow.setDate(follow.getDate() + 7);
    update(c, { status: "messaged", messagedOn: today.toISOString().slice(0, 10), followUpOn: follow.toISOString().slice(0, 10) });
  };
  return (
    <div className="flex flex-col gap-6">
      <Panel>
        <h3 className="font-semibold mb-3">Message templates</h3>
        <p className="text-sm text-muted mb-3">Aim for ~5 personal messages a day. Always personalise the first line.</p>
        <div className="grid lg:grid-cols-3 gap-3">
          {TEMPLATES.map((t, i) => (
            <div key={t.title} className="rounded-xl border border-line bg-ink/40 p-3 text-sm flex flex-col">
              <div className="font-medium mb-2">{t.title}</div>
              <div className="text-muted flex-1">{t.text}</div>
              <Button
                size="sm"
                variant="ghost"
                className="mt-3 self-start"
                onClick={() => {
                  navigator.clipboard.writeText(t.text);
                  setCopied(i);
                  setTimeout(() => setCopied(null), 1500);
                }}
              >
                <Copy size={14} /> {copied === i ? "Copied!" : "Copy"}
              </Button>
            </div>
          ))}
        </div>
      </Panel>
      <Panel>
        <h3 className="font-semibold mb-3">Add contact</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {(["name", "company", "role", "howFound", "link"] as const).map((k) => (
            <Field key={k} label={k === "howFound" ? "How found (alumni, Moroccan…)" : k === "link" ? "LinkedIn URL" : k[0].toUpperCase() + k.slice(1)}>
              <input className={inputCls} value={f[k]} onChange={(e) => setF((x) => ({ ...x, [k]: e.target.value }))} />
            </Field>
          ))}
        </div>
        <Button className="mt-3" size="sm" onClick={add} disabled={!f.name || !f.company}>
          <Plus size={14} /> Add
        </Button>
      </Panel>
      <Panel>
        <h3 className="font-semibold mb-3">Contacts ({list?.length ?? 0})</h3>
        {!list ? (
          <Thinking label="Loading" />
        ) : (
          <div className="flex flex-col gap-2">
            {list.map((c) => (
              <motion.div layout key={c.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-ink/40 p-3 text-sm">
                <div className="flex-1 min-w-48">
                  <div className="font-medium">
                    {c.name} · <span className="text-muted">{c.company}</span>
                  </div>
                  <div className="text-xs text-muted">
                    {c.role} {c.howFound && `· ${c.howFound}`} {c.messagedOn && `· messaged ${c.messagedOn}`} {c.followUpOn && `· follow up ${c.followUpOn}`}
                  </div>
                </div>
                {c.link && (
                  <a href={c.link} target="_blank" rel="noreferrer" className="text-accent-2">
                    <ExternalLink size={14} />
                  </a>
                )}
                <select className={clsx(inputCls, "py-1")} value={c.status} onChange={(e) => update(c, { status: e.target.value as Contact["status"] })}>
                  <option value="to-contact">To contact</option>
                  <option value="messaged">Messaged</option>
                  <option value="replied">Replied</option>
                  <option value="referred">Referred ✓</option>
                  <option value="no-reply">No reply</option>
                </select>
                {c.status === "to-contact" && (
                  <Button size="sm" variant="ghost" onClick={() => markMessaged(c)}>
                    I messaged them
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

/* --------------------------------- Briefs --------------------------------- */

function Briefs() {
  const [files, setFiles] = useState<string[]>([]);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [busy, setBusy] = useState(false);
  const [md, setMd] = useState<string | null>(null);
  const [err, setErr] = useState<unknown>(null);
  const load = () => api<string[]>("/api/jobs/brief").then(setFiles).catch(() => undefined);
  useEffect(() => {
    load();
  }, []);
  const gen = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await api<{ markdown: string }>("/api/jobs/brief", { body: { company, role } });
      setMd(r.markdown);
      load();
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(false);
    }
  };
  const open = async (f: string) => setMd((await api<{ markdown: string }>(`/api/jobs/brief?file=${f}`)).markdown);
  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-6">
      <Panel className="h-fit">
        <Field label="Company">
          <input className={inputCls} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Stripe" />
        </Field>
        <div className="h-3" />
        <Field label="Role (optional)">
          <input className={inputCls} value={role} onChange={(e) => setRole(e.target.value)} />
        </Field>
        <Button className="mt-3 w-full" onClick={gen} loading={busy} disabled={!company}>
          <Sparkles size={16} /> Research brief
        </Button>
        <div className="mt-5 text-xs uppercase tracking-wide text-muted mb-2">Saved briefs</div>
        {files.map((f) => (
          <button key={f} onClick={() => open(f)} className="w-full text-left text-sm rounded-lg px-2 py-1.5 hover:bg-panel-2 flex gap-2 items-center">
            <Building2 size={14} className="text-muted" /> {f.replace(/\.md$/, "")}
          </button>
        ))}
      </Panel>
      <div>
        <ErrorBox error={err} />
        {busy && <Thinking label="Researching the company" />}
        {md && !busy && (
          <Panel>
            <Md>{md}</Md>
          </Panel>
        )}
      </div>
    </div>
  );
}

/* --------------------------------- Salary --------------------------------- */

function Salary() {
  const [gross, setGross] = useState(65000);
  const [costs, setCosts] = useState(() => Object.fromEntries(CITIES.map((c) => [c.id, { rent: c.rent, living: c.living }])));
  const [rate, setRate] = useState({ EUR: 10.8, GBP: 12.6 });
  const rows = useMemo(
    () =>
      CITIES.map((c) => {
        const t = takeHome(gross, c);
        const monthlyNet = t.net / 12;
        const left = monthlyNet - costs[c.id].rent - costs[c.id].living;
        const floor = c.country === "IE" ? VISA_FLOORS.IE : VISA_FLOORS.UK;
        return { c, t, monthlyNet, left, meetsVisa: gross >= floor.amount, floor };
      }),
    [gross, costs],
  );
  const max = Math.max(...rows.map((r) => r.monthlyNet));
  return (
    <div className="flex flex-col gap-6">
      <Panel>
        <div className="flex flex-wrap items-end gap-6">
          <Field label="Gross yearly salary (in local currency: € for Ireland, £ for UK)">
            <input type="number" className={clsx(inputCls, "w-48 text-lg")} value={gross} onChange={(e) => setGross(Number(e.target.value) || 0)} />
          </Field>
          <input type="range" min={30000} max={140000} step={1000} value={gross} onChange={(e) => setGross(Number(e.target.value))} className="flex-1 min-w-48 accent-violet-500" />
          <Field label="1 € = MAD">
            <input type="number" step="0.1" className={clsx(inputCls, "w-24")} value={rate.EUR} onChange={(e) => setRate((r) => ({ ...r, EUR: Number(e.target.value) }))} />
          </Field>
          <Field label="1 £ = MAD">
            <input type="number" step="0.1" className={clsx(inputCls, "w-24")} value={rate.GBP} onChange={(e) => setRate((r) => ({ ...r, GBP: Number(e.target.value) }))} />
          </Field>
        </div>
        <p className="text-xs text-muted mt-3">{TAX_YEAR_NOTE} Rent and living costs are rough 1-bed estimates — click a number to edit it.</p>
      </Panel>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {rows.map(({ c, t, monthlyNet, left, meetsVisa, floor }, i) => {
          const sym = c.currency === "EUR" ? "€" : "£";
          const fmt = (n: number) => `${sym}${Math.round(n).toLocaleString("en-GB")}`;
          return (
            <Panel key={c.id} delay={i * 0.03}>
              <div className="flex justify-between items-center">
                <div className="font-semibold text-lg">{c.name}</div>
                <Badge tone={meetsVisa ? "good" : "bad"}>{meetsVisa ? "visa floor OK" : `below ${sym}${floor.amount.toLocaleString()}`}</Badge>
              </div>
              <div className="mt-3 h-2 rounded-full bg-line overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-accent to-accent-2" animate={{ width: `${(monthlyNet / max) * 100}%` }} />
              </div>
              <div className="grid grid-cols-2 gap-y-1 text-sm mt-3">
                <span className="text-muted">Net / month</span>
                <span className="text-right font-semibold">{fmt(monthlyNet)}</span>
                <span className="text-muted">Income tax / yr</span>
                <span className="text-right">{fmt(t.incomeTax)}</span>
                <span className="text-muted">{t.otherLabel} / yr</span>
                <span className="text-right">{fmt(t.other)}</span>
                <span className="text-muted">Rent</span>
                <input
                  type="number"
                  className="text-right bg-transparent border-b border-dashed border-line outline-none"
                  value={costs[c.id].rent}
                  onChange={(e) => setCosts((x) => ({ ...x, [c.id]: { ...x[c.id], rent: Number(e.target.value) || 0 } }))}
                />
                <span className="text-muted">Food, transport, bills</span>
                <input
                  type="number"
                  className="text-right bg-transparent border-b border-dashed border-line outline-none"
                  value={costs[c.id].living}
                  onChange={(e) => setCosts((x) => ({ ...x, [c.id]: { ...x[c.id], living: Number(e.target.value) || 0 } }))}
                />
                <span className="font-medium">Left each month</span>
                <span className={clsx("text-right font-bold", left >= 0 ? "text-good" : "text-bad")}>{fmt(left)}</span>
                <span className="text-muted text-xs">≈ in MAD</span>
                <span className="text-right text-xs text-muted">{Math.round(left * rate[c.currency]).toLocaleString("en-GB")} MAD</span>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
