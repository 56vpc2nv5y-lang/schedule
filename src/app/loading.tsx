// 页面切换时的即时反馈骨架：数据库在东京、跨境有延迟，
// 先给用户一个"在加载"的信号，避免以为卡死。
export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="lg:pl-60">
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-5">
            <div className="space-y-2">
              <div className="h-3 w-24 rounded bg-secondary" />
              <div className="h-7 w-64 rounded bg-secondary" />
              <div className="h-3 w-80 max-w-full rounded bg-secondary/70" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl border border-border bg-card" />
              ))}
            </div>
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="h-72 rounded-xl border border-border bg-card" />
              <div className="h-72 rounded-xl border border-border bg-card" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
