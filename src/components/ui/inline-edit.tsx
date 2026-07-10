import { Pencil } from "lucide-react";

/**
 * 内联编辑：一个「编辑」小链接，点开展开表单（原生 details，无需 JS）。
 * label 默认「编辑」。children 放要展开的编辑表单。
 */
export function InlineEdit({
  label = "编辑",
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group/edit">
      <summary className="no-marker inline-flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-primary hover:underline">
        <Pencil className="h-3 w-3" />
        {label}
      </summary>
      <div className="mt-2 rounded-lg border border-border bg-secondary/30 p-3">
        {children}
      </div>
    </details>
  );
}
