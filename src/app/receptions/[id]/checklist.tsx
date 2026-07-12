"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Trash2, X } from "lucide-react";
import {
  addReceptionChecklistItemAction,
  applyReceptionChecklistTemplateAction,
  deleteReceptionChecklistItemAction,
  toggleReceptionChecklistItemAction,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import { useDict } from "@/components/layout/locale-provider";
import { receptionPhases } from "@/lib/default-data";
import { cn } from "@/lib/utils";

export type ChecklistItem = {
  id: string;
  receptionId: string;
  phase: string;
  title: string;
  done: boolean;
  ownerId: string;
  dueDate: string;
  note: string;
  isMine: boolean;
  sortOrder: number;
};

export function ReceptionChecklist({
  receptionId,
  initialItems,
  dbConnected,
}: {
  receptionId: string;
  initialItems: ChecklistItem[];
  dbConnected: boolean;
}) {
  const t = useDict();
  const [items, setItems] = useState<ChecklistItem[]>(initialItems);
  const [addingPhase, setAddingPhase] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [, startTransition] = useTransition();
  const router = useRouter();

  const done = items.filter((item) => item.done).length;
  const total = items.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  function toggle(item: ChecklistItem) {
    const next = !item.done;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, done: next } : i)),
    );
    if (dbConnected) {
      startTransition(async () => {
        await toggleReceptionChecklistItemAction(item.id, next, receptionId);
        router.refresh();
      });
    }
  }

  function remove(item: ChecklistItem) {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    if (dbConnected) {
      startTransition(async () => {
        await deleteReceptionChecklistItemAction(item.id, receptionId);
        router.refresh();
      });
    }
  }

  function applyTemplate() {
    if (!dbConnected) return;
    startTransition(async () => {
      await applyReceptionChecklistTemplateAction(receptionId);
      router.refresh();
    });
  }

  function addItem(phase: string) {
    const title = draft.trim();
    if (!title) {
      setAddingPhase(null);
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        id: `tmp-${Date.now()}`,
        receptionId,
        phase,
        title,
        done: false,
        ownerId: "",
        dueDate: "",
        note: "",
        isMine: false,
        sortOrder: prev.length,
      },
    ]);
    setDraft("");
    setAddingPhase(null);
    if (dbConnected) {
      startTransition(async () => {
        await addReceptionChecklistItemAction(receptionId, phase, title);
        router.refresh();
      });
    }
  }

  const knownPhases = receptionPhases as readonly string[];
  const phases = [
    ...receptionPhases,
    ...Array.from(new Set(items.map((i) => i.phase))).filter(
      (p) => !knownPhases.includes(p),
    ),
  ];

  return (
    <section className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      {/* 进度头 */}
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-semibold">{t.receptionDetail.checklistTitle}</h2>
          <span className="tnum text-sm font-semibold text-primary">
            {t.receptionDetail.progress(done, total)}
          </span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        {!dbConnected ? (
          <div className="mt-2 text-xs text-muted-foreground">
            {t.receptionDetail.demoTip}
          </div>
        ) : null}
      </div>

      <div className="px-3 py-3">
        {total === 0 ? (
          <div className="flex flex-col items-start gap-3 px-2 py-4">
            <span className="text-sm text-muted-foreground">
              {t.receptionDetail.emptyChecklist}
            </span>
            <Button size="sm" onClick={applyTemplate} disabled={!dbConnected}>
              <Plus className="h-4 w-4" />
              {t.receptionDetail.applyTemplate}
            </Button>
          </div>
        ) : null}

        {phases.map((phase) => {
          const rows = items.filter((item) => item.phase === phase);
          if (rows.length === 0 && addingPhase !== phase) return null;
          return (
            <div key={phase} className="mb-1">
              <div className="px-2 pb-1 pt-3 text-[11px] font-bold tracking-wide text-muted-foreground">
                {phase}
              </div>
              {rows.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "group flex items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-secondary/50",
                    item.isMine && "bg-primary/5 ring-1 ring-inset ring-primary/20",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggle(item)}
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      item.done
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-input hover:border-primary",
                    )}
                    aria-label={item.title}
                  >
                    {item.done ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div
                      className={cn(
                        "text-sm font-medium",
                        item.done && "text-muted-foreground line-through",
                      )}
                    >
                      {item.title}
                    </div>
                    {item.note || item.dueDate ? (
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {item.note}
                        {item.note && item.dueDate ? " · " : ""}
                        {item.dueDate ? (
                          <span className="tnum">{item.dueDate}</span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  {item.isMine ? (
                    <span className="mt-0.5 shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {t.receptionDetail.mine}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => remove(item)}
                    className="mt-0.5 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
                    aria-label="delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {addingPhase === phase ? (
                <div className="flex items-center gap-2 px-2 py-2">
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addItem(phase);
                      if (e.key === "Escape") {
                        setDraft("");
                        setAddingPhase(null);
                      }
                    }}
                    placeholder={t.receptionDetail.addTitlePh}
                    className="field field-sm flex-1"
                  />
                  <Button size="sm" onClick={() => addItem(phase)}>
                    {t.common.add}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setDraft("");
                      setAddingPhase(null);
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setDraft("");
                    setAddingPhase(phase);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-secondary/50 hover:text-primary"
                >
                  <Plus className="h-4 w-4" />
                  {t.receptionDetail.addRow}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
