import { AppShell } from "@/components/layout/app-shell";
import { cn } from "@/lib/utils";

/** 单个骨架灰块：切页时占位，动画来自 globals.css 的 .skeleton */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

/** 页头骨架：标题 + 副标题 + 右侧按钮，匹配 PageHeader 结构 */
function HeaderSkeleton({ withAction = true }: { withAction?: boolean }) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0 space-y-2">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-72" />
      </div>
      {withAction ? (
        <div className="flex shrink-0 gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>
      ) : null}
    </div>
  );
}

function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]",
        className,
      )}
    >
      <Skeleton className="h-4 w-28" />
      <div className="mt-4 space-y-2.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

type Variant = "dashboard" | "list" | "detail" | "board" | "cards";

/**
 * 页面级骨架屏：在 loading.tsx 里渲染，保留侧栏、首屏秒出，
 * 数据到了再由真实页面替换。variant 决定主体布局。
 */
export function PageSkeleton({
  variant = "cards",
  withAction = true,
}: {
  variant?: Variant;
  withAction?: boolean;
}) {
  return (
    <AppShell>
      <HeaderSkeleton withAction={withAction} />
      {variant === "dashboard" ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
              >
                <Skeleton className="h-3 w-16" />
                <Skeleton className="mt-3 h-8 w-20" />
              </div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
            <CardSkeleton className="min-h-[280px]" />
            <CardSkeleton className="min-h-[280px]" />
          </div>
          <CardSkeleton className="min-h-[220px]" />
        </div>
      ) : null}

      {variant === "list" ? (
        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <Skeleton className="h-4 w-32" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {variant === "detail" ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <CardSkeleton className="min-h-[480px]" />
          <div className="space-y-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      ) : null}

      {variant === "board" ? (
        <div className="space-y-4">
          <CardSkeleton className="min-h-[180px]" />
          <div className="grid gap-4 lg:grid-cols-2">
            <CardSkeleton className="min-h-[240px]" />
            <CardSkeleton className="min-h-[240px]" />
          </div>
        </div>
      ) : null}

      {variant === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} className="min-h-[160px]" />
          ))}
        </div>
      ) : null}
    </AppShell>
  );
}
