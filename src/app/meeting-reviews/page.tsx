import { CheckCircle2, Clock3, FilePlus2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getContact, getProject, meetingReviews } from "@/lib/default-data";

export default function MeetingReviewsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="会议纪要循环"
        title="多轮往返校对追踪"
        description="每一轮保存发送方、接收方、反馈和状态。定稿后提示是否写入项目文件库。"
        action={
          <Button>
            <FilePlus2 className="h-4 w-4" />
            新建纪要流程
          </Button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          {meetingReviews.map((review) => {
            const project = getProject(review.projectId);

            return (
              <Card key={review.id}>
                <CardHeader className="border-b border-border">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle>{review.title}</CardTitle>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {project?.nameZh}
                      </div>
                    </div>
                    <Badge tone="active">进行中</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    {review.rounds.map((round) => {
                      const sender = getContact(round.senderId);
                      const receiver = getContact(round.receiverId);

                      return (
                        <div
                          key={round.roundNo}
                          className="grid gap-3 rounded-md border border-border p-4 md:grid-cols-[72px_minmax(0,1fr)_140px]"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-sm font-semibold text-accent-foreground">
                            R{round.roundNo}
                          </div>
                          <div>
                            <div className="text-sm font-medium">
                              {sender?.name} → {receiver?.name}
                            </div>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                              {round.feedback}
                            </p>
                            <div className="mt-2 font-mono text-xs text-muted-foreground">
                              发送：{round.sentAt}
                            </div>
                          </div>
                          <div className="flex items-start justify-end">
                            <Badge tone={round.status === "SENT" ? "waiting" : "done"}>
                              {round.status === "SENT" ? "等待反馈" : "已反馈"}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>定稿入库提示</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-700" />
                <div>
                  <div className="text-sm font-medium text-emerald-900">
                    某轮标记定稿后
                  </div>
                  <p className="mt-1 text-xs leading-5 text-emerald-800">
                    显示确认弹窗，确认后生成 ProjectFile 记录并关联阶段。
                  </p>
                </div>
              </div>
              <div className="flex gap-3 rounded-md border border-border p-3">
                <Clock3 className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <div className="text-sm font-medium">时间线自动记录</div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    每次发送、反馈、定稿都会写入项目动态。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
