import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, UsersRound } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StageStatusPill, TaskStatusPill } from "@/components/ui/status-pill";
import {
  getContactsForView,
  getProjectFilesForView,
  getProjectForView,
  getProjectStagesForView,
  getProjectTasksForView,
  getProjectTimelineForView,
} from "@/lib/database-data";

export const dynamic = "force-dynamic";

type ContactRecord = Awaited<ReturnType<typeof getContactsForView>>[number];

function isContact(
  contact: ContactRecord | undefined,
): contact is ContactRecord {
  return Boolean(contact);
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProjectForView(projectId);

  if (!project) {
    notFound();
  }

  const [stages, tasks, files, timeline, contacts] = await Promise.all([
    getProjectStagesForView(project.id),
    getProjectTasksForView(project.id),
    getProjectFilesForView(project.id),
    getProjectTimelineForView(project.id),
    getContactsForView(),
  ]);
  const contactMap = new Map(contacts.map((contact) => [contact.id, contact]));
  const owner = contactMap.get(project.ownerId);
  const clientContacts = project.clientContactIds
    .map((id) => contactMap.get(id))
    .filter(isContact);
  const supplierContacts = project.supplierContactIds
    .map((id) => contactMap.get(id))
    .filter(isContact);

  return (
    <AppShell>
      <PageHeader
        eyebrow={`${project.region} · ${project.type}`}
        title={project.nameZh}
        description={`${project.nameEn}。甲方：${project.clientName}。当前进度 ${project.progress}%，联系人信息均来自联系人库引用。`}
        action={
          <Link href="/projects">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              返回项目看板
            </Button>
          </Link>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle>阶段时间轴</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {stages.map((stage) => (
                  <div
                    key={stage.id}
                    className="grid gap-3 rounded-md border border-border p-4 md:grid-cols-[44px_minmax(0,1fr)_120px]"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-sm font-semibold">
                      {stage.sortOrder}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm font-semibold">{stage.name}</h2>
                        <StageStatusPill status={stage.status} />
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {stage.plannedStart} 至 {stage.plannedEnd}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {stage.contactIds.map((contactId) => {
                          const contact = contactMap.get(contactId);
                          return contact ? (
                            <Badge key={contact.id} tone="neutral">
                              {contact.name} · {contact.organization}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {tasks.filter((task) => task.stageId === stage.id).length} 个任务
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle>关联任务</CardTitle>
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
                团队与对接人
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ContactGroup label="我方团队" contacts={owner ? [owner] : []} />
              <ContactGroup label="甲方对接人" contacts={clientContacts} />
              <ContactGroup label="供应商对接人" contacts={supplierContacts} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                文件库
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {files.map((file) => (
                <div key={file.id} className="rounded-md border border-border p-3">
                  <div className="text-sm font-medium">{file.name}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge tone="info">{file.type}</Badge>
                    <Badge tone="neutral">v{file.version}</Badge>
                  </div>
                  <div className="mt-2 font-mono text-xs text-muted-foreground">
                    {file.updatedAt}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>动态时间线</CardTitle>
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
    </AppShell>
  );
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
