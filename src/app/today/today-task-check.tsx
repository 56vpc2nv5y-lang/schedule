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
        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        overdue
          ? "border-red-500 text-red-500 hover:bg-red-50"
          : "border-primary text-primary hover:bg-primary/10",
        checked && "border-emerald-600 bg-emerald-600 text-white",
      )}
    >
      {pending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : checked ? (
        <Check className="h-3 w-3" strokeWidth={3} />
      ) : null}
    </button>
  );
}
