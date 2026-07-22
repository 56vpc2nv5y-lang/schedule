import { Bookmark, Trash2 } from "lucide-react";
import {
  deleteResumePointAction,
  updateResumePointAction,
} from "@/app/actions";
import { InlineEdit } from "@/components/ui/inline-edit";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ResumePoint = {
  id: string;
  title: string;
  chinese: string;
  english: string;
  sourceNote: string;
  projectId: string;
  updatedAt: string;
};

type ProjectOption = {
  id: string;
  name: string;
};

export function ResumePointsLibrary({
  points,
  projects,
}: {
  points: ResumePoint[];
  projects: ProjectOption[];
}) {
  if (points.length === 0) return null;

  const projectName = new Map(projects.map((project) => [project.id, project.name]));

  return (
    <Card className="mb-5">
      <CardHeader className="flex-row items-center justify-between border-b border-border">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Bookmark className="h-4 w-4 text-primary" />
            简历要点库
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            已收藏 {points.length} 条
          </p>
        </div>
      </CardHeader>
      <CardContent className="divide-y divide-border p-0">
        {points.map((point) => (
          <article key={point.id} className="px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{point.title}</span>
                  {point.projectId ? (
                    <span className="text-xs text-muted-foreground">
                      {projectName.get(point.projectId) ?? "关联项目"}
                    </span>
                  ) : null}
                  <span className="tnum text-xs text-muted-foreground">
                    更新于 {point.updatedAt}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6">{point.chinese}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{point.english}</p>
                <div className="mt-3">
                  <InlineEdit label="编辑">
                    <form action={updateResumePointAction} className="grid gap-3">
                      <input type="hidden" name="id" value={point.id} />
                      <label>
                        <span className="flabel">要点标题</span>
                        <input name="title" defaultValue={point.title} className="field field-sm" required />
                      </label>
                      <label>
                        <span className="flabel">中文</span>
                        <textarea name="chinese" defaultValue={point.chinese} className="field min-h-20 resize-y" required />
                      </label>
                      <label>
                        <span className="flabel">English</span>
                        <textarea name="english" defaultValue={point.english} className="field min-h-20 resize-y" required />
                      </label>
                      <label>
                        <span className="flabel">关联项目</span>
                        <select name="projectId" defaultValue={point.projectId} className="field field-sm">
                          <option value="">不关联项目</option>
                          {projects.map((project) => (
                            <option key={project.id} value={project.id}>{project.name}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span className="flabel">来源备注</span>
                        <input name="sourceNote" defaultValue={point.sourceNote} className="field field-sm" />
                      </label>
                      <div className="flex justify-end">
                        <Button type="submit" size="sm">保存修改</Button>
                      </div>
                    </form>
                  </InlineEdit>
                </div>
              </div>
              <form action={deleteResumePointAction}>
                <input type="hidden" name="id" value={point.id} />
                <Button type="submit" size="icon" variant="ghost" title="删除收藏要点">
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </form>
            </div>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}