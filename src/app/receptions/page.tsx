import { PlaneTakeoff, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getContactsForView,
  getProjectsForView,
  getReceptionsForView,
} from "@/lib/database-data";

export const dynamic = "force-dynamic";

export default async function ReceptionsPage() {
  const [receptions, projects, contacts] = await Promise.all([
    getReceptionsForView(),
    getProjectsForView(),
    getContactsForView(),
  ]);
  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const contactMap = new Map(contacts.map((contact) => [contact.id, contact]));

  return (
    <AppShell>
      <PageHeader
        eyebrow="接待安排"
        title="来访与展会邀请"
        description="来访人从联系人库选择，选中后自动带出单位、职位、地区，避免重复录入。"
        action={
          <Button>
            <Plus className="h-4 w-4" />
            新建接待
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {receptions.map((reception) => {
          const project = reception.projectId ? projectMap.get(reception.projectId) : undefined;

          return (
            <Card key={reception.id}>
              <CardHeader className="border-b border-border">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <PlaneTakeoff className="h-4 w-4 text-primary" />
                      {reception.title}
                    </CardTitle>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {project?.nameZh}
                    </div>
                  </div>
                  <Badge tone={reception.status === "CONFIRMED" ? "done" : "waiting"}>
                    {reception.status === "CONFIRMED" ? "已确认" : "计划中"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Info label="地点" value={reception.location} />
                  <Info label="类型" value={reception.type === "VISIT" ? "外方来访" : "展会邀请"} />
                  <Info label="开始" value={reception.startAt} />
                  <Info label="结束" value={reception.endAt} />
                </div>
                <div>
                  <div className="mb-2 text-xs font-medium text-muted-foreground">
                    来访人
                  </div>
                  <div className="space-y-2">
                    {reception.visitorIds.map((visitorId) => {
                      const visitor = contactMap.get(visitorId);
                      return visitor ? (
                        <div
                          key={visitor.id}
                          className="rounded-md border border-border p-3"
                        >
                          <div className="text-sm font-medium">{visitor.name}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {visitor.organization} · {visitor.title}
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
