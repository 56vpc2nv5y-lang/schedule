"use client";

import { useState } from "react";
import { Pencil, X } from "lucide-react";
import { updateTaskAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { useDict } from "@/components/layout/locale-provider";
import { sendChannelOptions, taskStatusOptions, waitingOnOptions } from "@/lib/workflow-meta";

type Task = {
  id: string;
  title: string;
  description: string;
  projectId: string;
  type: string;
  priority: string;
  dueDate: string;
  assigneeId: string;
  status: string;
  waitingOn?: string;
  sendChannel?: string;
};

export function TaskEditButton({
  task,
  projects,
  contacts,
  taskTypes,
  trigger = "icon",
}: {
  task: Task;
  projects: { id: string; name: string }[];
  contacts: { id: string; name: string; organization: string }[];
  taskTypes: readonly string[];
  trigger?: "icon" | "title";
}) {
  const t = useDict();
  const [open, setOpen] = useState(false);
  const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

  return (
    <>
      {trigger === "title" ? (
        <button type="button" className="block w-full text-left font-medium hover:text-primary hover:underline" title="编辑任务" onClick={() => setOpen(true)}>
          {task.title}
        </button>
      ) : (
        <Button variant="ghost" size="icon" type="button" className="h-8 w-8" title="编辑任务" onClick={() => setOpen(true)}>
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      )}

      <div className={`s3-drawer ${open ? "is-open" : ""}`} role="dialog" aria-modal="true" aria-label="编辑任务">
        <button type="button" className="s3-backdrop" aria-label="关闭编辑任务" onClick={() => setOpen(false)} />
        <aside className="s3-drawer-panel">
          <div className="s3-drawer-head">
            <div className="min-w-0">
              <div className="os-card-title truncate">编辑任务</div>
              <div className="os-card-sub truncate">{task.title}</div>
            </div>
            <button type="button" className="s3-close" onClick={() => setOpen(false)}><X className="mx-auto h-4 w-4" /></button>
          </div>
          <div className="s3-drawer-body">
            <form action={updateTaskAction} className="os-form-grid">
              <input type="hidden" name="taskId" value={task.id} />
              <label className="os-field-full">
                <span className="flabel">标题</span>
                <input name="title" defaultValue={task.title} className="field" />
              </label>
              <label className="os-field-full">
                <span className="flabel">下一步 / 说明</span>
                <textarea name="description" defaultValue={task.description} className="field min-h-28 resize-y" placeholder="写清楚下一步动作。" />
              </label>
              <label className="os-field-full">
                <span className="flabel">关联项目</span>
                <select name="projectId" defaultValue={task.projectId} className="field">
                  <option value="">不挂项目（个人/行政事务）</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
              <label>
                <span className="flabel">类型</span>
                <select name="type" defaultValue={task.type} className="field">{taskTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select>
              </label>
              <label>
                <span className="flabel">优先级</span>
                <select name="priority" defaultValue={task.priority} className="field">{priorities.map((value) => <option key={value} value={value}>{t.statuses.priority[value]}</option>)}</select>
              </label>
              <label>
                <span className="flabel">状态</span>
                <select name="status" defaultValue={task.status} className="field">{taskStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
              </label>
              <label>
                <span className="flabel">截止日期</span>
                <input type="date" name="dueDate" defaultValue={task.dueDate} className="field" />
              </label>
              <label>
                <span className="flabel">等待对象</span>
                <select name="waitingOn" defaultValue={task.waitingOn ?? ""} className="field"><option value="">无</option>{waitingOnOptions.map((option) => <option key={option}>{option}</option>)}</select>
              </label>
              <label>
                <span className="flabel">发送渠道</span>
                <select name="sendChannel" defaultValue={task.sendChannel ?? ""} className="field"><option value="">无</option>{sendChannelOptions.map((option) => <option key={option}>{option}</option>)}</select>
              </label>
              <label className="os-field-full">
                <span className="flabel">负责人</span>
                <select name="assigneeId" defaultValue={task.assigneeId} className="field"><option value="">暂不选择</option>{contacts.map((c) => <option key={c.id} value={c.id}>{c.name} / {c.organization}</option>)}</select>
              </label>
              <div className="os-row justify-end os-field-full">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button>
                <Button type="submit">保存修改</Button>
              </div>
            </form>
          </div>
        </aside>
      </div>
    </>
  );
}