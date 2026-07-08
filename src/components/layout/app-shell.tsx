"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  ContactRound,
  FileClock,
  GanttChartSquare,
  KanbanSquare,
  LogOut,
  PlaneTakeoff,
  Search,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "甘特总览", icon: GanttChartSquare },
  { href: "/projects", label: "项目看板", icon: KanbanSquare },
  { href: "/meeting-reviews", label: "纪要追踪", icon: FileClock },
  { href: "/tasks", label: "任务列表", icon: ClipboardList },
  { href: "/calendar", label: "日历", icon: CalendarDays },
  { href: "/receptions", label: "接待安排", icon: PlaneTakeoff },
  { href: "/contacts", label: "联系人库", icon: ContactRound },
  { href: "/settings", label: "设置", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-white/90 backdrop-blur lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-border px-5 py-5">
            <Link href="/" className="block">
              <div className="text-sm font-semibold text-foreground">
                项目跟踪看板
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Project lifecycle console
              </div>
            </Link>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                    active &&
                      "bg-accent font-medium text-accent-foreground shadow-sm",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-border p-3">
            <div className="rounded-md bg-secondary p-3">
              <div className="text-xs font-medium text-foreground">
                数据源策略
              </div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                联系人只落库一次，业务对象全部引用联系人 ID。
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <div className="min-w-0 flex-1">
              <div className="lg:hidden">
                <div className="text-sm font-semibold">项目跟踪看板</div>
                <div className="text-xs text-muted-foreground">
                  Project lifecycle console
                </div>
              </div>
              <div className="hidden items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm text-muted-foreground lg:flex lg:max-w-md">
                <Search className="h-4 w-4" />
                <span>搜索项目、联系人、文件或任务</span>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
              Vercel 配置
            </Button>
            <Button variant="ghost" size="icon" title="退出">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-border px-3 py-2 lg:hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-xs text-muted-foreground",
                    active && "bg-accent font-medium text-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="px-4 py-5 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
