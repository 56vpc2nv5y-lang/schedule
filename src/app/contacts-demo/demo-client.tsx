"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";

const contacts = [
  { id: "c1", name: "陈老师", org: "澳门工程学会", role: "客户决策", region: "澳门", project: "澳门理事长接待", next: "确认回访纪要", risk: "低" },
  { id: "c2", name: "Aziz", org: "乌兹住建监察局", role: "外方团组", region: "乌兹", project: "乌兹30人接待", next: "发送报备材料", risk: "中" },
  { id: "c3", name: "Nguyen", org: "越南合作方", role: "培训客户", region: "越南", project: "越南培训提案", next: "确认课程大纲", risk: "中" },
  { id: "c4", name: "王工", org: "供应商技术团队", role: "技术答复", region: "国内", project: "安全检测多技术合作", next: "追问问题清单", risk: "高" },
  { id: "c5", name: "Lina", org: "合作伙伴", role: "展会协同", region: "新加坡", project: "11月合作伙伴来访邀请函", next: "核对邀请名单", risk: "低" },
];

type Variant = "a" | "b" | "c";
const titles = { a: "联系人 Demo A · 商务 CRM", b: "联系人 Demo B · 机构关系", c: "联系人 Demo C · 行动驱动" };

export function ContactsDemo({ variant }: { variant: Variant }) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("全部");
  const [selectedId, setSelectedId] = useState(contacts[0].id);
  const regions = ["全部", ...Array.from(new Set(contacts.map((item) => item.region)))];
  const rows = useMemo(() => contacts.filter((item) => {
    const hit = (item.name + item.org + item.project + item.role).toLowerCase().includes(query.toLowerCase());
    return hit && (region === "全部" || item.region === region);
  }), [query, region]);
  const selected = contacts.find((item) => item.id === selectedId) ?? rows[0] ?? contacts[0];

  return (
    <AppShell>
      <div className="sunny-page">
        <header className="sunny-page-head flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div><div className="page-eyebrow">Contacts Demo</div><h1 className="page-title mt-2">{titles[variant]}</h1><p className="page-description mt-2 text-sm">这是试版页面，不覆盖正式联系人库。</p></div>
          <div className="s3-tabs"><Link className={"s3-tab " + (variant === "a" ? "is-active" : "")} href="/contacts-demo/a">A</Link><Link className={"s3-tab " + (variant === "b" ? "is-active" : "")} href="/contacts-demo/b">B</Link><Link className={"s3-tab " + (variant === "c" ? "is-active" : "")} href="/contacts-demo/c">C</Link></div>
        </header>
        <div className="s3-contact-layout">
          <aside className="s3-card"><div className="s3-card-body stack"><label className="s3-search"><Search className="h-4 w-4" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索联系人/项目/单位" /></label>{regions.map((item) => <button key={item} type="button" onClick={() => setRegion(item)} className={"s3-btn is-small " + (region === item ? "is-dark" : "")}>{item}</button>)}</div></aside>
          <section className="s3-contact-list">
            {rows.map((item) => <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={"s3-contact-item " + (selected.id === item.id ? "is-active" : "")}><span className="s3-avatar">{item.name.slice(0, 1)}</span><span className="min-w-0 text-left"><strong className="block">{item.name}</strong><small className="muted">{item.org}</small></span><span className="s3-pill status-idle">{item.region}</span></button>)}
          </section>
          <section className="s3-card"><div className="s3-card-head"><div><h2 className="s3-section-title">{selected.name}</h2><p className="s3-section-sub">{selected.org} · {selected.role}</p></div><span className={"s3-pill " + (selected.risk === "高" ? "status-danger" : selected.risk === "中" ? "status-waiting" : "status-done")}>{selected.risk}风险</span></div><div className="s3-card-body stack"><div className="s3-soft-panel"><div className="small muted">关联项目</div><div className="strong mt-1">{selected.project}</div></div><div className="s3-soft-panel"><div className="small muted">下一步行动</div><div className="strong mt-1">{selected.next}</div></div><div className="s3-soft-panel"><div className="small muted">视图重点</div><div className="strong mt-1">{variant === "a" ? "沟通记录、成交机会、风险等级" : variant === "b" ? "机构层级、地区关系、关键角色" : "下一步动作、等待对象、来源任务"}</div></div></div></section>
        </div>
      </div>
    </AppShell>
  );
}