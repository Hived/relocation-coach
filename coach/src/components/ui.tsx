"use client";

import { motion, animate, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import clsx from "clsx";
import { Loader2, Mic, MicOff, Volume2, AlertTriangle } from "lucide-react";
import { useSettings } from "./settings";
import type { TriText } from "@/lib/types";
import { ApiError } from "@/lib/client";

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-muted mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Panel({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={clsx("glass rounded-2xl p-5", className)}
    >
      {children}
    </motion.section>
  );
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "good" | "bad" | "outline"; loading?: boolean; size?: "sm" | "md" };
export function Button({ variant = "primary", loading, size = "md", className, children, disabled, ...rest }: BtnProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.03 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2",
        variant === "primary" && "bg-gradient-to-r from-accent to-indigo-500 text-white shadow-lg shadow-accent/20",
        variant === "ghost" && "bg-panel-2 hover:bg-line text-text",
        variant === "outline" && "border border-line hover:border-accent text-text",
        variant === "good" && "bg-good/90 hover:bg-good text-ink",
        variant === "bad" && "bg-bad/90 hover:bg-bad text-ink",
        className,
      )}
      {...(rest as React.ComponentProps<typeof motion.button>)}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </motion.button>
  );
}

export function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "good" | "bad" | "warn" | "accent" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border",
        tone === "default" && "border-line text-muted",
        tone === "good" && "border-good/40 text-good bg-good/10",
        tone === "bad" && "border-bad/40 text-bad bg-bad/10",
        tone === "warn" && "border-warn/40 text-warn bg-warn/10",
        tone === "accent" && "border-accent/40 text-violet-300 bg-accent/10",
      )}
    >
      {children}
    </span>
  );
}

export function Thinking({ label = "Claude is thinking" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-muted py-4">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-accent to-accent-2"
            animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
      <span className="text-sm">{label}… (a few seconds)</span>
    </div>
  );
}

export function ErrorBox({ error }: { error: unknown }) {
  if (!error) return null;
  const e = error as ApiError;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl border border-bad/40 bg-bad/10 p-3 text-sm flex gap-2">
      <AlertTriangle size={18} className="text-bad shrink-0 mt-0.5" />
      <div>
        <div className="text-bad font-medium">{e.message || String(error)}</div>
        {e.hint && <div className="text-muted mt-1">{e.hint}</div>}
      </div>
    </motion.div>
  );
}

export function ScoreRing({ score, max = 10, size = 110, label }: { score: number; max?: number; size?: number; label?: string }) {
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) => Math.round(v).toString());
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, score / max));
  const color = pct >= 0.8 ? "#34d399" : pct >= 0.5 ? "#fbbf24" : "#fb7185";
  useEffect(() => {
    const ctl = animate(mv, score, { duration: 1.1, ease: "easeOut" });
    return () => ctl.stop();
  }, [score, mv]);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#263152" strokeWidth={8} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-bold">
          <motion.span>{display}</motion.span>
          <span className="text-sm text-muted">/{max}</span>
        </div>
        {label && <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>}
      </div>
    </div>
  );
}

export function Md({ children, className }: { children: string; className?: string }) {
  return (
    <div className={clsx("prose-coach", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children || ""}</ReactMarkdown>
    </div>
  );
}

/** Shows an explanation in EN / Arabic / Darija (Latin) according to settings. Arabic is rendered RTL in its own block. */
export function TriLang({ text, compact, only }: { text?: TriText | null; compact?: boolean; only?: ("en" | "ar" | "darija")[] }) {
  const { settings } = useSettings();
  if (!text) return null;
  const want = (k: "en" | "ar" | "darija") => (!only || only.includes(k)) && !!text[k];
  const rows: { k: "en" | "ar" | "darija"; flag: string; on: boolean }[] = [
    { k: "en", flag: "🇬🇧", on: settings.showEn },
    { k: "ar", flag: "🇸🇦", on: settings.showAr },
    { k: "darija", flag: "🇲🇦", on: settings.showDarija },
  ];
  const visible = rows.filter((r) => r.on && want(r.k));
  const shown = visible.length ? visible : rows.filter((r) => want(r.k)).slice(0, 1);
  return (
    <div className={clsx("flex flex-col", compact ? "gap-1" : "gap-2")}>
      {shown.map((r) =>
        r.k === "ar" ? (
          <div key={r.k} dir="rtl" lang="ar" className="flex gap-2 text-right leading-loose">
            <span className="shrink-0">{r.flag}</span>
            <Md className="flex-1">{text.ar ?? ""}</Md>
          </div>
        ) : (
          <div key={r.k} className="flex gap-2">
            <span className="shrink-0">{r.flag}</span>
            <Md className="flex-1">{text[r.k] ?? ""}</Md>
          </div>
        ),
      )}
    </div>
  );
}

/** Text-to-speech button (browser voice). */
export function SpeakButton({ text, lang = "fr-FR", label }: { text: string; lang?: string; label?: string }) {
  const [speaking, setSpeaking] = useState(false);
  const speak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.92;
    const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith(lang.slice(0, 2)));
    if (voice) u.voice = voice;
    u.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  };
  return (
    <button onClick={speak} title="Listen" className={clsx("inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs border border-line hover:border-accent-2", speaking && "text-accent-2 border-accent-2")}>
      <Volume2 size={14} /> {label}
    </button>
  );
}

type SR = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

/** Microphone → text using the browser's speech recognition (Chrome/Edge). */
export function MicButton({ lang = "fr-FR", onText }: { lang?: string; onText: (t: string) => void }) {
  const [on, setOn] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const rec = useRef<SR | null>(null);
  const toggle = () => {
    if (on) {
      rec.current?.stop();
      return;
    }
    const W = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
    const Ctor = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!Ctor) {
      setErr("Voice input needs Chrome or Edge.");
      return;
    }
    const r = new Ctor();
    r.lang = lang;
    r.continuous = true;
    r.interimResults = false;
    r.onresult = (e) => {
      let t = "";
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) t += e.results[i][0].transcript;
      if (t.trim()) onText(t.trim());
    };
    r.onend = () => setOn(false);
    r.onerror = (e) => {
      setErr(e.error === "not-allowed" ? "Microphone permission denied." : `Mic error: ${e.error}`);
      setOn(false);
    };
    rec.current = r;
    setErr(null);
    r.start();
    setOn(true);
  };
  return (
    <span className="inline-flex items-center gap-2">
      <motion.button
        type="button"
        onClick={toggle}
        animate={on ? { boxShadow: ["0 0 0 0 rgba(251,113,133,.6)", "0 0 0 12px rgba(251,113,133,0)"] } : {}}
        transition={on ? { duration: 1.2, repeat: Infinity } : {}}
        className={clsx("inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm border", on ? "border-bad text-bad bg-bad/10" : "border-line hover:border-accent")}
      >
        {on ? <MicOff size={16} /> : <Mic size={16} />} {on ? "Stop" : "Speak"}
      </motion.button>
      {err && <span className="text-xs text-bad">{err}</span>}
    </span>
  );
}

export function Stat({ label, value, sub, icon, tone = "accent" }: { label: string; value: React.ReactNode; sub?: string; icon?: React.ReactNode; tone?: "accent" | "good" | "bad" | "warn" }) {
  return (
    <Panel className="flex items-center gap-4">
      {icon && (
        <div
          className={clsx(
            "rounded-xl p-3",
            tone === "accent" && "bg-accent/15 text-violet-300",
            tone === "good" && "bg-good/15 text-good",
            tone === "bad" && "bg-bad/15 text-bad",
            tone === "warn" && "bg-warn/15 text-warn",
          )}
        >
          {icon}
        </div>
      )}
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-muted">{label}</div>
        {sub && <div className="text-xs text-muted/80 mt-0.5">{sub}</div>}
      </div>
    </Panel>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-muted">{label}</span>
      {children}
    </label>
  );
}

export const inputCls = "rounded-xl bg-ink/60 border border-line px-3 py-2 outline-none focus:border-accent transition-colors";
