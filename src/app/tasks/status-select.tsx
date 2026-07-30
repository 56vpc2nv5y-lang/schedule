"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { setTaskStatusQuickAction } from "@/app/actions";

export function StatusSelect({
  taskId,
  value,
  options,
}: {
  taskId: string;
  value: string;
  options: { value: string; label: string }[];
}) {
  const [current, setCurrent] = useState(value);
  const [undoValue, setUndoValue] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const mounted = useRef(false);
  const storageKey = `task-status-undo:${taskId}`;

  useEffect(() => {
    setCurrent(value);
    const saved = window.sessionStorage.getItem(storageKey);
    if (saved && saved !== value) setUndoValue(saved);
    mounted.current = true;
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
      <select value={current} onChange={(event) => changeStatus(event.target.value)} disabled={pending} className="field field-sm w-auto">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      {undoValue ? <button type="button" className="undo-btn" onClick={undo} disabled={pending}>撤销</button> : null}
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : null}
    </span>
  );
}
