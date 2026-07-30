"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { createTaskAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { sendChannelOptions, taskStatusOptions, waitingOnOptions } from "@/lib/workflow-meta";

const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
const priorityLabels: Record<string, string> = { LOW: "低", MEDIUM: "中", HIGH: "高", URGENT: "紧急" };

export function NewTaskDrawer({
  projects,
  contacts,
  taskTypes,
  openDefault = false,
}: {
  projects: readonly { id: string; name: string }[];
  contacts: readonly { id: string; name: string; organization: string }[];
  taskTypes: readonly string[];
  openDefault?: boolean;
}) {
  const [open, setOpen] = useState(openDefault);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />新建任务</Button>
      <div className={`s3-drawer ${open ? "is-open" : ""}`} role="dialog" aria-modal="true" aria-label="新建任务">
        <button type="button" className="s3-backdrop" aria-label="关闭新建任务" onClick={() => setOpen(false)} />
        <aside className="s3-drawer-panel">
          <div className="s3-drawer-head">
            <div>
              <div className="os-card-title">新建任务</div>
              <div className="os-card-sub">一件事只建一行，写清楚下一步动作</div>
            </div>
            <button type="button" className="s3-close" onClick={() => setOpen(false)}><X className="mx-auto h-4 w-4" /></button>
          </div>
          <div className="s3-drawer-body">
            <form action={createTaskAction} className="os-form-grid">
              <label className="os-field-full"><span className="flabel">标题</span><input name="title" placeholder="例如：确认越南参会人员名单" className="field" /></label>
              <label className="os-field-full"><span className="flabel">关联项目</span><select name="projectId" className="field"><option value="">不挂项目（个人/行政事务）</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
              <label><span className="flabel">类型</span><select name="type" className="field">{taskTypes.map((typeName) => <option key={typeName}>{typeName}</option>)}</select></label>
              <label><span className="flabel">优先级</span><select name="priority" defaultValue="MEDIUM" className="field">{priorities.map((value) => <option key={value} value={value}>{priorityLabels[value]}</option>)}</select></label>
              <label><span className="flabel">状态</span><select name="status" defaultValue="NOT_STARTED" className="field">{taskStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
              <label><span className="flabel">截止日期</span><input type="date" name="dueDate" className="field" /></label>
              <label><span className="flabel">等待对象</span><select name="waitingOn" className="field"><option value="">无</option>{waitingOnOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
              <label><span className="flabel">发送渠道</span><select name="sendChannel" className="field"><option value="">无</option>{sendChannelOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
              <label className="os-field-full"><span className="flabel">负责人</span><select name="assigneeId" className="field"><option value="">暂不选择</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name} / {contact.organization}</option>)}</select></label>
              <label className="os-field-full"><span className="flabel">下一步 / 说明</span><textarea name="description" className="field min-h-28 resize-y" placeholder="写清楚下一步动作，避免只留下一个模糊标题。" /></label>
              <div className="os-row justify-end os-field-full">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button>
                <Button type="submit"><Plus className="h-4 w-4" />保存任务</Button>
              </div>
            </form>
          </div>
        </aside>
      </div>
    </>
  );
}