import Link from "next/link";
import { GanttChartSquare, LockKeyhole, Mail, UserRound } from "lucide-react";
import { registerAccountAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const messages: Record<string, string> = {
    "missing-fields": "请填写姓名、公司邮箱和密码。",
    "password-mismatch": "两次输入的密码不一致。",
    "weak-password": "密码至少需要 10 位，并同时包含字母和数字。",
    "account-exists": "这个邮箱已经注册，可以直接登录。",
    "database-required": "当前数据库不可用，暂时不能创建正式账号。",
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_500px_at_50%_-10%,oklch(0.9_0.06_245/0.55),transparent_60%)]" />
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <GanttChartSquare className="h-6 w-6" />
          </span>
          <h1 className="text-xl font-semibold">创建工作台账号</h1>
          <p className="mt-1 text-sm text-muted-foreground">每个账号拥有独立的项目、联系人和资料空间</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {error && messages[error] ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">{messages[error]}</div>
          ) : null}
          <form action={registerAccountAction} className="space-y-4">
            <label className="block">
              <span className="flabel">姓名</span>
              <div className="flex items-center gap-2 rounded-lg border border-input bg-card px-3 focus-within:ring-2 focus-within:ring-ring">
                <UserRound className="h-4 w-4 text-muted-foreground" />
                <input name="displayName" autoComplete="name" className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none" />
              </div>
            </label>
            <label className="block">
              <span className="flabel">公司邮箱</span>
              <div className="flex items-center gap-2 rounded-lg border border-input bg-card px-3 focus-within:ring-2 focus-within:ring-ring">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <input type="email" name="email" autoComplete="email" placeholder="name@company.com" className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none" />
              </div>
            </label>
            <label className="block">
              <span className="flabel">密码</span>
              <div className="flex items-center gap-2 rounded-lg border border-input bg-card px-3 focus-within:ring-2 focus-within:ring-ring">
                <LockKeyhole className="h-4 w-4 text-muted-foreground" />
                <input type="password" name="password" autoComplete="new-password" className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none" />
              </div>
            </label>
            <label className="block">
              <span className="flabel">确认密码</span>
              <input type="password" name="confirmPassword" autoComplete="new-password" className="field" />
            </label>
            <Button className="w-full" type="submit">创建账号并进入工作台</Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            已有账号？<Link href="/login" className="font-medium text-primary hover:underline">返回登录</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
