import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Link2,
  Pencil,
  Upload,
  UsersRound,
} from "lucide-react";
import {
  createFileLinkAction,
  deleteFileAction,
  updateFileAction,
  updateStageAction,
  uploadFileAction,
} from "@/app/actions";
import { InlineEdit } from "@/components/ui/inline-edit";
import { TrainingProfilePanel } from "@/app/projects/[projectId]/training-profile";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StageStatusPill, TaskStatusPill } from "@/components/ui/status-pill";
import { fileStatuses, fileTypes, stageStatuses } from "@/lib/default-data";
import { cn } from "@/lib/utils";
import { isDatabaseConfigured } from "@/lib/db-status";
import { isStorageConfigured } from "@/lib/storage";
import { getT } from "@/lib/locale";
import { projectDisplayName } from "@/lib/i18n";
import {
  getContactsForView,
  getProjectFilesForView,
  getProjectForView,
  getProjectStagesForView,
  getProjectTasksForView,
  getProjectTimelineForView,
  getTrainingProfileForView,
} from "@/lib/database-data";

export const dynamic = "force-dynamic";

const inputClass =
  "h-9 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring";
const selectClass =
  "h-9 w-full rounded-md border border-input bg-white px-3 text-sm";

type ContactRecord = Awaited<ReturnType<typeof getContactsForView>>[number];

function isContact(
  contact: ContactRecord | undefined,
): contact is ContactRecord {
  return Boolean(contact);
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ created?: string; error?: string; updated?: string }>;
}) {
  const { projectId } = await params;
  const { created, error, updated } = await searchParams;
  const { locale, t } = await getT();
  const searchParamUpdated = updated === "stage";
  const project = await getProjectForView(projectId);

  if (!project) {
    notFound();
  }

  const storageReady = isStorageConfigured();
  const dbReady = isDatabaseConfigured();

  const [stages, tasks, files, timeline, contacts, trainingProfile] = await Promise.all([
    getProjectStagesForView(project.id),
    getProjectTasksForView(project.id),
    getProjectFilesForView(project.id),
    getProjectTimelineForView(project.id),
    getContactsForView(),
    getTrainingProfileForView(project.id),
  ]);
  const contactMap = new Map(contacts.map((contact) => [contact.id, contact]));
  const owner = contactMap.get(project.ownerId);
  const clientContacts = project.clientContactIds
    .map((id) => contactMap.get(id))
    .filter(isContact);
  const supplierContacts = project.supplierContactIds
    .map((id) => contactMap.get(id))
    .filter(isContact);
  const activeStages = stages.filter(
    (stage) => stage.status === "IN_PROGRESS" || stage.status === "DELAYED",
  );

  return (
    <AppShell>
      <PageHeader
        eyebrow={[project.region, project.type].filter(Boolean).join(" · ")}
        title={projectDisplayName(locale, project)}
        description={[
          locale === "en" ? project.nameZh : project.nameEn,
          `${project.clientName} · 已完成检查点 ${project.completedStageCount}/${project.totalStageCount}`,
          activeStages.length > 0 ? `当前并行 ${activeStages.length} 项` : "当前无进行中事项",
        ]
          .filter(Boolean)
          .join(" — ")}
        action={
          <Link href="/projects">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              {t.detail.backToBoard}
            </Button>
          </Link>
        }
      />

      {created === "file-link" || created === "file-upload" ? (
        <div className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          文件已{created === "file-upload" ? "上传并" : ""}入库。
        </div>
      ) : null}
      {searchParamUpdated ? (
        <div className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          {t.detail.stageUpdated}
        </div>
      ) : null}
      {updated === "advanced" ? (
        <div className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          {t.detail.advanced}
        </div>
      ) : null}
      {error === "storage-not-configured" ? (
        <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          还没有配置文件存储（Supabase Storage）。可以先用「贴链接」方式登记文件；等按 docs 配好 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 后再用「上传文件」。
        </div>
      ) : null}
      {error === "upload-failed" || error === "file-empty" ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {error === "file-empty" ? "请先选择一个文件。" : "上传失败，请检查存储桶是否已创建并设为 public。"}
        </div>
      ) : null}

      {updated === "training" || updated === "training-checklist" ? (
        <div className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          培训台账已保存。
        </div>
      ) : null}

      {trainingProfile ? <TrainingProfilePanel profile={trainingProfile} /> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Card>
            <CardHeader className="border-b border-border">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>推进地图</CardTitle>
                <Badge tone={activeStages.length > 0 ? "info" : "neutral"}>
                  {activeStages.length > 0 ? `并行推进 ${activeStages.length} 项` : "等待下一轮"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              {activeStages.length > 0 ? (
                <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-border pb-4">
                  <span className="text-xs text-muted-foreground">本轮重点</span>
                  {activeStages.map((stage) => (
                    <Badge key={stage.id} tone={stage.status === "DELAYED" ? "risk" : "info"}>
                      {stage.name}
                    </Badge>
                  ))}
                </div>
              ) : null}
              <div>
                {stages.map((stage) => {
                  const taskCount = tasks.filter(
                    (task) => task.stageId === stage.id,
                  ).length;

                  return (
                    <div key={stage.id} className="flex gap-4 border-b border-border py-4 last:border-b-0">
                      <div className="flex w-8 flex-col items-center">
                        <span
                          className={cn(
                            "z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-card text-xs font-semibold",
                            stageNodeColor(stage.status),
                          )}
                        >
                          {stage.sortOrder}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-sm font-semibold">{stage.name}</h2>
                          <StageStatusPill status={stage.status} />
                          <span className="text-xs text-muted-foreground">
                            {t.detail.tasksCount(taskCount)}
                          </span>
                        </div>
                        <div className="tnum mt-1 text-xs text-muted-foreground">
                          {stage.plannedStart || t.detail.notScheduled}
                          {stage.plannedStart || stage.plannedEnd
                            ? t.detail.to
                            : ""}
                          {stage.plannedEnd}
                        </div>
                        {stage.contactIds.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {stage.contactIds.map((contactId) => {
                              const contact = contactMap.get(contactId);
                              return contact ? (
                                <Badge key={contact.id} tone="neutral">
                                  {contact.name} · {contact.organization}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        ) : null}

                        {dbReady ? (
                          <details className="group/edit mt-2">
                            <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-primary hover:underline">
                              <Pencil className="h-3 w-3" />
                              {t.detail.editStage}
                            </summary>
                            <form
                              action={updateStageAction}
                              className="mt-2 grid gap-2 rounded-md border border-border bg-secondary/30 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
                            >
                              <input type="hidden" name="stageId" value={stage.id} />
                              <input
                                type="date"
                                name="plannedStart"
                                defaultValue={stage.plannedStart || ""}
                                className="h-8 rounded-md border border-input bg-white px-2 text-xs"
                              />
                              <input
                                type="date"
                                name="plannedEnd"
                                defaultValue={stage.plannedEnd || ""}
                                className="h-8 rounded-md border border-input bg-white px-2 text-xs"
                              />
                              <select
                                name="status"
                                defaultValue={stage.status}
                                className="h-8 rounded-md border border-input bg-white px-2 text-xs"
                              >
                                {stageStatuses.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              <Button type="submit" size="sm" className="h-8">
                                保存
                              </Button>
                            </form>
                          </details>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle>{t.detail.relatedTasks}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-border text-xs text-muted-foreground">
                    <tr>
                      <th className="pb-3 font-medium">任务</th>
                      <th className="pb-3 font-medium">类型</th>
                      <th className="pb-3 font-medium">负责人</th>
                      <th className="pb-3 font-medium">截止</th>
                      <th className="pb-3 font-medium">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {tasks.map((task) => (
                      <tr key={task.id}>
                        <td className="py-3 font-medium">{task.title}</td>
                        <td className="py-3 text-muted-foreground">{task.type}</td>
                        <td className="py-3 text-muted-foreground">
                          {contactMap.get(task.assigneeId)?.name}
                        </td>
                        <td className="py-3 font-mono text-xs text-muted-foreground">
                          {task.dueDate}
                        </td>
                        <td className="py-3">
                          <TaskStatusPill status={task.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersRound className="h-4 w-4 text-primary" />
                {t.detail.team}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ContactGroup label={t.detail.ourTeam} contacts={owner ? [owner] : []} />
              <ContactGroup label={t.detail.clientSide} contacts={clientContacts} />
              <ContactGroup label={t.detail.supplierSide} contacts={supplierContacts} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>操作与交付记录</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {timeline.map((event) => (
                <div key={event.id} className="border-l-2 border-primary/40 pl-3">
                  <div className="text-sm font-medium">{event.action}</div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {event.message}
                  </p>
                  <div className="mt-1 font-mono text-xs text-muted-foreground">
                    {event.createdAt}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-5">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            {t.detail.files}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              {files.length === 0 ? (
                <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  还没有文件，用右侧表单登记链接或上传文件。
                </div>
              ) : (
                <div className="space-y-3">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="rounded-md border border-border p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{file.name}</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge tone="info">{file.type}</Badge>
                            {file.version ? (
                              <Badge tone="neutral">v{file.version}</Badge>
                            ) : null}
                          </div>
                          <div className="mt-2 font-mono text-xs text-muted-foreground">
                            {file.updatedAt}
                          </div>
                        </div>
                        {file.url ? (
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            <ExternalLink className="h-4 w-4" />
                            {t.common.open}
                          </a>
                        ) : null}
                      </div>
                      {dbReady ? (
                        <div className="mt-2 flex items-center gap-3 border-t border-border/60 pt-2">
                          <InlineEdit label={t.common.edit}>
                            <form
                              action={updateFileAction}
                              className="grid gap-2 sm:grid-cols-2"
                            >
                              <input type="hidden" name="id" value={file.id} />
                              <input
                                type="hidden"
                                name="projectId"
                                value={project.id}
                              />
                              <label className="sm:col-span-2">
                                <span className="flabel">文件名</span>
                                <input
                                  name="name"
                                  defaultValue={file.name}
                                  className="field field-sm"
                                />
                              </label>
                              <label>
                                <span className="flabel">类型</span>
                                <select
                                  name="type"
                                  defaultValue={file.type}
                                  className="field field-sm"
                                >
                                  {fileTypes.map((ft) => (
                                    <option key={ft}>{ft}</option>
                                  ))}
                                </select>
                              </label>
                              <label>
                                <span className="flabel">版本</span>
                                <input
                                  name="version"
                                  defaultValue={file.version}
                                  className="field field-sm"
                                />
                              </label>
                              <label className="sm:col-span-2">
                                <span className="flabel">链接</span>
                                <input
                                  name="url"
                                  defaultValue={file.url}
                                  placeholder="https://"
                                  className="field field-sm"
                                />
                              </label>
                              <label>
                                <span className="flabel">状态</span>
                                <select
                                  name="status"
                                  defaultValue={file.status}
                                  className="field field-sm"
                                >
                                  {fileStatuses.map((s) => (
                                    <option key={s.value} value={s.value}>
                                      {s.label}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label>
                                <span className="flabel">关联阶段</span>
                                <select
                                  name="stageId"
                                  defaultValue={file.stageId ?? ""}
                                  className="field field-sm"
                                >
                                  <option value="">不关联阶段</option>
                                  {stages.map((s) => (
                                    <option key={s.id} value={s.id}>
                                      {s.name}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <div className="flex items-end justify-end sm:col-span-2">
                                <Button type="submit" size="sm">
                                  {t.common.save}
                                </Button>
                              </div>
                            </form>
                          </InlineEdit>
                          <form action={deleteFileAction}>
                            <input type="hidden" name="id" value={file.id} />
                            <input
                              type="hidden"
                              name="projectId"
                              value={project.id}
                            />
                            <button
                              type="submit"
                              className="text-xs font-medium text-muted-foreground hover:text-red-600"
                            >
                              {t.common.delete}
                            </button>
                          </form>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div className="rounded-md border border-border p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <Link2 className="h-4 w-4 text-primary" />
                  方式一：贴链接（网盘 / OneDrive）
                </div>
                <form action={createFileLinkAction} className="space-y-3">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input name="name" placeholder="文件名（必填）" className={inputClass} />
                  <input name="url" placeholder="粘贴文件分享链接" className={inputClass} />
                  <div className="grid grid-cols-2 gap-2">
                    <select name="type" className={selectClass} defaultValue={fileTypes[0]}>
                      {fileTypes.map((type) => (
                        <option key={type}>{type}</option>
                      ))}
                    </select>
                    <input name="version" placeholder="版本 如 v1.0" className={inputClass} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select name="stageId" className={selectClass}>
                      <option value="">不关联阶段</option>
                      {stages.map((stage) => (
                        <option key={stage.id} value={stage.id}>
                          {stage.name}
                        </option>
                      ))}
                    </select>
                    <select name="status" className={selectClass} defaultValue="DRAFT">
                      {fileStatuses.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button type="submit" variant="outline" className="w-full">
                    <Link2 className="h-4 w-4" />
                    登记链接
                  </Button>
                </form>
              </div>

              <div className="rounded-md border border-border p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <Upload className="h-4 w-4 text-primary" />
                  方式二：上传文件本体
                </div>
                {storageReady ? (
                  <form action={uploadFileAction} className="space-y-3">
                    <input type="hidden" name="projectId" value={project.id} />
                    <input
                      type="file"
                      name="file"
                      className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm"
                    />
                    <input name="name" placeholder="显示名（留空则用原文件名）" className={inputClass} />
                    <div className="grid grid-cols-2 gap-2">
                      <select name="type" className={selectClass} defaultValue={fileTypes[0]}>
                        {fileTypes.map((type) => (
                          <option key={type}>{type}</option>
                        ))}
                      </select>
                      <input name="version" placeholder="版本" className={inputClass} />
                    </div>
                    <select name="stageId" className={selectClass}>
                      <option value="">不关联阶段</option>
                      {stages.map((stage) => (
                        <option key={stage.id} value={stage.id}>
                          {stage.name}
                        </option>
                      ))}
                    </select>
                    <input type="hidden" name="status" value="DRAFT" />
                    <Button type="submit" className="w-full">
                      <Upload className="h-4 w-4" />
                      上传并入库
                    </Button>
                  </form>
                ) : (
                  <p className="text-xs leading-6 text-muted-foreground">
                    尚未配置 Supabase Storage。配好 <code>SUPABASE_URL</code> 和{" "}
                    <code>SUPABASE_SERVICE_ROLE_KEY</code>（见 docs 手册第 10 步）后，这里会出现上传表单。当前可先用左侧「贴链接」。
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function stageNodeColor(status: string) {
  if (status === "COMPLETED") return "border-emerald-500 text-emerald-600";
  if (status === "IN_PROGRESS") return "border-primary text-primary";
  if (status === "DELAYED") return "border-red-500 text-red-600";
  return "border-slate-300 text-slate-400";
}

function ContactGroup({
  label,
  contacts,
}: {
  label: string;
  contacts: ContactRecord[];
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium text-muted-foreground">{label}</div>
      <div className="space-y-2">
        {contacts.map((contact) => (
          <div key={contact.id} className="rounded-md border border-border p-3">
            <div className="text-sm font-medium">{contact.name}</div>
            <div className="mt-1 text-xs leading-5 text-muted-foreground">
              {contact.organization} · {contact.title}
            </div>
            <div className="mt-1 font-mono text-xs text-muted-foreground">
              {contact.email}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
