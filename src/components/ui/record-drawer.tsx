"use client";

import { useId, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 列表记录的统一抽屉容器。
 * 关闭时只挂载摘要行；完整编辑内容仅在用户打开抽屉后进入 DOM。
 */
export function RecordDrawer({
  summary,
  title,
  subtitle,
  children,
  className,
  summaryClassName,
  bodyClassName,
  ariaLabel = "编辑记录",
}: {
  summary: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  summaryClassName?: string;
  bodyClassName?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const drawerId = useId();

  return (
    <div
      className={cn("overflow-hidden rounded-lg border border-border bg-card", className)}
      data-state={open ? "open" : "closed"}
    >
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={drawerId}
        aria-label={ariaLabel}
        className={cn(
          "flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-secondary/40",
          summaryClassName,
        )}
        onClick={() => setOpen(true)}
      >
        <div className="min-w-0 flex-1">{summary}</div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open ? (
        <div id={drawerId} className="s3-drawer is-open" role="dialog" aria-modal="true" aria-label={ariaLabel}>
          <button
            type="button"
            className="s3-backdrop"
            aria-label={`关闭${ariaLabel}`}
            onClick={() => setOpen(false)}
          />
          <aside className="s3-drawer-panel">
            <div className="s3-drawer-head">
              <div className="min-w-0">
                <div className="os-card-title truncate">{title}</div>
                {subtitle ? <div className="os-card-sub mt-1 truncate">{subtitle}</div> : null}
              </div>
              <button type="button" className="s3-close" aria-label={`关闭${ariaLabel}`} onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className={cn("s3-drawer-body", bodyClassName)}>{children}</div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
