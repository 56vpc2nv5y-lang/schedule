import { NextResponse } from "next/server";
import {
  getContactsForView,
  getFilesForView,
  getGrowthLogsForView,
  getProjectsForView,
  getReceptionsForView,
  getResourcesForView,
  getStagesForView,
  getTasksForView,
  getTimelineForView,
} from "@/lib/database-data";

export const dynamic = "force-dynamic";

// 数据备份：把当前所有业务数据打包成一个 JSON 文件下载。
export async function GET() {
  const [
    contacts,
    projects,
    stages,
    tasks,
    files,
    receptions,
    resources,
    growthLogs,
    timeline,
  ] = await Promise.all([
    getContactsForView(),
    getProjectsForView(),
    getStagesForView(),
    getTasksForView(),
    getFilesForView(),
    getReceptionsForView(),
    getResourcesForView(),
    getGrowthLogsForView(),
    getTimelineForView(),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    contacts,
    projects,
    stages,
    tasks,
    files,
    receptions,
    resources,
    growthLogs,
    timeline,
  };

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="tracker-backup-${date}.json"`,
    },
  });
}
