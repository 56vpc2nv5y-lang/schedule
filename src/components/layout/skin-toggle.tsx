"use client";

import { useSyncExternalStore } from "react";
import { Palette } from "lucide-react";
import { cn } from "@/lib/utils";

type Skin = "sunny-a" | "sunny-c";
const SKINS: Skin[] = ["sunny-a", "sunny-c"];
const SKIN_CHANGE_EVENT = "schedule-skin-change";

const SKIN_META: Record<Skin, { label: string; dot: string; text: string }> = {
  "sunny-a": { label: "默认暖白", dot: "#F6F3EC", text: "A" },
  "sunny-c": { label: "古风公文", dot: "#EDE3D2", text: "C" },
};

function normalizeSkin(value: string | null): Skin {
  return value === "sunny-c" ? "sunny-c" : "sunny-a";
}

function readSkin(): Skin {
  return normalizeSkin(document.documentElement.getAttribute("data-skin"));
}

function subscribeToSkin(onStoreChange: () => void) {
  window.addEventListener(SKIN_CHANGE_EVENT, onStoreChange);
  return () => window.removeEventListener(SKIN_CHANGE_EVENT, onStoreChange);
}

function getServerSkin(): Skin {
  return "sunny-a";
}

export function SkinToggle() {
  const skin = useSyncExternalStore(subscribeToSkin, readSkin, getServerSkin);

  function apply(next: Skin) {
    document.documentElement.setAttribute("data-skin", next);
    try {
      localStorage.setItem("skin", next);
    } catch {
      // Ignore private-mode storage failures; the current DOM still updates.
    }
    window.dispatchEvent(new Event(SKIN_CHANGE_EVENT));
  }

  return (
    <div className="skin-toggle rounded-lg border border-border bg-card p-2.5">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Palette className="h-3.5 w-3.5" />
        皮肤
      </div>
      <div className="flex items-center gap-2">
        {SKINS.map((option) => {
          const meta = SKIN_META[option];
          return (
            <button
              key={option}
              onClick={() => apply(option)}
              title={meta.label}
              aria-label={meta.label}
              className={cn(
                "skin-dot grid h-8 w-8 place-items-center rounded-full border text-[10px] font-semibold transition-colors",
                skin === option ? "is-active border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground",
              )}
              style={{ background: meta.dot }}
            >
              {meta.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
