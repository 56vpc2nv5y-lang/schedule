"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

// 全局错误兜底：区分数据库结构、连接和一般运行时错误，
// 给非技术用户可执行的恢复步骤。
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

  const message = error.message ?? "";
  const schemaOutOfSync =
    /P2021|does not exist|table .* missing|数据库结构/i.test(message);
  const connectionFailed =
    /P1000|P1001|authentication failed|can't reach database|database.*connect/i.test(
      message,
    );

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
          <p className="font-medium">
            {schemaOutOfSync
              ? "数据库已连接，但表结构没有同步完整："
              : connectionFailed
                ? "数据库连接失败，按顺序检查："
                : "页面运行时发生错误，可按下面步骤恢复："}
          </p>
          <ol className="ml-4 list-decimal space-y-1.5 text-muted-foreground">
            {schemaOutOfSync ? (
              <>
                <li>
                  关闭正在运行的看板窗口，双击{" "}
                  <code className="rounded bg-secondary px-1 text-xs">
                    db-init.bat
                  </code>{" "}
                  同步缺失的数据表。
                </li>
                <li>
                  同步完成后重新双击{" "}
                  <code className="rounded bg-secondary px-1 text-xs">
                    start.bat
                  </code>
                  ，再点击下方“重试”。
                </li>
              </>
            ) : connectionFailed ? (
              <>
                <li>
                  检查 <span className="text-foreground">.env 里的数据库密码</span>
                  ，连接串中的{" "}
                  <code className="rounded bg-secondary px-1 text-xs">
                    [YOUR-PASSWORD]
                  </code>{" "}
                  要连同方括号整体替换。
                </li>
                <li>
                  忘记密码时到 Supabase → Settings → Database →{" "}
                  <span className="text-foreground">Reset database password</span>
                  ，再更新 .env 的两处连接串。
                </li>
                <li>保存后关闭旧的启动窗口，重新双击 start.bat。</li>
              </>
            ) : (
              <>
                <li>先点击“重试”；若刚更新过代码，请重新启动看板。</li>
                <li>
                  如果所有数据页同时失败，运行{" "}
                  <code className="rounded bg-secondary px-1 text-xs">
                    db-init.bat
                  </code>{" "}
                  检查数据库结构。
                </li>
                <li>仍未恢复时，保留上方错误编号和启动窗口最后一段错误信息。</li>
              </>
            )}
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
