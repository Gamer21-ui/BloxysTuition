"use client";
import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { THEMES, type ThemeId } from "@/lib/brand";
import { cn } from "@/lib/utils";

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`;
}

export function ThemeSwitcher({ userId, initial }: { userId: string; initial: ThemeId }) {
  const [theme, setTheme] = useState<ThemeId>(initial);
  const [mode, setMode] = useState(() => (typeof document !== "undefined" ? document.documentElement.dataset.mode : "light") || "light");

  async function pick(t: ThemeId) {
    setTheme(t);
    document.documentElement.dataset.theme = t;
    setCookie("fb_theme", t);
    await createClient().from("profiles").update({ theme: t }).eq("id", userId);
  }
  function toggleMode() {
    const m = mode === "dark" ? "light" : "dark";
    setMode(m);
    document.documentElement.dataset.mode = m;
    setCookie("fb_mode", m);
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => pick(t.id)}
            className={cn("card text-left transition hover:-translate-y-0.5", theme === t.id && "ring-4 ring-accent")}
            data-theme={t.id}
            aria-pressed={theme === t.id}
          >
            <div className="font-display text-lg">{t.label}</div>
            <div className="text-sm text-muted">{t.hint}</div>
            <div className="mt-3 flex gap-1.5">
              {["primary", "accent", "xp", "bad"].map((c) => (
                <span key={c} className="h-5 w-5 border-2 border-line" style={{ background: `rgb(var(--${c}))`, borderRadius: "var(--radius)" }} />
              ))}
            </div>
          </button>
        ))}
      </div>
      {(theme === "bloxy" || theme === "retro") && (
        <button className="btn btn-ghost btn-sm" onClick={toggleMode}>
          {mode === "dark" ? <Sun size={16} /> : <Moon size={16} />} {mode === "dark" ? "Light mode" : "Dark mode"}
        </button>
      )}
    </div>
  );
}
