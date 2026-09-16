"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { setTaskStatusQuickAction } from "@/app/actions";
import { normalizeTaskStatus } from "@/lib/workflow-meta";

export function StatusSelect({
  taskId,
  value,
  options,
  overdue = false,
}: {
  taskId: string;
  value: string;
  options: { value: string; label: string }[];
  overdue?: boolean;
}) {
  const [current, setCurrent] = useState(normalizeTaskStatus(value));
  const [undoValue, setUndoValue] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const mounted = useRef(false);
  const storageKey = `task-status-undo:${taskId}`;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const normalized = normalizeTaskStatus(value);
      setCurrent(normalized);
      const saved = window.sessionStorage.getItem(storageKey);
      if (saved && saved !== normalized) setUndoValue(saved);
      mounted.current = true;
    }, 0);
    return () => window.clearTimeout(timer);
  }, [storageKey, value]);

  function changeStatus(next: string) {
    const previous = current;
    setCurrent(next);
    setUndoValue(previous);
    if (mounted.current) window.sessionStorage.setItem(storageKey, previous);
    startTransition(async () => {
      await setTaskStatusQuickAction(taskId, next);
    });
  }

  function undo() {
    if (!undoValue) return;
    const previous = undoValue;
    setCurrent(previous);
    setUndoValue(null);
    window.sessionStorage.removeItem(storageKey);
    startTransition(async () => {
      await setTaskStatusQuickAction(taskId, previous);
    });
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative inline-flex items-center">
        <select
          aria-label="更新任务状态"
          value={current}
          onChange={(event) => changeStatus(event.target.value)}
          disabled={pending}
          className="sunny-status-select"
          data-tone={statusTone(current, overdue)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {overdue && option.value === current ? "已逾期" : option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5" />
      </span>
      {undoValue ? <button type="button" className="undo-btn" onClick={undo} disabled={pending}>撤销</button> : null}
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : null}
    </span>
  );
}

function statusTone(status: string, overdue: boolean) {
  if (overdue) return "danger";
  if (status === "DONE") return "done";
  if (status === "WAITING_EXTERNAL" || status === "SELF_CHECK") return "waiting";
  if (status === "LEADER_REVIEW") return "danger";
  if (status === "IN_PROGRESS" || status === "READY_TO_SEND") return "active";
  return "neutral";
}
