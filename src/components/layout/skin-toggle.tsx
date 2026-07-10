"use client";

import { useEffect, useState } from "react";
import { Palette } from "lucide-react";
import { useDict } from "@/components/layout/locale-provider";
import { cn } from "@/lib/utils";

type Skin = "vibrant" | "sunset";
const SKINS: Skin[] = ["vibrant", "sunset"];

// 每个皮肤按钮的小色卡，直观预览主色
const SWATCH: Record<Skin, string> = {
  vibrant: "oklch(0.55 0.19 274)",
  sunset: "oklch(0.62 0.19 35)",
};

export function SkinToggle() {
  const t = useDict();
  const labels: Record<Skin, string> = {
    vibrant: t.nav.skinVibrant,
    sunset: t.nav.skinSunset,
  };
  // 默认皮肤「活泼」= @theme 基色，无需 data-skin
  const [skin, setSkin] = useState<Skin>("vibrant");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-skin");
    if (current === "sunset") setSkin("sunset");
  }, []);

  function apply(next: Skin) {
    setSkin(next);
    if (next === "sunset") {
      document.documentElement.setAttribute("data-skin", "sunset");
    } else {
      document.documentElement.removeAttribute("data-skin");
    }
    try {
      localStorage.setItem("skin", next);
    } catch {
      // 忽略隐私模式等写入失败
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-2.5">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Palette className="h-3.5 w-3.5" />
        {t.nav.skin}
      </div>
      <div className="grid grid-cols-2 gap-1">
        {SKINS.map((option) => (
          <button
            key={option}
            onClick={() => apply(option)}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
              skin === option
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <span
              className="h-3 w-3 shrink-0 rounded-full border border-black/10"
              style={{ background: SWATCH[option] }}
            />
            {labels[option]}
          </button>
        ))}
      </div>
    </div>
  );
}
