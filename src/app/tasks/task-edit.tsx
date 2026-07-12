"use client";

import { useState } from "react";
import { Pencil, X } from "lucide-react";
import { updateTaskAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { useDict } from "@/components/layout/locale-provider";

type Task = {
  id: string;
  title: string;
  projectId: string;
  type: string;
  priority: string;
  dueDate: string;
  assigneeId: string;
};

/** 任务编辑：铅笔按钮打开弹框，改 标题/项目/类型/优先级/截止/负责人 */
export function TaskEditButton({
  task,
  projects,
  contacts,
  taskTypes,
}: {
  task: Task;
  projects: { id: string; name: string }[];
  contacts: { id: string; name: string; organization: string }[];
  taskTypes: readonly string[];
}) {
  const t = useDict();
  const [open, setOpen] = useState(false);
  const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        type="button"
        className="h-8 w-8"
        title={t.common.edit}
        onClick={() => setOpen(true)}
      >
        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="text-base font-semibold">{t.tasks.newTask}</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form action={updateTaskAction} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="taskId" value={task.id} />
              <label className="sm:col-span-2">
                <span className="flabel">{t.tasks.fTitle}</span>
                <input name="title" defaultValue={task.title} className="field" />
              </label>
              <label className="sm:col-span-2">
                <span className="flabel">{t.tasks.fProject}</span>
                <select name="projectId" defaultValue={task.projectId} className="field">
                  <option value="">{t.common.noProject}</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="flabel">{t.tasks.fType}</span>
                <select name="type" defaultValue={task.type} className="field">
                  {taskTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="flabel">{t.tasks.fPriority}</span>
                <select name="priority" defaultValue={task.priority} className="field">
                  {priorities.map((value) => (
                    <option key={value} value={value}>
                      {t.statuses.priority[value]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="flabel">{t.tasks.fDue}</span>
                <input
                  type="date"
                  name="dueDate"
                  defaultValue={task.dueDate}
                  className="field"
                />
              </label>
              <label>
                <span className="flabel">{t.tasks.fAssignee}</span>
                <select name="assigneeId" defaultValue={task.assigneeId} className="field">
                  <option value="">{t.common.notSelected}</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.organization}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center justify-end gap-2 sm:col-span-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  {t.common.cancel}
                </Button>
                <Button type="submit">{t.common.save}</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
