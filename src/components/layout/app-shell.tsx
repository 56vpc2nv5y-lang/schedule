"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenText,
  CalendarDays,
  CircleHelp,
  ClipboardList,
  ContactRound,
  FileClock,
  FolderOpen,
  GanttChartSquare,
  KanbanSquare,
  LayoutDashboard,
  Settings,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { SkinToggle } from "@/components/layout/skin-toggle";
import { useDict } from "@/components/layout/locale-provider";
import type { Dict } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: (t: Dict) => string;
  icon: React.ComponentType<{ className?: string }>;
};

const navGroups: { label?: (t: Dict) => string; items: NavItem[] }[] = [
  {
    items: [      { href: "/", label: (t) => t.nav.dashboard, icon: LayoutDashboard },
    ],
  },
  {
    label: (t) => t.nav.groupWork,
    items: [
      { href: "/projects", label: (t) => t.nav.projects, icon: KanbanSquare },
      { href: "/tasks", label: (t) => t.nav.tasks, icon: ClipboardList },
      { href: "/meeting-reviews", label: (t) => t.nav.meetings, icon: FileClock },
    ],
  },
  {
    label: (t) => t.nav.groupSchedule,
    items: [
      { href: "/calendar", label: (t) => t.nav.calendar, icon: CalendarDays },    ],
  },
  {
    label: (t) => t.nav.groupLibrary,
    items: [
      { href: "/contacts", label: (t) => t.nav.contacts, icon: ContactRound },
      { href: "/resources", label: (t) => t.nav.resources, icon: FolderOpen },
      { href: "/knowledge", label: (t) => t.nav.knowledge, icon: BookOpenText },
    ],
  },
  {
    label: (t) => t.nav.groupSystem,
    items: [
      { href: "/growth", label: (t) => t.nav.growth, icon: TrendingUp },
      { href: "/money", label: (t) => t.nav.money, icon: Wallet },
      { href: "/assistant", label: (t) => t.nav.assistant, icon: Sparkles },
      { href: "/guide", label: (t) => t.nav.guide, icon: CircleHelp },
      { href: "/settings", label: (t) => t.nav.settings, icon: Settings },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useDict();
  const flatItems = navGroups.flatMap((group) => group.items);

  return (
    <div className="app-shell min-h-screen bg-background text-foreground">
      <aside className="app-sidebar fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-border bg-card md:block">
        <div className="flex h-full flex-col">
          <div className="app-brand px-4 pb-3 pt-5">
            <Link href="/" className="flex items-center gap-3">
              <span className="app-brand-mark flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <GanttChartSquare className="h-5 w-5" />
              </span>
              <div>
                <div className="app-brand-title text-sm font-semibold text-foreground">
                  {t.nav.appName}
                </div>
                <div className="app-brand-sub text-[11px] text-muted-foreground">
                  {t.nav.appSub}
                </div>
              </div>
            </Link>
          </div>
          <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
            {navGroups.map((group, gi) => (
              <div key={gi}>
                {group.label ? (
                  <div className="app-nav-group mb-1 px-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
                    {group.label(t)}
                  </div>
                ) : null}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(pathname, item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        data-active={active}
                        className={cn(
                          "app-nav-link relative flex h-9 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                          active && "bg-primary/10 font-medium text-primary",
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4",
                            active ? "text-primary" : "text-muted-foreground",
                          )}
                        />
                        <span>{item.label(t)}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          <div className="space-y-2 border-t border-border p-3">
            <SkinToggle />
          </div>
        </div>
      </aside>

      <div className="app-frame md:pl-60">
        <header className="mobile-app-header sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur md:hidden">
          <div className="flex h-14 items-center gap-3 px-4">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{t.nav.appName}</div>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-border px-3 py-2">
            {flatItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-active={active}
                  className={cn(
                    "app-nav-link flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-xs text-muted-foreground",
                    active && "bg-primary/10 font-medium text-primary",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label(t)}
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="app-main px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
