import { LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <CardTitle className="text-xl">项目跟踪看板</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            单人使用的密码保护入口。部署到 Vercel 后可通过 APP_PASSWORD 控制访问。
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <label className="space-y-2 text-sm">
              <span className="text-xs font-medium text-muted-foreground">
                访问密码
              </span>
              <div className="flex items-center gap-2 rounded-md border border-input bg-white px-3">
                <LockKeyhole className="h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="输入密码"
                  className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
              </div>
            </label>
            <Button className="w-full" type="button">
              进入控制台
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
