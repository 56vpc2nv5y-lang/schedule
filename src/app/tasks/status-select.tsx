"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { setTaskStatusQuickAction } from "@/app/actions";

// 状态下拉：选中即保存，不用再点“√”确认。
export function StatusSelect({
  taskId,
  value,
  options,
}: {
  taskId: string;
  value: string;
  options: { value: string; label: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLSelectElement>(null);

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    startTransition(async () => {
      await setTaskStatusQuickAction(taskId, next);
      router.refresh();
    });
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <select
        ref={ref}
        defaultValue={value}
        onChange={onChange}
        disabled={pending}
        className="field field-sm w-auto"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
      ) : null}
    </span>
  );
}
