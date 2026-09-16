import Link from "next/link";
import { GanttChartSquare, LockKeyhole, Mail } from "lucide-react";
import { loginAction, loginDemoAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_500px_at_50%_-10%,oklch(0.9_0.06_245/0.55),transparent_60%)]" />
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md"><GanttChartSquare className="h-6 w-6" /></span>
          <h1 className="text-xl font-semibold">Sunny 工作系统</h1>
          <p className="mt-1 text-sm text-muted-foreground">登录你的国际业务工作台</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {error === "bad-credentials" ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">邮箱或密码不正确。</div> : null}
          {error === "demo-unavailable" ? <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">演示账号尚未配置。</div> : null}
          <form action={loginAction} className="space-y-4">
            <label className="block"><span className="flabel">公司邮箱</span><div className="flex items-center gap-2 rounded-lg border border-input bg-card px-3 focus-within:ring-2 focus-within:ring-ring"><Mail className="h-4 w-4 text-muted-foreground" /><input type="email" name="email" autoComplete="email" className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none" /></div></label>
            <label className="block"><span className="flabel">密码</span><div className="flex items-center gap-2 rounded-lg border border-input bg-card px-3 focus-within:ring-2 focus-within:ring-ring"><LockKeyhole className="h-4 w-4 text-muted-foreground" /><input type="password" name="password" autoComplete="current-password" className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none" /></div></label>
            <Button className="w-full" type="submit">登录工作台</Button>
          </form>
          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" /><span>比赛演示</span><span className="h-px flex-1 bg-border" /></div>
          <form action={loginDemoAction}>
            <Button className="w-full" type="submit" variant="outline">一键进入匿名 Demo</Button>
          </form>
          <p className="mt-2 text-center text-xs text-muted-foreground">使用编号模拟数据，不读取个人账号内容</p>
          <p className="mt-4 text-center text-sm text-muted-foreground">没有账号？<Link href="/register" className="font-medium text-primary hover:underline">创建账号</Link></p>
        </div>
      </div>
    </main>
  );
}
