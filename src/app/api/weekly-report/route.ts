import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db-status";
import {
  buildWeeklyReportEvidence,
  isDateKey,
} from "@/lib/weekly-report";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "请先连接数据库，周报才能读取看板记录。" },
      { status: 400 },
    );
  }

  const url = new URL(request.url);
  const start = url.searchParams.get("start") ?? "";
  const end = url.searchParams.get("end") ?? "";

  if (!isDateKey(start) || !isDateKey(end) || start > end) {
    return NextResponse.json(
      { error: "请选择正确的周报起止日期。" },
      { status: 400 },
    );
  }

  const rangeDays =
    (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) /
    86_400_000;
  if (rangeDays > 31) {
    return NextResponse.json(
      { error: "一次最多整理 31 天，请缩短日期范围。" },
      { status: 400 },
    );
  }

  try {
    const input = await buildWeeklyReportEvidence(start, end);
    return NextResponse.json({ input });
  } catch (error) {
    const message = error instanceof Error ? error.message : "读取失败";
    return NextResponse.json(
      { error: `读取周报数据失败：${message}` },
      { status: 500 },
    );
  }
}
