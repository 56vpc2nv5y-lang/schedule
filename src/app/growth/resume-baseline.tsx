import { BarChart3, BriefcaseBusiness, GraduationCap, Users } from "lucide-react";

const baseline = [
  {
    icon: GraduationCap,
    label: "NTU · MSc Analytics",
    value: "GPA 4.63 / 5.00",
  },
  {
    icon: GraduationCap,
    label: "GDUFS · Economic Statistics",
    value: "GPA 3.90 / 4.00 · Top 4%",
  },
  {
    icon: BarChart3,
    label: "DataStory · Data Analyst",
    value: "10+ dashboards · 50k+ reviews",
  },
  {
    icon: Users,
    label: "Data Analysis Studio",
    value: "30+ projects · 90% on-time",
  },
];

export function ResumeBaseline() {
  return (
    <section className="mb-6 rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <BriefcaseBusiness className="h-4 w-4 text-primary" />
            现有简历基线
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            来源：AIPM.docx。新增经历沿用“动作、范围、结果”的表达密度。
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>数据分析</span>
          <span>项目运营</span>
          <span>国际协作</span>
          <span>技术沟通</span>
        </div>
      </div>
      <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
        {baseline.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex min-w-0 items-start gap-3">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <div className="text-sm font-medium">{item.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">{item.value}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
