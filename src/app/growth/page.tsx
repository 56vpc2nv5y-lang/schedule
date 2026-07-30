import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import {
  createGrowthLogAction,
  deleteGrowthLogAction,
  updateGrowthLogAction,
} from "@/app/actions";
import { InlineEdit } from "@/components/ui/inline-edit";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { CollapseCard } from "@/components/ui/collapse-card";
import { growthCategoryMeta, type GrowthCategory } from "@/lib/default-data";
import { isAiConfigured } from "@/lib/ai";
import { getT } from "@/lib/locale";
import { projectDisplayName } from "@/lib/i18n";
import { getGrowthLogsForView, getProjectsForView, getResumePointsForView } from "@/lib/database-data";
import { ResumeCoach } from "./resume-coach";
import { ResumeBaseline } from "./resume-baseline";
import { CopyButton } from "./copy-button";

export const dynamic = "force-dynamic";

type GrowthLog = Awaited<ReturnType<typeof getGrowthLogsForView>>[number];
type Project = Awaited<ReturnType<typeof getProjectsForView>>[number];
type GrowthTab = "current" | "target" | "matrix" | "bullets";

const categoryOrder: GrowthCategory[] = ["ACHIEVEMENT", "SKILL", "LESSON", "CERTIFICATE", "NETWORK"];
const tabs: { key: GrowthTab; label: string }[] = [
  { key: "current", label: "现有赛道成果" },
  { key: "target", label: "数据分析赛道储备" },
  { key: "matrix", label: "技能矩阵" },
  { key: "bullets", label: "简历弹药库" },
];
const weekHours = [6, 8, 10, 9, 12, 7, 11, 10];
const targetKeywords = /uplift|vela|诗签|成长追踪|数据分析|sql|建模|可视化|agentic|firebase|mediapipe/i;
const sideProjects = [
  {
    title: "Uplift modeling 毕业论文",
    detail: "以因果增益、分层评估和业务实验解释作为数据分析赛道核心样本。",
    date: "NTU",
    chip: "DATA SCIENCE",
  },
  {
    title: "个人成长追踪应用",
    detail: "把行为记录、目标拆解和复盘沉淀成可持续迭代的数据产品练习。",
    date: "SIDE PROJECT",
    chip: "PRODUCT ANALYTICS",
  },
  {
    title: "VELA 项目",
    detail: "聚焦交互原型、视觉系统和用户路径验证，作为产品设计方向储备。",
    date: "PORTFOLIO",
    chip: "PRODUCT DESIGN",
  },
  {
    title: "诗签 / Agentic AI 实验",
    detail: "用 AI 工作流、生成式界面和内容结构化练习沉淀个人作品集。",
    date: "AI LAB",
    chip: "AGENTIC AI",
  },
];
const skills = [
  { name: "SQL", level: 3, note: "能完成查询、清洗、分组统计，继续补窗口函数和性能分析。" },
  { name: "建模", level: 3, note: "Uplift modeling / 业务预测方向已有方法论样本。" },
  { name: "数据可视化", level: 4, note: "能把复杂项目数据整理成管理层可读的看板和时间线。" },
  { name: "Agentic AI", level: 3, note: "具备工具型 AI 工作流和上下文组织经验。" },
  { name: "产品设计", level: 4, note: "能从真实流程抽象信息架构、组件系统和交互验收点。" },
];

function isTargetLog(log: GrowthLog) {
  return targetKeywords.test(`${log.title} ${log.detail}`);
}

function categoryTone(category: string) {
  if (category === "ACHIEVEMENT") return "done";
  if (category === "SKILL") return "active";
  if (category === "LESSON") return "wait";
  if (category === "CERTIFICATE") return "neutral";
  if (category === "NETWORK") return "pause";
  return "neutral";
}

function categoryLabel(category: string) {
  return growthCategoryMeta[category as GrowthCategory]?.label ?? category;
}

export default async function GrowthPage({
  searchParams,
}: {
  searchParams: Promise<{
    setup?: string;
    created?: string;
    error?: string;
    new?: string;
    resumePoint?: string;
    tab?: string;
  }>;
}) {
  const [{ setup, created, error, new: openForm, resumePoint, tab }, { locale, t }, logs, projects, resumePoints, aiReady] =
    await Promise.all([
      searchParams,
      getT(),
      getGrowthLogsForView(),
      getProjectsForView(),
      getResumePointsForView(),
      isAiConfigured(),
    ]);
  const activeTab = tabs.some((item) => item.key === tab) ? (tab as GrowthTab) : "current";
  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const pname = (p: { nameZh: string; nameEn?: string }) => projectDisplayName(locale, p);
  const projectOptions = projects.map((project) => ({ id: project.id, name: pname(project) }));
  const currentLogs = logs.filter((log) => !isTargetLog(log));
  const targetLogs = logs.filter(isTargetLog);
  const achievementCount = logs.filter((log) => log.category === "ACHIEVEMENT").length;
  const skillCount = logs.filter((log) => log.category === "SKILL").length;
  const weeklyTotal = weekHours[weekHours.length - 1];
  const bulletTexts = [
    ...resumePoints.map((point) => ({
      title: point.title,
      text: point.chinese,
      meta: point.sourceNote || point.updatedAt,
    })),
    ...logs
      .filter((log) => log.category === "ACHIEVEMENT")
      .slice(0, 4)
      .map((log) => {
        const project = log.projectId ? projectMap.get(log.projectId) : undefined;
        const projectName = project ? pname(project) : "跨部门项目";
        return {
          title: log.title,
          text: `围绕${projectName}推进${log.title}，负责需求梳理、跨方协调和进度闭环，并沉淀可复用的项目管理素材。`,
          meta: log.happenedAt,
        };
      }),
  ];

  return (
    <AppShell>
      <div className="sunny-page growth-archive">
        <div className="sunny-page-head flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="page-eyebrow text-xs text-muted-foreground">Growth Archive</div>
            <h1 className="page-title mt-2">成长档案</h1>
            <p className="page-description mt-2 max-w-2xl text-sm leading-6">{t.growth.desc}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ResumeCoach configured={aiReady} projects={projectOptions} />
            <Link href="/growth?new=1#new">
              <Button>
                <Plus className="h-4 w-4" />
                {t.growth.addOne}
              </Button>
            </Link>
          </div>
        </div>

        {setup === "database-required" ? <Banner>{t.common.demoMode}</Banner> : null}
        {created === "log" ? <Banner>{t.growth.savedMsg}</Banner> : null}
        {resumePoint === "saved" ? <Banner>简历要点已收藏，可在弹药库继续整理。</Banner> : null}
        {error === "missing-required" || error === "missing-resume-point" ? <Banner>{t.common.required}</Banner> : null}

        <section className="plan-card mb-5">
          <div className="plan-head">
            <div>
              <div className="section-label">六个月双轨计划</div>
              <h2 className="sunny-title text-xl">现有岗位深耕 + 数据分析方向技能储备</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">每周目标 10 小时：一半沉淀当前岗位实证材料，一半推进数据分析/AI/产品作品集。</p>
            </div>
            <span className="stamp active">10H / WEEK</span>
          </div>
          <div className="plan-progress" style={{ "--progress": "38%" } as CSSProperties}><i /></div>
          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="card">
                <div className="section-label">现有岗位深耕</div>
                <p className="text-sm leading-6 text-muted-foreground">安全检测、电动车、乌兹培训、澳门接待等真实协同项目，转化为可验证成果。</p>
              </div>
              <div className="card">
                <div className="section-label">数据分析方向储备</div>
                <p className="text-sm leading-6 text-muted-foreground">Uplift modeling、SQL、可视化、Agentic AI 和产品作品集并行推进。</p>
              </div>
            </div>
            <div className="card">
              <div className="section-label">每周投入</div>
              <div className="week-bars" aria-label="每周投入时长">
                {weekHours.map((hours, index) => (
                  <i key={index} title={`${hours} 小时`} style={{ height: `${Math.max(10, hours * 5)}px` }} />
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">本周 {weeklyTotal} 小时</p>
            </div>
          </div>
        </section>

        <div className="mb-5 kpi-bar" data-cols="5">
          <Mini label="成长记录" value={logs.length} />
          <Mini label="成果亮点" value={achievementCount} tone="done" />
          <Mini label="技能积累" value={skillCount} />
          <Mini label="简历要点" value={resumePoints.length} tone="wait" />
          <Mini label="每周目标" value="10H" />
        </div>

        <div className="mb-5 resume-base">
          <ResumeBaseline />
        </div>

        <nav className="tabs" aria-label="成长档案分类">
          {tabs.map((item) => (
            <Link key={item.key} className={`tab ${activeTab === item.key ? "on" : ""}`} href={`/growth?tab=${item.key}`}>
              {item.label}
            </Link>
          ))}
        </nav>

        {activeTab === "current" ? (
          <LogList
            logs={currentLogs}
            projects={projects}
            projectMap={projectMap}
            pname={pname}
            aiReady={aiReady}
            projectOptions={projectOptions}
            empty="暂无现有赛道记录"
          />
        ) : null}

        {activeTab === "target" ? (
          <section className="space-y-3">
            <LogList
              logs={targetLogs}
              projects={projects}
              projectMap={projectMap}
              pname={pname}
              aiReady={aiReady}
              projectOptions={projectOptions}
              empty="暂无已入库的数据分析赛道记录，先展示规划中的储备项目。"
            />
            <div className="grid gap-3 md:grid-cols-2">
              {sideProjects.map((item) => (
                <div key={item.title} className="card">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="stamp active">技能积累</span>
                    <span className="chip">{item.chip}</span>
                    <span className="chip">{item.date}</span>
                  </div>
                  <h3 className="mt-3 text-base font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === "matrix" ? (
          <section className="panel">
            {skills.map((skill) => (
              <div key={skill.name} className="skill-row">
                <strong>{skill.name}</strong>
                <SkillDots value={skill.level} />
                <span className="text-sm text-muted-foreground">{skill.note}</span>
              </div>
            ))}
          </section>
        ) : null}

        {activeTab === "bullets" ? (
          <section className="space-y-4">
            <div className="panel flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="section-label">简历对话</div>
                <p className="text-sm text-muted-foreground">把当前记录继续润色成中文/英文简历句、面试故事或项目复盘。</p>
              </div>
              <ResumeCoach configured={aiReady} projects={projectOptions} />
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {bulletTexts.length === 0 ? (
                <div className="panel text-sm text-muted-foreground">暂无可复制的简历句子。</div>
              ) : (
                bulletTexts.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="bullet">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="chip">{item.meta}</span>
                      <CopyButton text={item.text} />
                    </div>
                    <h3 className="text-sm font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        ) : null}

        <CollapseCard className="mt-5" title={t.growth.formTitle} hint={t.growth.formHint} open={openForm === "1" || Boolean(created) || Boolean(error)}>
          <form action={createGrowthLogAction} className="grid gap-4 lg:grid-cols-6">
            <label className="lg:col-span-3">
              <span className="flabel">{t.growth.fTitle}</span>
              <input name="title" placeholder={t.growth.fTitlePh} className="field" />
            </label>
            <label>
              <span className="flabel">{t.growth.fCategory}</span>
              <select name="category" className="field">
                {categoryOrder.map((category) => <option key={category} value={category}>{categoryLabel(category)}</option>)}
              </select>
            </label>
            <label>
              <span className="flabel">{t.growth.fProject}</span>
              <select name="projectId" className="field">
                <option value="">{t.growth.fNoProject}</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{pname(project)}</option>)}
              </select>
            </label>
            <label>
              <span className="flabel">{t.growth.fDate}</span>
              <input type="date" name="happenedAt" className="field" />
            </label>
            <label className="lg:col-span-5">
              <span className="flabel">{t.growth.fDetail}</span>
              <input name="detail" placeholder={t.growth.fDetailPh} className="field" />
            </label>
            <div className="flex items-end">
              <Button className="w-full" type="submit">
                <Plus className="h-4 w-4" />
                {t.common.save}
              </Button>
            </div>
          </form>
        </CollapseCard>
      </div>
    </AppShell>
  );
}

function LogList({
  logs,
  projects,
  projectMap,
  pname,
  aiReady,
  projectOptions,
  empty,
}: {
  logs: GrowthLog[];
  projects: Project[];
  projectMap: Map<string, Project>;
  pname: (project: { nameZh: string; nameEn?: string }) => string;
  aiReady: boolean;
  projectOptions: { id: string; name: string }[];
  empty: string;
}) {
  if (logs.length === 0) return <div className="panel text-sm text-muted-foreground">{empty}</div>;

  return (
    <section className="space-y-3">
      {logs.map((log) => {
        const project = log.projectId ? projectMap.get(log.projectId) : undefined;
        return (
          <details key={log.id} className="fold g-entry">
            <summary>
              <span className={`stamp ${categoryTone(log.category)}`}>{categoryLabel(log.category)}</span>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold">{log.title}</h3>
                {log.detail ? <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{log.detail}</p> : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  {project ? <span className="chip">{pname(project)}</span> : <span className="chip">未关联项目</span>}
                  <span className="chip">{log.happenedAt}</span>
                </div>
              </div>
              <form action={deleteGrowthLogAction}>
                <input type="hidden" name="id" value={log.id} />
                <Button variant="ghost" size="icon" type="submit" title="删除记录">
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </form>
            </summary>
            <div className="fold-body">
              <div className="flex flex-wrap items-center gap-4">
                <ResumeCoach
                  configured={aiReady}
                  projects={projectOptions}
                  source={{
                    title: log.title,
                    detail: log.detail,
                    projectId: log.projectId,
                    projectName: project ? pname(project) : "",
                    happenedAt: log.happenedAt,
                  }}
                />
                <InlineEdit label="编辑">
                  <form action={updateGrowthLogAction} className="grid gap-2 sm:grid-cols-2">
                    <input type="hidden" name="id" value={log.id} />
                    <label className="sm:col-span-2">
                      <span className="flabel">标题</span>
                      <input name="title" defaultValue={log.title} className="field field-sm" />
                    </label>
                    <label>
                      <span className="flabel">分类</span>
                      <select name="category" defaultValue={log.category} className="field field-sm">
                        {categoryOrder.map((category) => <option key={category} value={category}>{categoryLabel(category)}</option>)}
                      </select>
                    </label>
                    <label>
                      <span className="flabel">关联项目</span>
                      <select name="projectId" defaultValue={log.projectId} className="field field-sm">
                        <option value="">不关联项目</option>
                        {projects.map((project) => <option key={project.id} value={project.id}>{pname(project)}</option>)}
                      </select>
                    </label>
                    <label>
                      <span className="flabel">日期</span>
                      <input type="date" name="happenedAt" defaultValue={log.happenedAt} className="field field-sm" />
                    </label>
                    <label className="sm:col-span-2">
                      <span className="flabel">详情</span>
                      <input name="detail" defaultValue={log.detail} className="field field-sm" />
                    </label>
                    <div className="flex items-end justify-end sm:col-span-2">
                      <Button type="submit" size="sm">保存</Button>
                    </div>
                  </form>
                </InlineEdit>
              </div>
            </div>
          </details>
        );
      })}
    </section>
  );
}

function Mini({ label, value, tone }: { label: string; value: number | string; tone?: string }) {
  return (
    <div className="kpi-cell" data-tone={tone}>
      <strong className="tnum">{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function SkillDots({ value }: { value: number }) {
  return (
    <span className="skill-dots" aria-label={`${value}/5`}>
      {Array.from({ length: 5 }, (_, index) => <i key={index} className={index < value ? "on" : ""} />)}
    </span>
  );
}

function Banner({ children }: { children: ReactNode }) {
  return <div className="mb-5 panel text-sm text-muted-foreground">{children}</div>;
}
