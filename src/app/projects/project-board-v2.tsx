"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { updateProjectStatusQuickAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { ContextMenu, type MenuItem } from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";

export type BoardProject = {
  id: string;
  name: string;
  nameSub: string;
  region: string;
  type: string;
  status: string;
  completedStageCount: number;
  totalStageCount: number;
  currentStageName: string;
  taskCount: number;
};

export function ProjectBoard({
  projects,
  columns,
  stageLabel,
  taskCountLabel,
  emptyLabel,
  moveLabel,
  dbConnected,
}: {
  projects: BoardProject[];
  columns: {
    label: string;
    status: string;
    tone: "active" | "waiting" | "done" | "neutral";
  }[];
  stageLabel: string;
  taskCountLabel: string;
  emptyLabel: string;
  moveLabel: string;
  dbConnected: boolean;
}) {
  const [items, setItems] = useState(projects);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    items: MenuItem[];
  } | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function moveTo(projectId: string, status: string) {
    setItems((previous) =>
      previous.map((project) =>
        project.id === projectId ? { ...project, status } : project,
      ),
    );
    if (dbConnected) {
      startTransition(async () => {
        await updateProjectStatusQuickAction(projectId, status);
        router.refresh();
      });
    }
  }

  function handleDrop(status: string) {
    const projectId = dragId;
    setDragId(null);
    setOverColumn(null);
    const project = items.find((item) => item.id === projectId);
    if (!projectId || !project || project.status === status) return;
    moveTo(projectId, status);
  }

  function openMenu(event: React.MouseEvent, project: BoardProject) {
    event.preventDefault();
    setMenu({
      x: event.clientX,
      y: event.clientY,
      items: columns
        .filter((column) => column.status !== project.status)
        .map((column) => ({
          label: `${moveLabel} ${column.label}`,
          onClick: () => moveTo(project.id, column.status),
        })),
    });
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
      <div className="grid min-w-[1040px] grid-cols-4 divide-x divide-border">
        {columns.map((column) => {
          const columnProjects = items.filter(
            (project) => project.status === column.status,
          );
          const isOver = overColumn === column.status;

          return (
            <section
              key={column.status}
              className={cn(
                "min-h-[420px] bg-card transition-colors",
                isOver && "bg-primary/5",
              )}
              onDragOver={(event) => {
                event.preventDefault();
                setOverColumn(column.status);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                  setOverColumn(null);
                }
              }}
              onDrop={() => handleDrop(column.status)}
            >
              <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-border bg-secondary/90 px-3 backdrop-blur">
                <h2 className="text-sm font-semibold">{column.label}</h2>
                <Badge tone={column.tone}>{columnProjects.length}</Badge>
              </header>
              <div className="space-y-2.5 p-2.5">
                {columnProjects.map((project) => (
                  <article
                    key={project.id}
                    draggable
                    onDragStart={() => setDragId(project.id)}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverColumn(null);
                    }}
                    onContextMenu={(event) => openMenu(event, project)}
                    className={cn(
                      "cursor-grab rounded-md border border-border bg-card p-3 shadow-sm transition-colors hover:border-primary/40 active:cursor-grabbing",
                      dragId === project.id && "opacity-50",
                    )}
                  >
                    <Link
                      href={`/projects/${project.id}`}
                      className="block"
                      draggable={false}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="line-clamp-2 text-sm font-semibold leading-5">
                            {project.name}
                          </h3>
                          {project.nameSub ? (
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {project.nameSub}
                            </p>
                          ) : null}
                        </div>
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </div>

                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {project.region ? (
                          <Badge tone="neutral">{project.region}</Badge>
                        ) : null}
                        {project.type ? (
                          <Badge tone="info">{project.type}</Badge>
                        ) : null}
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{stageLabel}</span>
                        <span className="tnum font-medium">
                          {project.completedStageCount}/{project.totalStageCount}
                        </span>
                      </div>
                      <div
                        className="mt-1.5 grid h-1.5 gap-1"
                        style={{
                          gridTemplateColumns: `repeat(${Math.max(
                            1,
                            project.totalStageCount,
                          )}, minmax(0, 1fr))`,
                        }}
                      >
                        {Array.from({
                          length: Math.max(1, project.totalStageCount),
                        }).map((_, index) => (
                          <span
                            key={index}
                            className={cn(
                              "rounded-sm",
                              index < project.completedStageCount
                                ? "bg-emerald-500"
                                : "bg-secondary",
                            )}
                          />
                        ))}
                      </div>
                      <p className="mt-2 truncate text-xs text-muted-foreground">
                        {project.currentStageName
                          ? `当前：${project.currentStageName}`
                          : project.totalStageCount
                            ? "全部阶段已完成"
                            : "尚未生成阶段"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {taskCountLabel.replace(
                          "{n}",
                          String(project.taskCount),
                        )}
                      </p>
                    </Link>
                  </article>
                ))}
                {columnProjects.length === 0 ? (
                  <div className="border border-dashed border-border px-3 py-10 text-center text-xs text-muted-foreground">
                    {emptyLabel}
                  </div>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>

      {menu ? (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menu.items}
          onClose={() => setMenu(null)}
        />
      ) : null}
    </div>
  );
}
