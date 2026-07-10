import Link from "next/link";
import { ContactRound, Plus } from "lucide-react";
import { createContactAction } from "@/app/actions";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CollapseCard } from "@/components/ui/collapse-card";
import { contactRoles, regions } from "@/lib/default-data";
import { getT } from "@/lib/locale";
import { getContactsForView, getProjectsForView } from "@/lib/database-data";

export const dynamic = "force-dynamic";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{
    setup?: string;
    created?: string;
    error?: string;
    new?: string;
  }>;
}) {
  const [{ setup, created, error, new: openForm }, { t }, contacts, projects] =
    await Promise.all([
      searchParams,
      getT(),
      getContactsForView(),
      getProjectsForView(),
    ]);

  return (
    <AppShell>
      <PageHeader
        eyebrow={t.contacts.eyebrow}
        title={t.contacts.title}
        description={t.contacts.desc}
        action={
          <Link href="/contacts?new=1#new">
            <Button>
              <Plus className="h-4 w-4" />
              {t.contacts.newContact}
            </Button>
          </Link>
        }
      />

      {setup === "database-required" ? (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          {t.common.demoMode}
        </div>
      ) : null}
      {created === "contact" ? (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          {t.contacts.savedMsg}
        </div>
      ) : null}
      {error === "missing-required" ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {t.common.required}
        </div>
      ) : null}

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2">
            <ContactRound className="h-4 w-4 text-primary" />
            {t.contacts.listTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-border bg-secondary/70 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">{t.contacts.colName}</th>
                  <th className="px-4 py-3 font-medium">{t.contacts.colOrg}</th>
                  <th className="px-4 py-3 font-medium">{t.contacts.colRegion}</th>
                  <th className="px-4 py-3 font-medium">{t.contacts.colContact}</th>
                  <th className="px-4 py-3 font-medium">{t.contacts.colRoles}</th>
                  <th className="px-4 py-3 font-medium">{t.contacts.colProjects}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {contacts.map((contact) => {
                  const relatedProjects = projects.filter(
                    (project) =>
                      project.ownerId === contact.id ||
                      (project.clientContactIds as readonly string[]).includes(
                        contact.id,
                      ) ||
                      (project.supplierContactIds as readonly string[]).includes(
                        contact.id,
                      ),
                  );

                  return (
                    <tr
                      key={contact.id}
                      className="transition-colors hover:bg-secondary/40"
                    >
                      <td className="px-4 py-3.5 font-medium">{contact.name}</td>
                      <td className="px-4 py-3.5">
                        <div>{contact.organization}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {contact.title}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {contact.region}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                        {contact.email || contact.wechat || "-"}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1.5">
                          {contact.roles.map((role) => (
                            <Badge key={role} tone="neutral">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="tnum px-4 py-3.5 text-muted-foreground">
                        {relatedProjects.length}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <CollapseCard
        className="mt-5"
        title={t.contacts.newContact}
        open={openForm === "1" || Boolean(error)}
      >
        <form action={createContactAction} className="grid gap-4 lg:grid-cols-6">
          <label>
            <span className="flabel">{t.contacts.fName}</span>
            <input name="name" className="field" />
          </label>
          <label className="lg:col-span-2">
            <span className="flabel">{t.contacts.fOrg}</span>
            <input name="organization" className="field" />
          </label>
          <label>
            <span className="flabel">{t.contacts.fTitle}</span>
            <input name="title" className="field" />
          </label>
          <label>
            <span className="flabel">{t.contacts.colRegion}</span>
            <select name="region" className="field">
              {regions.map((region) => (
                <option key={region}>{region}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="flabel">{t.contacts.fRole}</span>
            <select name="role" className="field">
              {contactRoles.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
          </label>
          <label className="lg:col-span-2">
            <span className="flabel">{t.contacts.fEmail}</span>
            <input name="email" placeholder="email@example.com" className="field" />
          </label>
          <label className="lg:col-span-2">
            <span className="flabel">{t.contacts.fWechat}</span>
            <input name="wechat" className="field" />
          </label>
          <div className="flex items-end lg:col-span-2">
            <Button className="w-full" type="submit">
              <Plus className="h-4 w-4" />
              {t.contacts.saveContact}
            </Button>
          </div>
        </form>
      </CollapseCard>
    </AppShell>
  );
}
