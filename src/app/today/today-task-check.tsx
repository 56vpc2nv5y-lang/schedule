"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { setTaskStatusQuickAction } from "@/app/actions";
import { cn } from "@/lib/utils";

export function TodayTaskCheck({
  taskId,
  title,
  overdue,
}: {
  taskId: string;
  title: string;
  overdue: boolean;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [pending, startTransition] = useTransition();

  function completeTask() {
    if (pending || checked) return;
    setChecked(true);
    startTransition(async () => {
      try {
        await setTaskStatusQuickAction(taskId, "DONE");
        router.refresh();
      } catch {
        setChecked(false);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={completeTask}
      disabled={pending || checked}
      aria-label={`完成任务：${title}`}
      title="标记为已完成"
      className={cn(
        "grid h-5 w-5 shrink-0 place-items-center border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        overdue ? "border-[var(--status-danger)] text-[var(--status-danger)] hover:bg-[var(--status-danger-bg)]" : "border-[var(--status-active)] text-[var(--status-active)] hover:bg-[var(--status-active-bg)]",
        checked && "border-[var(--status-done)] bg-[var(--status-done)] text-white",
      )}
    >
      {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : checked ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
    </button>
  );
}
