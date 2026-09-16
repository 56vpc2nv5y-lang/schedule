"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 列表记录的统一折叠容器。
 * 关闭时只挂载摘要行；编辑器等较重内容会在用户点击后才进入 DOM。
 */
export function RecordDisclosure({
  summary,
  children,
  className,
  summaryClassName,
  bodyClassName,
  ariaLabel = "展开记录详情",
}: {
  summary: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  summaryClassName?: string;
  bodyClassName?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();

  return (
    <div
      className={cn("overflow-hidden rounded-lg border border-border bg-card", className)}
      data-state={open ? "open" : "closed"}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        aria-label={ariaLabel}
        className={cn(
          "flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-secondary/40",
          summaryClassName,
        )}
        onClick={() => setOpen((value) => !value)}
      >
        <div className="min-w-0 flex-1">{summary}</div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div id={bodyId} className={cn("border-t border-border p-3", bodyClassName)}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
