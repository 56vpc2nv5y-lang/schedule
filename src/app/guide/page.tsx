import Link from "next/link";
import {
  BookOpenText,
  CircleHelp,
  Compass,
  MonitorPlay,
  Rocket,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getT } from "@/lib/locale";

export const dynamic = "force-dynamic";

// 「什么需求放哪里」对照表：按真实工作场景组织
const scenarios: { need: string; where: string; href: string; how: string }[] = [
  {
    need: "接到一个新项目（如电动汽车预测性维保）",
    where: "项目看板",
    href: "/projects",
    how: "新建项目 → 自动生成全生命周期阶段 → 在项目详情里推进阶段、存文件",
  },
  {
    need: "收到甲方问题清单 / 供应商回复要判断清不清楚",
    where: "纪要与问题 · 问题反馈清单",
    href: "/meeting-reviews",
    how: "逐条录入问题 → 发供应商后改状态 → 回复不清楚就标「需追问」或「需开会」",
  },
  {
    need: "会议纪要多轮往返、定稿",
    where: "纪要与问题 · 纪要流程",
    href: "/meeting-reviews",
    how: "每轮记录发送/接收方，定稿时确认后自动存入项目文件库",
  },
  {
    need: "翻译供应商 PPT / 做口译交传准备",
    where: "任务列表 + AI 助手",
    href: "/assistant",
    how: "建任务（类型：文档翻译 / 口译交传）排期，AI 助手「中英互译」出初稿，术语查知识库",
  },
  {
    need: "搜集与会人员背景资料",
    where: "任务列表",
    href: "/tasks",
    how: "建任务（类型：背景资料搜集），成果链接登记到项目文件库或资料库",
  },
  {
    need: "接待外宾（接机、桌牌、酒店、伴手礼…）",
    where: "出差/接待",
    href: "/receptions",
    how: "新建接待并勾选「行前清单」，或在任务页用「接待全流程」模板一键生成",
  },
  {
    need: "报销 / 出差申请 / 用车申请 / OA 新增供应商",
    where: "任务列表 · 按流程生成",
    href: "/tasks",
    how: "选流程模板 + 开始日期 → 整组任务自动生成并排到日历",
  },
  {
    need: "战略协议 / 保密协议走法务审批",
    where: "任务列表",
    href: "/tasks",
    how: "建任务（类型：合同跟进）挂到项目，状态用「等待反馈」跟踪法务",
  },
  {
    need: "开会听到新领域知识（太赫兹、缪子、荧光检测…）",
    where: "知识库",
    href: "/knowledge",
    how: "散会就按主题记要点和中英术语，下次开会/翻译前翻一遍",
  },
  {
    need: "公司 PPT 模板、报销流程说明、讲解词",
    where: "资料库",
    href: "/resources",
    how: "登记分类 + 网盘链接，标 ⭐ 的常用资料排最前",
  },
  {
    need: "给各国客户批量发邀请函",
    where: "任务 + AI 助手",
    href: "/assistant",
    how: "「邀请函批量发放」流程模板生成任务，AI 助手「邀请函」模式出双语稿",
  },
  {
    need: "做完一件有难度的事（独立完成交传、定稿零返工…）",
    where: "成长档案",
    href: "/growth",
    how: "记一条成果，AI 润色成简历句，跳槽时直接用",
  },
  {
    need: "安排一天每个时段干什么（几点翻译、几点背稿）",
    where: "周计划",
    href: "/week",
    how: "小时网格里加时间块，拖动改时间/换天；起床通勤午休设成每天例行",
  },
  {
    need: "出差垫了钱 / 工资到账",
    where: "钱包",
    href: "/money",
    how: "垫付马上记一笔，报销到账点「已回款」；垫付未回一目了然",
  },
];

export default async function GuidePage() {
  const { t } = await getT();

  return (
    <AppShell>
      <PageHeader
        eyebrow={t.guidePage.eyebrow}
        title={t.guidePage.title}
        description={t.guidePage.desc}
      />

      <Card className="mb-5">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-primary" />
            我的需求放哪里
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border bg-secondary/70 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">我遇到的事</th>
                  <th className="px-4 py-3 font-medium">去哪里</th>
                  <th className="px-4 py-3 font-medium">怎么做</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {scenarios.map((row) => (
                  <tr key={row.need} className="hover:bg-secondary/40">
                    <td className="px-4 py-3 font-medium">{row.need}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={row.href}
                        className="whitespace-nowrap font-medium text-primary hover:underline"
                      >
                        {row.where}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.how}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2">
              <MonitorPlay className="h-4 w-4 text-primary" />
              本地怎么跑起来（不用会命令行）
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4 text-sm leading-7">
            <p>
              <span className="font-semibold">最简单：</span>双击项目文件夹里的{" "}
              <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">start.bat</code>
              ，它会自动安装依赖、启动服务并打开浏览器。第一次会慢（要下载依赖），之后几秒就好。
            </p>
            <div className="rounded-lg border border-border bg-secondary/30 p-3 text-xs leading-6">
              <div className="font-medium">手动方式（等价操作）：</div>
              <ol className="ml-4 list-decimal space-y-1 pt-1">
                <li>装好 Node.js（nodejs.org 下载，一路下一步）</li>
                <li>打开项目文件夹，在地址栏输入 <code>cmd</code> 回车（会在当前目录打开黑窗口）</li>
                <li>输入 <code>npm install</code> 回车（只需第一次）</li>
                <li>输入 <code>npm run dev</code> 回车，浏览器打开 localhost:3000</li>
              </ol>
              <p className="pt-1 text-muted-foreground">
                注：文档里写的 npm.cmd 和 npm 是同一个东西，Windows 里都能用。关掉黑窗口 = 停止服务。
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-4 w-4 text-primary" />
              部署上线（换设备也能用）
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4 text-sm leading-7">
            <ol className="ml-4 list-decimal space-y-1.5">
              <li>
                <span className="font-medium">Supabase</span>：注册 → 建免费项目 →
                复制两个连接串填进 .env → <span className="font-medium">双击项目文件夹里的</span>{" "}
                <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">db-init.bat</code>
                （它会替你执行 npx prisma db push，不用自己敲命令）
              </li>
              <li>
                <span className="font-medium">GitHub</span>：把代码推上去（详见 README）
              </li>
              <li>
                <span className="font-medium">Vercel</span>：用 GitHub 登录 → Import
                仓库 → 填环境变量 → Deploy
              </li>
            </ol>
            <p className="text-xs text-muted-foreground">
              连上数据库后，密码和 AI Key 都能直接在
              <Link href="/settings" className="text-primary hover:underline">
                「设置」
              </Link>
              页改，不用再碰 .env。记得定期在设置页「导出 JSON」备份。
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2">
            <BookOpenText className="h-4 w-4 text-primary" />
            各页面一句话职责
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 pt-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["工作台", "每天先看这页：项目到哪了、今天干嘛、什么逾期了"],
            ["项目看板", "项目分状态陈列，拖卡片改状态，点进去管细节"],
            ["任务列表", "所有要做的事，含个人杂事和流程模板生成"],
            ["日历", "按月看截止和行程，拖动改期，右键快捷操作"],
            ["周计划", "一周×小时的时间块，例行+当日安排，可拖动"],
            ["钱包", "工资、垫付、报销回款，垫付未回随时可见"],
            ["出差/接待", "行程本体：谁来、去哪、什么时候，附行前清单"],
            ["纪要与问题", "问题反馈循环 + 会议纪要多轮定稿"],
            ["联系人库", "人的唯一数据源，别处都引用这里"],
            ["资料库", "文件和模板的链接登记处"],
            ["知识库", "专业知识和术语，按主题积累"],
            ["成长档案", "简历素材仓库，AI 帮你润色"],
            ["AI 助手", "写邮件/翻译/汇报，先点场景模板再填空"],
            ["设置", "密码、AI Key、语言、阶段模板、备份"],
          ].map(([name, desc]) => (
            <div key={name} className="rounded-lg border border-border p-3">
              <div className="flex items-center gap-1.5 font-medium">
                <CircleHelp className="h-3.5 w-3.5 text-primary" />
                {name}
              </div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{desc}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
