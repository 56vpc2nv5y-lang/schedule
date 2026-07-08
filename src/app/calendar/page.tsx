import { CalendarDays } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getProjectsForView,
  getReceptionsForView,
  getTasksForView,
} from "@/lib/database-data";

export const dynamic = "force-dynamic";

type BadgeTone = "active" | "waiting" | "risk";

export default async function CalendarPage() {
  const [tasks, receptions, projects] = await Promise.all([
    getTasksForView(),
    getReceptionsForView(),
    getProjectsForView(),
  ]);
  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const calendarItems = [
    ...tasks.map((task) => ({
      id: task.id,
      date: task.dueDate,
      title: task.title,
      type: "任务",
      projectId: task.projectId,
      tone: (task.status === "OVERDUE" ? "risk" : "active") as BadgeTone,
    })),
    ...receptions.map((reception) => ({
      id: reception.id,
      date: reception.startAt.slice(0, 10),
      title: reception.title,
      type: "接待",
      projectId: reception.projectId,
      tone: "waiting" as BadgeTone,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <AppShell>
      <PageHeader
        eyebrow="日历视图"
        title="把任务截止和接待安排放到同一张表"
        description="日历用于观察近期承诺，后续可切换为月视图、周视图或同步外部日历。"
      />

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            即将发生
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid gap-3">
            {calendarItems.map((item) => {
              const project = item.projectId ? projectMap.get(item.projectId) : undefined;

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="grid gap-3 rounded-md border border-border p-4 sm:grid-cols-[120px_minmax(0,1fr)_96px]"
                >
                  <div className="font-mono text-sm text-muted-foreground">
                    {item.date}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{item.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {project?.nameZh}
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <Badge tone={item.tone}>{item.type}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
