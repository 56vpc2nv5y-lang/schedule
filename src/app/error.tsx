"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

// 全局错误兜底：最常见的原因是 .env 里数据库连接串/密码不对。
// 给非技术用户一个能看懂、能自救的页面，而不是一屏红字。
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-base font-semibold">页面出错了</h1>
            <p className="text-xs text-muted-foreground">
              {error.digest ? `错误编号 ${error.digest}` : "运行时错误"}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3 text-sm leading-6">
          <p className="font-medium">最常见的原因是数据库没连上，按顺序检查：</p>
          <ol className="ml-4 list-decimal space-y-1.5 text-muted-foreground">
            <li>
              <span className="text-foreground">.env 里的数据库密码是否正确</span>
              ——Supabase 连接串里的 <code className="rounded bg-secondary px-1 text-xs">[YOUR-PASSWORD]</code>{" "}
              要整体替换成你的密码，<span className="font-medium text-foreground">方括号也要删掉</span>。
            </li>
            <li>
              忘记密码：Supabase 后台 → Settings → Database →{" "}
              <span className="text-foreground">Reset database password</span>{" "}
              重置一个新的，再填回 .env 的两处。
            </li>
            <li>改完 .env 后关掉黑窗口，重新双击 start.bat。</li>
            <li>第一次连库要先双击 db-init.bat 建表。</li>
          </ol>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={reset}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <RotateCcw className="h-4 w-4" />
            重试
          </button>
          <a
            href="/guide"
            className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm hover:bg-secondary"
          >
            打开操作指引
          </a>
        </div>
      </div>
    </main>
  );
}
