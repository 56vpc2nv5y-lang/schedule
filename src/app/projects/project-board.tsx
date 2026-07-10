"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { updateProjectStatusQuickAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContextMenu, type MenuItem } from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";

export type BoardProject = {
  id: string;
  name: string;
  nameSub: string;
  region: string;
  type: string;
  status: string;
  progress: number;
  taskCount: number;
};

export function ProjectBoard({
  projects,
  columns,
  progressLabel,
  taskCountLabel,
  emptyLabel,
  moveLabel,
  dbConnected,
}: {
  projects: BoardProject[];
  columns: { label: string; status: string; tone: "active" | "waiting" | "done" | "neutral" }[];
  progressLabel: string;
  taskCountLabel: string; // 包含 {n} 占位
  emptyLabel: string;
  moveLabel: string; // "移动到" / "Move to"
  dbConnected: boolean;
}) {
  const [items, setItems] = useState(projects);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function moveTo(projectId: string, status: string) {
    setItems((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status } : p)),
    );
    if (dbConnected) {
      startTransition(async () => {
        await updateProjectStatusQuickAction(projectId, status);
        router.refresh();
      });
    }
  }

  function handleDrop(status: string) {
    const id = dragId;
    setDragId(null);
    setOverCol(null);
    if (!id) return;
    const project = items.find((p) => p.id === id);
    if (!project || project.status === status) return;
    moveTo(id, status);
  }

  function openMenu(e: React.MouseEvent, project: BoardProject) {
    e.preventDefault();
    setMenu({
      x: e.clientX,
      y: e.clientY,
      items: columns
        .filter((col) => col.status !== project.status)
        .map((col) => ({
          label: `${moveLabel} ${col.label}`,
          onClick: () => moveTo(project.id, col.status),
        })),
    });
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {columns.map((column) => {
        const columnProjects = items.filter(
          (project) => project.status === column.status,
        );
        const isOver = overCol === column.status;

        return (
          <Card
            key={column.status}
            className={cn(
              "min-h-[320px] transition-shadow",
              isOver && "ring-2 ring-primary/50",
            )}
            onDragOver={(e) => {
              e.preventDefault();
              if (overCol !== column.status) setOverCol(column.status);
            }}
            onDrop={() => handleDrop(column.status)}
          >
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{column.label}</CardTitle>
                <Badge tone={column.tone}>{columnProjects.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {columnProjects.map((project) => (
                <div
                  key={project.id}
                  draggable
                  onDragStart={() => setDragId(project.id)}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverCol(null);
                  }}
                  onContextMenu={(e) => openMenu(e, project)}
                  className={cn(
                    "cursor-grab active:cursor-grabbing",
                    dragId === project.id && "opacity-50",
                  )}
                >
                  <Link
                    href={`/projects/${project.id}`}
                    className="block rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
                    draggable={false}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="line-clamp-2 text-sm font-semibold">
                          {project.name}
                        </div>
                        {project.nameSub ? (
                          <div className="mt-1 truncate text-xs text-muted-foreground">
                            {project.nameSub}
                          </div>
                        ) : null}
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {project.region ? (
                        <Badge tone="neutral">{project.region}</Badge>
                      ) : null}
                      {project.type ? (
                        <Badge tone="info">{project.type}</Badge>
                      ) : null}
                    </div>
                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{progressLabel}</span>
                        <span className="tnum">{project.progress}%</span>
                      </div>
                      <div className="h-2 rounded-md bg-secondary">
                        <div
                          className="h-2 rounded-md bg-primary"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">
                      {taskCountLabel.replace("{n}", String(project.taskCount))}
                    </div>
                  </Link>
                </div>
              ))}
              {columnProjects.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  {emptyLabel}
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      })}

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
