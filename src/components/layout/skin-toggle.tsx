"use client";

import { useSyncExternalStore } from "react";
import { Palette } from "lucide-react";
import { useDict } from "@/components/layout/locale-provider";
import { cn } from "@/lib/utils";

type Skin = "vibrant" | "sunset";
const SKINS: Skin[] = ["vibrant", "sunset"];
const SKIN_CHANGE_EVENT = "schedule-skin-change";

// 每个皮肤按钮的小色卡，直观预览主色
const SWATCH: Record<Skin, string> = {
  vibrant: "oklch(0.55 0.19 274)",
  sunset: "oklch(0.62 0.19 35)",
};

function readSkin(): Skin {
  const skin = document.documentElement.getAttribute("data-skin");
  return skin === "sunset" ? "sunset" : "vibrant";
}

function subscribeToSkin(onStoreChange: () => void) {
  window.addEventListener(SKIN_CHANGE_EVENT, onStoreChange);
  return () => window.removeEventListener(SKIN_CHANGE_EVENT, onStoreChange);
}

function getServerSkin(): Skin {
  return "vibrant";
}

export function SkinToggle() {
  const t = useDict();
  const labels: Record<Skin, string> = {
    vibrant: t.nav.skinVibrant,
    sunset: t.nav.skinSunset,
  };
  // 默认皮肤「活泼」= @theme 基色，无需 data-skin
  const skin = useSyncExternalStore(subscribeToSkin, readSkin, getServerSkin);

  function apply(next: Skin) {
    document.documentElement.setAttribute("data-skin", next);
    try {
      localStorage.setItem("skin", next);
    } catch {
      // 忽略隐私模式等写入失败
    }
    window.dispatchEvent(new Event(SKIN_CHANGE_EVENT));
  }

  return (
    <div className="skin-toggle rounded-lg border border-border bg-card p-2.5">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Palette className="h-3.5 w-3.5" />
        {t.nav.skin}
      </div>
      <div className="flex items-center gap-2">
        {SKINS.map((option) => (
          <button
            key={option}
            onClick={() => apply(option)}
            title={labels[option]}
            aria-label={labels[option]}
            className={cn(
              "grid h-8 w-8 place-items-center rounded-md border transition-colors",
              skin === option
                ? "border-primary/50 bg-primary/10"
                : "border-transparent hover:bg-secondary",
            )}
          >
            <span
              className={cn(
                "h-3.5 w-3.5 rounded-full border border-black/10",
                skin === option && "ring-2 ring-primary/25 ring-offset-2 ring-offset-card",
              )}
              style={{ background: SWATCH[option] }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
