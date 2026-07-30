import Link from "next/link";
import { AlertTriangle, Mail, MessageSquare, Plus, Trash2 } from "lucide-react";
import { createContactAction, deleteContactAction, updateContactAction } from "@/app/actions";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { CollapseCard } from "@/components/ui/collapse-card";
import { contactRoles, regions } from "@/lib/default-data";
import { getContactsForView, getProjectsForView, getTasksForView } from "@/lib/database-data";
import { normalizeTaskStatus } from "@/lib/workflow-meta";

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
  return name.toLowerCase().replace(/[\s·•()（）_-]/g, "");
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

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function qs(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && value !== "all") search.set(key, value);
  });
  const value = search.toString();
  return value ? "?" + value : "";
}

function roleLabel(contact: Contact) {
  return contact.roles[0] || "联系人";
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string; created?: string; error?: string; new?: string; selected?: string; q?: string; region?: string; role?: string }>;
}) {
  const [{ setup, created, error, new: openForm, selected = "", q = "", region = "all", role = "all" }, contacts, projects, tasks] = await Promise.all([
    searchParams,
    getContactsForView(),
    getProjectsForView(),
    getTasksForView(),
  ]);

  const hint = duplicateHint(contacts, projects);
  const allRoles = Array.from(new Set(contacts.flatMap((contact) => contact.roles as readonly string[]))).filter(Boolean);
  const allRegions = Array.from(new Set(contacts.map((contact) => contact.region).filter(Boolean)));

  const visibleContacts = contacts.filter((contact) => {
    const text = `${contact.name} ${contact.organization} ${contact.title} ${contact.email} ${contact.wechat} ${(contact.roles as readonly string[]).join(" ")}`.toLowerCase();
    if (q && !text.includes(q.toLowerCase())) return false;
    if (region !== "all" && contact.region !== region) return false;
    if (role !== "all" && !(contact.roles as readonly string[]).includes(role)) return false;
    return true;
  });
  const selectedContact = visibleContacts.find((contact) => contact.id === selected) ?? visibleContacts[0] ?? contacts[0];
  const selectedRelated = selectedContact ? relatedProjects(selectedContact, projects) : [];
  const waitingTasks = tasks.filter((task) => ["WAITING_EXTERNAL", "LEADER_REVIEW", "READY_TO_SEND"].includes(normalizeTaskStatus(task.status)));
  const contactTaskMap = new Map(contacts.map((contact) => [contact.id, waitingTasks.filter((task) => task.assigneeId === contact.id)]));
  const todayContacts = contacts
    .map((contact) => ({ contact, related: relatedProjects(contact, projects), waiting: contactTaskMap.get(contact.id) ?? [] }))
    .filter((item) => item.related.length || item.waiting.length)
    .slice(0, 3);
  const replyItems = waitingTasks.slice(0, 3);

  return (
    <AppShell>
      <div className="os-shell-page">
        <header className="os-page-head">
          <div>
            <div className="page-eyebrow">Contacts</div>
            <h1 className="page-title mt-2">联系人库</h1>
            <p className="os-page-sub">联系人、今日需要联系的人、待回复事项和项目关系放在同一屏，不再只是默认卡片列表。</p>
          </div>
          <Link href="/contacts?new=1#new" className="os-link-button primary"><Plus className="h-4 w-4" />新建联系人</Link>
        </header>

        {setup === "database-required" ? <Banner>还没连接数据库，当前是演示数据。</Banner> : null}
        {created === "contact" ? <Banner>联系人已保存。</Banner> : null}
        {error === "missing-required" ? <Banner tone="danger">姓名和机构不能为空。</Banner> : null}
        {error === "contact-in-use" ? <Banner tone="danger">该联系人已被项目或任务引用，不能直接删除。</Banner> : null}
        {hint ? (
          <div className="os-dupe mb-4">
            <AlertTriangle className="h-4 w-4" />
            <span><b>疑似重复联系人：</b>{hint.a.name} / {hint.b.name} 同属项目「{hint.project.nameZh}」。只提示，不自动合并。</span>
          </div>
        ) : null}

        <div className="os-action-ribbon">
          <section className="os-card">
            <div className="os-card-head">
              <div>
                <div className="os-card-title">今天需要联系</div>
                <div className="os-card-sub">保留行动提醒，但不取代完整通讯录</div>
              </div>
              <Link href={`/contacts${qs({ role, region, q })}`} className="os-link-button">全部</Link>
            </div>
            <div className="os-action-list">
              {todayContacts.map(({ contact, related, waiting }) => (
                <Link key={contact.id} href={`/contacts${qs({ selected: contact.id, role, region, q })}`} className="os-mini-follow text-inherit no-underline">
                  <div className="os-row">
                    <div className="os-avatar">{initials(contact.name)}</div>
                    <div className="min-w-0">
                      <div className="os-strong truncate">{contact.name}</div>
                      <div className="os-tiny os-muted truncate">{contact.organization}</div>
                    </div>
                  </div>
                  <div className="os-task-next">{waiting[0]?.title || related[0]?.nameZh || "确认近期是否需要跟进。"}</div>
                  <span className="os-attention">{waiting.length ? "待回复" : "项目联系人"}</span>
                </Link>
              ))}
              {todayContacts.length === 0 ? <div className="empty">暂无今日联系提醒。</div> : null}
            </div>
          </section>

          <aside className="os-card">
            <div className="os-card-head">
              <div>
                <div className="os-card-title">待回复</div>
                <div className="os-card-sub">按任务台账里的等待状态汇总</div>
              </div>
              <Link href="/tasks?filter=WAITING_EXTERNAL" className="os-link-button">全部</Link>
            </div>
            <div className="os-card-body os-stack">
              {replyItems.map((task) => {
                const assignee = task.assigneeId ? contacts.find((contact) => contact.id === task.assigneeId) : undefined;
                return (
                  <Link key={task.id} href="/tasks?filter=WAITING_EXTERNAL" className="os-row os-between text-inherit no-underline">
                    <span className="os-small os-muted">{task.dueDate || "待确认"}</span>
                    <span className="min-w-0 flex-1"><b className="block truncate text-sm">{task.title}</b><span className="os-tiny os-muted">{assignee?.name || "未指定联系人"}</span></span>
                    <span className="os-pill orange">等待</span>
                  </Link>
                );
              })}
              {replyItems.length === 0 ? <div className="empty">暂无等待回复事项。</div> : null}
            </div>
          </aside>
        </div>

        <div className="os-crm-layout">
          <aside className="os-filter-panel">
            <form action="/contacts" className="os-stack">
              <label className="os-search">⌕<input id="contactSearch" name="q" defaultValue={q} placeholder="搜索联系人" /></label>
              <input type="hidden" name="region" value={region} />
              <input type="hidden" name="role" value={role} />
              <Button type="submit" variant="outline" size="sm">搜索</Button>
            </form>
            <div className="os-filter-title">联系人类型</div>
            <Link href={`/contacts${qs({ q, region })}`} className={`os-filter-item ${role === "all" ? "active" : ""}`}><span>全部联系人</span><b>{contacts.length}</b></Link>
            {allRoles.slice(0, 7).map((item) => (
              <Link key={item} href={`/contacts${qs({ q, region, role: item })}`} className={`os-filter-item ${role === item ? "active" : ""}`}><span>{item}</span><b>{contacts.filter((contact) => (contact.roles as readonly string[]).includes(item)).length}</b></Link>
            ))}
            <div className="os-filter-title">国家与地区</div>
            <Link href={`/contacts${qs({ q, role })}`} className={`os-filter-item ${region === "all" ? "active" : ""}`}><span>全部地区</span><b>{contacts.length}</b></Link>
            {allRegions.slice(0, 8).map((item) => (
              <Link key={item} href={`/contacts${qs({ q, role, region: item })}`} className={`os-filter-item ${region === item ? "active" : ""}`}><span>{item}</span><b>{contacts.filter((contact) => contact.region === item).length}</b></Link>
            ))}
          </aside>

          <section className="os-contact-panel">
            <div className="os-card-head">
              <div>
                <div className="os-card-title">联系人</div>
                <div className="os-card-sub">当前筛选 {visibleContacts.length} 位</div>
              </div>
              <span className="os-pill gray">最近联系</span>
            </div>
            <div>
              {visibleContacts.map((contact) => {
                const related = relatedProjects(contact, projects);
                return (
                  <Link key={contact.id} href={`/contacts${qs({ selected: contact.id, q, region, role })}`} className={`os-contact-row ${selectedContact?.id === contact.id ? "active" : ""}`}>
                    <div className="os-avatar">{initials(contact.name)}</div>
                    <div className="min-w-0">
                      <div className="os-strong truncate">{contact.name}</div>
                      <div className="os-small os-muted truncate">{contact.organization}</div>
                    </div>
                    <div className="os-tiny os-muted text-right">{related.length ? `${related.length} 项目` : contact.region || "未标注"}</div>
                  </Link>
                );
              })}
              {visibleContacts.length === 0 ? <div className="empty">没有符合条件的联系人。</div> : null}
            </div>
          </section>

          <aside className="os-detail-panel">
            {selectedContact ? (
              <>
                <div className="os-profile">
                  <div className="os-avatar">{initials(selectedContact.name)}</div>
                  <h2 className="mt-3 text-xl font-semibold">{selectedContact.name}</h2>
                  <div className="os-muted">{selectedContact.organization}</div>
                  <div className="os-row mt-3 justify-center flex-wrap">
                    <span className="os-pill green">{roleLabel(selectedContact)}</span>
                    {selectedContact.region ? <span className="os-pill project">{selectedContact.region}</span> : null}
                  </div>
                </div>

                <div className="os-action-grid">
                  <a href={selectedContact.email ? `mailto:${selectedContact.email}` : "#"} className="os-link-button"><Mail className="h-4 w-4" />发邮件</a>
                  <a href="#" className="os-link-button"><MessageSquare className="h-4 w-4" />微信</a>
                  <Link href="/tasks?new=1" className="os-link-button">新建任务</Link>
                  <Link href="/meeting-reviews?new=1" className="os-link-button">记录问题</Link>
                </div>

                <div className="os-divider" />
                <div className="os-info-grid">
                  <div className="os-info-box"><div className="os-tiny os-muted">邮箱</div><div className="os-small os-strong truncate">{selectedContact.email || "未填写"}</div></div>
                  <div className="os-info-box"><div className="os-tiny os-muted">微信</div><div className="os-small os-strong truncate">{selectedContact.wechat || "未填写"}</div></div>
                  <div className="os-info-box"><div className="os-tiny os-muted">关联项目</div><div className="os-small os-strong">{selectedRelated.length} 项</div></div>
                  <div className="os-info-box"><div className="os-tiny os-muted">待办事项</div><div className="os-small os-strong">{contactTaskMap.get(selectedContact.id)?.length ?? 0} 项</div></div>
                </div>

                <div className="os-divider" />
                <div className="os-small os-strong">当前跟进</div>
                {selectedRelated.slice(0, 3).map((project) => (
                  <div key={project.id} className="type-card type-project mt-2 rounded-lg p-3">
                    <div className="os-small os-strong">{project.nameZh}</div>
                    <div className="os-tiny os-muted mt-1">当前阶段：{project.currentStageName || "未生成阶段"}</div>
                  </div>
                ))}
                {selectedRelated.length === 0 ? <div className="os-tiny os-muted mt-2">暂未关联项目。</div> : null}

                <div className="os-divider" />
                <details className="fold">
                  <summary><span className="os-small os-strong">编辑联系人</span></summary>
                  <div className="fold-body">
                    <form action={updateContactAction} className="grid gap-3 sm:grid-cols-2">
                      <input type="hidden" name="id" value={selectedContact.id} />
                      <label><span className="flabel">姓名</span><input name="name" defaultValue={selectedContact.name} className="field" /></label>
                      <label><span className="flabel">机构</span><input name="organization" defaultValue={selectedContact.organization} className="field" /></label>
                      <label><span className="flabel">职务</span><input name="title" defaultValue={selectedContact.title} className="field" /></label>
                      <label><span className="flabel">地区</span><select name="region" defaultValue={selectedContact.region} className="field">{regions.map((item) => <option key={item}>{item}</option>)}</select></label>
                      <label><span className="flabel">邮箱</span><input name="email" defaultValue={selectedContact.email} className="field" /></label>
                      <label><span className="flabel">微信</span><input name="wechat" defaultValue={selectedContact.wechat} className="field" /></label>
                      <div className="flex justify-end gap-2 sm:col-span-2">
                        <Button type="submit" size="sm">保存</Button>
                      </div>
                    </form>
                    <form action={deleteContactAction} className="mt-3">
                      <input type="hidden" name="id" value={selectedContact.id} />
                      <Button type="submit" variant="ghost" size="sm"><Trash2 className="h-3.5 w-3.5" />删除联系人</Button>
                    </form>
                  </div>
                </details>
              </>
            ) : <div className="empty">请选择联系人。</div>}
          </aside>
        </div>

        <CollapseCard className="mt-5" title="新建联系人" open={openForm === "1" || Boolean(error)}>
          <form action={createContactAction} className="grid gap-4 lg:grid-cols-6">
            <label><span className="flabel">姓名</span><input name="name" className="field" /></label>
            <label className="lg:col-span-2"><span className="flabel">机构</span><input name="organization" className="field" /></label>
            <label><span className="flabel">职务</span><input name="title" className="field" /></label>
            <label><span className="flabel">地区</span><select name="region" className="field">{regions.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span className="flabel">角色</span><select name="role" className="field">{contactRoles.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="lg:col-span-2"><span className="flabel">邮箱</span><input name="email" placeholder="email@example.com" className="field" /></label>
            <label className="lg:col-span-2"><span className="flabel">微信</span><input name="wechat" className="field" /></label>
            <div className="flex items-end lg:col-span-2"><Button className="w-full" type="submit"><Plus className="h-4 w-4" />保存联系人</Button></div>
          </form>
        </CollapseCard>
      </div>
    </AppShell>
  );
}

function Banner({ children, tone = "ok" }: { children: React.ReactNode; tone?: "ok" | "danger" }) {
  return <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${tone === "danger" ? "border-red-200 bg-red-50 text-red-900" : "border-border bg-card text-muted-foreground"}`}>{children}</div>;
}