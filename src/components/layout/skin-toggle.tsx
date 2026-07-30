"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

type Theme = "sunny-a" | "sunny-c" | "sunny-third";
const THEMES: Theme[] = ["sunny-a", "sunny-c", "sunny-third"];
const THEME_CHANGE_EVENT = "schedule-theme-change";

const THEME_META: Record<Theme, { label: string; dot: string; text: string }> = {
  "sunny-a": { label: "默认暖白", dot: "#F6F3EC", text: "A" },
  "sunny-c": { label: "古风公文", dot: "#EDE3D2", text: "C" },
  "sunny-third": { label: "Executive Cobalt", dot: "#2F5BFF", text: "3" },
};

function normalizeTheme(value: string | null): Theme {
  if (value === "sunny-a" || value === "sunny-c" || value === "sunny-third") return value;
  return "sunny-third";
}

function readTheme(): Theme {
  return normalizeTheme(document.documentElement.dataset.theme ?? null);
}

function subscribeToTheme(onStoreChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
}

function getServerTheme(): Theme {
  return "sunny-third";
}

export function SkinToggle() {
  const theme = useSyncExternalStore(subscribeToTheme, readTheme, getServerTheme);

  function apply(next: Theme) {
    document.documentElement.dataset.theme = next;
    document.documentElement.dataset.density = "comfortable";
    document.documentElement.setAttribute("data-skin", next === "sunny-c" ? "sunny-c" : "sunny-a");
    try {
      localStorage.setItem("sunny-theme", next);
      localStorage.setItem("skin", next === "sunny-c" ? "sunny-c" : "sunny-a");
    } catch {
      // DOM update is enough when storage is unavailable.
    }
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }

  return (
    <div className="skin-toggle inline-flex items-center rounded-lg border border-border bg-card p-2">
      <div className="flex items-center gap-2">
        {THEMES.map((option) => {
          const meta = THEME_META[option];
          return (
            <button
              key={option}
              onClick={() => apply(option)}
              title={meta.label}
              aria-label={meta.label}
              className={cn(
                "skin-dot grid h-8 w-8 place-items-center rounded-full border text-[10px] font-semibold transition-colors",
                theme === option ? "is-active border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground",
              )}
              style={{ background: meta.dot, color: option === "sunny-third" ? "#fff" : undefined }}
            >
              {meta.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}