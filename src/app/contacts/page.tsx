import Link from "next/link";
import { AlertTriangle, ContactRound, Plus } from "lucide-react";
import {
  createContactAction,
  deleteContactAction,
  updateContactAction,
} from "@/app/actions";
import { InlineEdit } from "@/components/ui/inline-edit";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CollapseCard } from "@/components/ui/collapse-card";
import { contactRoles, regions } from "@/lib/default-data";
import { getT } from "@/lib/locale";
import { getContactsForView, getProjectsForView } from "@/lib/database-data";

export const dynamic = "force-dynamic";

type Contact = Awaited<ReturnType<typeof getContactsForView>>[number];
type Project = Awaited<ReturnType<typeof getProjectsForView>>[number];

function relatedProjects(contact: Contact, projects: readonly Project[]) {
  return projects.filter(
    (project) =>
      project.ownerId === contact.id ||
      (project.clientContactIds as readonly string[]).includes(contact.id) ||
      (project.supplierContactIds as readonly string[]).includes(contact.id),
  );
}

function normalizeName(name: string) {
  return name.toLowerCase().replace(/[\s·•.()（）_-]/g, "");
}

function similarName(a: string, b: string) {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na) || na.slice(0, 2) === nb.slice(0, 2);
}

function duplicateHint(contacts: readonly Contact[], projects: readonly Project[]) {
  for (let i = 0; i < contacts.length; i += 1) {
    for (let j = i + 1; j < contacts.length; j += 1) {
      const a = contacts[i];
      const b = contacts[j];
      if (!similarName(a.name, b.name)) continue;
      const aProjects = relatedProjects(a, projects);
      const bProjectIds = new Set(relatedProjects(b, projects).map((project) => project.id));
      const shared = aProjects.find((project) => bProjectIds.has(project.id));
      if (shared) return { a, b, project: shared };
    }
  }
  return null;
}

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
  const hint = duplicateHint(contacts, projects);

  return (
    <AppShell>
      <div className="sunny-page">
        <div className="sunny-page-head flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="page-eyebrow text-xs text-muted-foreground">Contacts</div>
            <h1 className="page-title mt-2">联系人库</h1>
            <p className="page-description mt-2 text-sm leading-6">{t.contacts.desc}</p>
          </div>
          <Link href="/contacts?new=1#new">
            <Button>
              <Plus className="h-4 w-4" />
              {t.contacts.newContact}
            </Button>
          </Link>
        </div>

        {setup === "database-required" ? <Banner tone="warn">{t.common.demoMode}</Banner> : null}
        {created === "contact" ? <Banner tone="ok">{t.contacts.savedMsg}</Banner> : null}
        {error === "missing-required" ? <Banner tone="err">{t.common.required}</Banner> : null}

        {hint ? (
          <div className="contact-dupe mb-5 flex flex-wrap items-center gap-3 rounded border border-border bg-secondary/60 p-4 text-sm">
            <AlertTriangle className="h-4 w-4 text-primary" />
            <span className="font-medium">疑似重复联系人</span>
            <span className="text-muted-foreground">
              {hint.a.name} / {hint.b.name} 同属项目「{hint.project.nameZh}」。只提示，不会自动合并。
            </span>
          </div>
        ) : null}

        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2">
              <ContactRound className="h-4 w-4 text-primary" />
              {t.contacts.listTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {contacts.map((contact) => {
                const related = relatedProjects(contact, projects);
                return (
                  <article key={contact.id} className="contact-card bg-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="sunny-title truncate text-lg">{contact.name}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{contact.organization}</p>
                        {contact.title ? <p className="text-xs text-muted-foreground">{contact.title}</p> : null}
                      </div>
                      <span className="chip">{contact.region || "未标注"}</span>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <Info label="邮箱/微信" value={contact.email || contact.wechat || "-"} mono />
                      <Info label="关联项目" value={`${related.length}`} mono />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {contact.roles.map((role) => <Badge key={role} tone="neutral">{role}</Badge>)}
                      {related.slice(0, 3).map((project) => <span key={project.id} className="chip">{project.nameZh}</span>)}
                    </div>

                    <div className="mt-4 flex items-center gap-3 border-t border-border pt-3">
                      <InlineEdit label={t.common.edit}>
                        <form action={updateContactAction} className="grid w-[420px] max-w-[70vw] gap-2 sm:grid-cols-2">
                          <input type="hidden" name="id" value={contact.id} />
                          <label>
                            <span className="flabel">{t.contacts.fName}</span>
                            <input name="name" defaultValue={contact.name} className="field field-sm" />
                          </label>
                          <label>
                            <span className="flabel">{t.contacts.fOrg}</span>
                            <input name="organization" defaultValue={contact.organization} className="field field-sm" />
                          </label>
                          <label>
                            <span className="flabel">{t.contacts.fTitle}</span>
                            <input name="title" defaultValue={contact.title} className="field field-sm" />
                          </label>
                          <label>
                            <span className="flabel">{t.contacts.colRegion}</span>
                            <select name="region" defaultValue={contact.region} className="field field-sm">
                              {regions.map((region) => <option key={region}>{region}</option>)}
                            </select>
                          </label>
                          <label>
                            <span className="flabel">{t.contacts.fEmail}</span>
                            <input name="email" defaultValue={contact.email} className="field field-sm" />
                          </label>
                          <label>
                            <span className="flabel">{t.contacts.fWechat}</span>
                            <input name="wechat" defaultValue={contact.wechat} className="field field-sm" />
                          </label>
                          <div className="flex items-end justify-end sm:col-span-2">
                            <Button type="submit" size="sm">{t.common.save}</Button>
                          </div>
                        </form>
                      </InlineEdit>
                      <form action={deleteContactAction}>
                        <input type="hidden" name="id" value={contact.id} />
                        <button type="submit" className="text-xs font-medium text-muted-foreground hover:text-red-600">
                          {t.common.delete}
                        </button>
                      </form>
                    </div>
                  </article>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <CollapseCard className="mt-5" title={t.contacts.newContact} open={openForm === "1" || Boolean(error)}>
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
                {regions.map((region) => <option key={region}>{region}</option>)}
              </select>
            </label>
            <label>
              <span className="flabel">{t.contacts.fRole}</span>
              <select name="role" className="field">
                {contactRoles.map((role) => <option key={role}>{role}</option>)}
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
      </div>
    </AppShell>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border pt-2 first:border-t-0 first:pt-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={mono ? "tnum font-mono text-xs" : "text-xs"}>{value}</span>
    </div>
  );
}

function Banner({ tone, children }: { tone: "ok" | "warn" | "err"; children: React.ReactNode }) {
  return (
    <div className={tone === "err" ? "mb-5 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-900" : "mb-5 rounded border border-border bg-secondary/50 p-4 text-sm"}>
      {children}
    </div>
  );
}
