"use client";

import { useId, useState } from "react";
import { ChevronDown, Pencil } from "lucide-react";

/**
 * 内联编辑：关闭时不挂载 children，避免每条记录都提前生成完整表单 DOM。
 */
export function InlineEdit({
  label = "编辑",
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-primary hover:underline"
        onClick={() => setOpen((value) => !value)}
      >
        <Pencil className="h-3 w-3" />
        {label}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? <div id={bodyId} className="inline-edit-body">{children}</div> : null}
    </div>
  );
}
