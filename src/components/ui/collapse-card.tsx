import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * 可折叠的表单卡片：列表内容优先，新建表单默认收起。
 * 页面顶部的「新建」按钮链接到 ?new=1#new 即可展开并定位到这里。
 */
export function CollapseCard({
  id = "new",
  title,
  hint,
  open = false,
  className,
  children,
}: {
  id?: string;
  title: string;
  hint?: string;
  open?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card id={id} className={cn("scroll-mt-20 overflow-hidden", className)}>
      <details open={open} className="group">
        <summary className="no-marker flex cursor-pointer items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/50">
          <div className="min-w-0">
            <div className="text-sm font-semibold">{title}</div>
            {hint ? (
              <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
            ) : null}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-border p-4">{children}</div>
      </details>
    </Card>
  );
}
