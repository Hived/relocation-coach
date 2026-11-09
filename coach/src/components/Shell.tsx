"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import {
  Home,
  Code2,
  Languages,
  Layers,
  BookX,
  RotateCcw,
  GraduationCap,
  Mic,
  Briefcase,
  Plane,
  BarChart3,
  Settings,
  Menu,
  X,
} from "lucide-react";
import clsx from "clsx";

const NAV = [
  { href: "/", label: "Today", icon: Home },
  { href: "/coding", label: "Coding Studio", icon: Code2 },
  { href: "/french", label: "French Studio", icon: Languages },
  { href: "/cards", label: "Flashcards", icon: Layers },
  { href: "/mistakes", label: "Mistake Journal", icon: BookX },
  { href: "/relearn", label: "Relearn", icon: RotateCcw },
  { href: "/teach", label: "Teach-back", icon: GraduationCap },
  { href: "/interview", label: "Mock Interview", icon: Mic },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/relocation", label: "Relocation", icon: Plane },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavLinks({ onClick }: { onClick?: () => void }) {
  const path = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link key={href} href={href} onClick={onClick} className="relative">
            {active && (
              <motion.span
                layoutId="nav-active"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-accent/30 to-accent-2/10 border border-accent/40"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className={clsx("relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors", active ? "text-white" : "text-muted hover:text-text")}>
              <Icon size={18} />
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen">
      <aside className="hidden lg:flex w-60 shrink-0 flex-col gap-6 border-r border-line/70 p-4 sticky top-0 h-screen">
        <Link href="/" className="px-2 pt-1">
          <div className="text-lg font-bold gradient-text">Relocation Coach</div>
          <div className="text-xs text-muted">🇮🇪 🇬🇧 · .NET · 🇫🇷</div>
        </Link>
        <NavLinks />
      </aside>

      <div className="lg:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4 h-14 glass">
        <span className="font-bold gradient-text">Relocation Coach</span>
        <button aria-label="Menu" onClick={() => setOpen(true)} className="p-2">
          <Menu />
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <>
            <motion.div className="lg:hidden fixed inset-0 bg-black/60 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside
              className="lg:hidden fixed left-0 top-0 bottom-0 w-64 z-50 p-4 bg-panel border-r border-line"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
            >
              <button aria-label="Close" onClick={() => setOpen(false)} className="mb-4 p-2">
                <X />
              </button>
              <NavLinks onClick={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 pt-20 lg:pt-8 pb-16">
        <AnimatePresence mode="wait">
          <motion.div key={path} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
