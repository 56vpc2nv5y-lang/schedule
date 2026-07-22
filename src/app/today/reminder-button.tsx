"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";

const ENABLED_KEY = "schedule-reminders-enabled";

function dateKey() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function notify(overdue: number, dueToday: number, receptions: number) {
  const parts = [
    overdue > 0 ? `${overdue} 项已逾期` : "",
    dueToday > 0 ? `${dueToday} 项今天截止` : "",
    receptions > 0 ? `${receptions} 场接待需准备` : "",
  ].filter(Boolean);
  new Notification("Sunny 的今日工作提醒", {
    body: parts.length > 0 ? parts.join("，") : "今天没有到期或逾期事项。",
    icon: "/icon.svg",
    tag: `schedule-${dateKey()}`,
  });
}

export function ReminderButton({
  overdue,
  dueToday,
  receptions,
}: {
  overdue: number;
  dueToday: number;
  receptions: number;
}) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!("Notification" in window)) return;
    const isEnabled = localStorage.getItem(ENABLED_KEY) === "1";
    const syncTimer = window.setTimeout(() => {
      setEnabled(isEnabled && Notification.permission === "granted");
    }, 0);
    const today = dateKey();
    const notifiedKey = `schedule-reminded-${today}`;
    if (isEnabled && Notification.permission === "granted" && !localStorage.getItem(notifiedKey)) {
      notify(overdue, dueToday, receptions);
      localStorage.setItem(notifiedKey, "1");
    }
    return () => window.clearTimeout(syncTimer);
  }, [overdue, dueToday, receptions]);

  async function toggle() {
    if (!("Notification" in window)) return;
    if (enabled) {
      localStorage.removeItem(ENABLED_KEY);
      setEnabled(false);
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      localStorage.setItem(ENABLED_KEY, "1");
      setEnabled(true);
      notify(overdue, dueToday, receptions);
      localStorage.setItem(`schedule-reminded-${dateKey()}`, "1");
    }
  }

  return (
    <Button type="button" variant="outline" onClick={toggle} title={enabled ? "关闭每日提醒" : "开启每日提醒"}>
      {enabled ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
      {enabled ? "提醒已开" : "开启提醒"}
    </Button>
  );
}
