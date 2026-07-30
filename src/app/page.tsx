import { AppShell } from "@/components/layout/app-shell";
import { getProjectsForView, getStagesForView } from "@/lib/database-data";
import { todayDateKey } from "@/lib/date-time";
import { isDatabaseConfigured } from "@/lib/db-status";
import { GanttChart } from "./gantt-chart-summary";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [projects, stages] = await Promise.all([getProjectsForView(), getStagesForView()]);
  const today = todayDateKey();
  const activeProjects = projects.filter((project) => project.status === "ACTIVE");
  const activeProjectIds = new Set(activeProjects.map((project) => project.id));
  const activeStages = stages.filter((stage) => activeProjectIds.has(stage.projectId));

  return (
    <AppShell>
      <div className="sunny-page">
        <header className="sunny-page-head">
          <div className="page-eyebrow text-xs text-muted-foreground">{today}</div>
          <h1 className="page-title mt-2">近期项目时间线</h1>
          <p className="page-description mt-2 max-w-2xl text-sm leading-6">
            工作台只保留甘特图：暂停项目和远期事项先不占首页，避免每天打开就被历史和远期安排淹没。
          </p>
        </header>
        <GanttChart projects={activeProjects} stages={activeStages} dbConnected={isDatabaseConfigured()} />
      </div>
    </AppShell>
  );
}
