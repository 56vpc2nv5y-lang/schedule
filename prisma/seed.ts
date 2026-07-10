/**
 * 把 src/lib/default-data.ts 里的真实数据一次性写入数据库。
 * 幂等保护：若已存在项目数据则跳过，避免覆盖你后来录入的内容。
 * 运行：双击 db-seed.bat（内部执行 npx tsx prisma/seed.ts）。
 */
import { PrismaClient } from "@prisma/client";
import {
  contacts,
  projects,
  stages,
  tasks,
  files,
  meetingReviews,
  receptions,
  timelineEvents,
  feedbackQuestions,
  knowledgeNotes,
  growthLogs,
  resources,
  scheduleBlocks,
  moneyRecords,
  regions,
  taskTypes,
  contactRoles,
  fileTypes,
  defaultStageTemplate,
} from "../src/lib/default-data";

const prisma = new PrismaClient();

function toDate(s: string | undefined | null): Date | null {
  if (!s) return null;
  // 支持 "2026-06-04" 与 "2026-07-12 14:00"
  const iso = s.includes(" ") ? s.replace(" ", "T") : `${s}T00:00:00`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

async function main() {
  const existing = await prisma.project.count();
  if (existing > 0) {
    console.log(
      `⏭  数据库已有 ${existing} 个项目，跳过初始化以免覆盖你录入的数据。`,
    );
    return;
  }

  console.log("① 写入标签 / 角色 / 文件类型 …");
  const regionMap = new Map<string, string>();
  for (const name of regions) {
    const tag = await prisma.tag.upsert({
      where: { type_name: { type: "REGION", name } },
      create: { type: "REGION", name },
      update: {},
    });
    regionMap.set(name, tag.id);
  }
  const taskTypeMap = new Map<string, string>();
  for (const name of taskTypes) {
    const tag = await prisma.tag.upsert({
      where: { type_name: { type: "TASK_TYPE", name } },
      create: { type: "TASK_TYPE", name },
      update: {},
    });
    taskTypeMap.set(name, tag.id);
  }
  const projectTypeMap = new Map<string, string>();
  for (const name of ["标准项目", "接待/展会专项"]) {
    const tag = await prisma.tag.upsert({
      where: { type_name: { type: "PROJECT_TYPE", name } },
      create: { type: "PROJECT_TYPE", name },
      update: {},
    });
    projectTypeMap.set(name, tag.id);
  }
  const roleMap = new Map<string, string>();
  for (const name of contactRoles) {
    const r = await prisma.contactRole.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    roleMap.set(name, r.id);
  }
  const fileTypeMap = new Map<string, string>();
  for (const name of fileTypes) {
    const ft = await prisma.fileType.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    fileTypeMap.set(name, ft.id);
  }

  console.log("② 写入阶段模板 …");
  const template = await prisma.stageTemplate.create({
    data: {
      name: defaultStageTemplate.name,
      isDefault: true,
      items: {
        create: defaultStageTemplate.items.map((it) => ({
          name: it.name,
          sortOrder: it.sortOrder,
          description: it.description ?? null,
        })),
      },
    },
  });

  console.log("③ 写入联系人 …");
  for (const c of contacts) {
    await prisma.contact.create({
      data: {
        id: c.id,
        name: c.name,
        organization: c.organization,
        title: c.title || null,
        email: c.email || null,
        wechat: c.wechat || null,
        regionTagId: regionMap.get(c.region) ?? null,
        roles: {
          create: c.roles
            .map((rn) => roleMap.get(rn))
            .filter((id): id is string => Boolean(id))
            .map((roleId) => ({ roleId })),
        },
      },
    });
  }

  console.log("④ 写入项目 + 阶段 + 团队 …");
  for (const p of projects) {
    const links: {
      contactId: string;
      side: "OUR_TEAM" | "CLIENT" | "SUPPLIER";
      isPrimary: boolean;
    }[] = [];
    if (p.ownerId)
      links.push({ contactId: p.ownerId, side: "OUR_TEAM", isPrimary: true });
    p.clientContactIds.forEach((id, i) =>
      links.push({ contactId: id, side: "CLIENT", isPrimary: i === 0 }),
    );
    p.supplierContactIds.forEach((id, i) =>
      links.push({ contactId: id, side: "SUPPLIER", isPrimary: i === 0 }),
    );

    await prisma.project.create({
      data: {
        id: p.id,
        nameZh: p.nameZh,
        nameEn: p.nameEn || null,
        clientName: p.clientName,
        status: p.status,
        plannedStart: toDate(p.plannedStart),
        plannedEnd: toDate(p.plannedEnd),
        regionTagId: regionMap.get(p.region) ?? null,
        projectTypeTagId: projectTypeMap.get(p.type) ?? null,
        stageTemplateId: template.id,
        contacts: { create: links },
      },
    });
  }

  // 阶段（含阶段联系人）
  for (const s of stages) {
    await prisma.projectStage.create({
      data: {
        id: s.id,
        projectId: s.projectId,
        name: s.name,
        sortOrder: s.sortOrder,
        plannedStart: toDate(s.plannedStart),
        plannedEnd: toDate(s.plannedEnd),
        status: s.status,
        actualCompleted: s.status === "COMPLETED" ? toDate(s.plannedEnd) : null,
        contacts: {
          create: s.contactIds.map((contactId) => ({ contactId })),
        },
      },
    });
  }

  console.log("⑤ 写入任务 …");
  for (const t of tasks) {
    await prisma.task.create({
      data: {
        id: t.id,
        projectId: t.projectId || null,
        stageId: t.stageId || null,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: toDate(t.dueDate),
        typeTagId: taskTypeMap.get(t.type) ?? null,
        assigneeId: t.assigneeId || null,
        contacts: {
          create: t.contactIds.map((contactId) => ({
            contactId,
            purpose: "INFORMED" as const,
          })),
        },
      },
    });
  }

  console.log("⑥ 写入文件库 …");
  for (const f of files) {
    await prisma.projectFile.create({
      data: {
        id: f.id,
        projectId: f.projectId,
        stageId: f.stageId || null,
        name: f.name,
        version: f.version || null,
        status: f.status as "DRAFT" | "IN_REVIEW" | "APPROVED" | "ARCHIVED",
        url: f.url || null,
        fileTypeId: fileTypeMap.get(f.type) ?? null,
      },
    });
  }

  console.log("⑦ 写入会议纪要循环 …");
  for (const mr of meetingReviews) {
    await prisma.meetingReview.create({
      data: {
        id: mr.id,
        projectId: mr.projectId,
        title: mr.title,
        status: mr.status as "IN_PROGRESS" | "FINALIZED" | "ARCHIVED",
        rounds: {
          create: mr.rounds.map((r) => ({
            roundNo: r.roundNo,
            senderContactId: r.senderId || null,
            receiverContactId: r.receiverId || null,
            sentAt: toDate(r.sentAt),
            feedback: r.feedback || null,
            status: r.status as
              | "PENDING"
              | "SENT"
              | "FEEDBACK_RECEIVED"
              | "FINALIZED",
          })),
        },
      },
    });
  }

  console.log("⑧ 写入出差/接待 …");
  for (const r of receptions) {
    await prisma.reception.create({
      data: {
        id: r.id,
        projectId: r.projectId || null,
        type: r.type as "VISIT" | "EXHIBITION_INVITE" | "BUSINESS_TRIP",
        title: r.title,
        location: r.location || null,
        purpose: r.purpose || null,
        startAt: toDate(r.startAt),
        endAt: toDate(r.endAt),
        status: r.status as "PLANNED" | "CONFIRMED" | "DONE" | "CANCELLED",
        visitors: {
          create: r.visitorIds.map((contactId) => ({ contactId })),
        },
      },
    });
  }

  console.log("⑨ 写入问题清单 / 知识库 / 成长 / 资料 / 周计划 / 钱包 / 动态 …");
  for (const q of feedbackQuestions) {
    await prisma.feedbackQuestion.create({
      data: {
        id: q.id,
        projectId: q.projectId,
        source: q.source,
        question: q.question,
        answer: q.answer || null,
        note: q.note || null,
        status: q.status as
          | "OPEN"
          | "SENT"
          | "ANSWERED"
          | "UNCLEAR"
          | "NEED_MEETING"
          | "CONFIRMED",
      },
    });
  }
  for (const k of knowledgeNotes) {
    await prisma.knowledgeNote.create({
      data: {
        id: k.id,
        topic: k.topic,
        title: k.title,
        content: k.content,
        url: k.url || null,
        projectId: k.projectId || null,
      },
    });
  }
  for (const g of growthLogs) {
    await prisma.growthLog.create({
      data: {
        id: g.id,
        category: g.category,
        title: g.title,
        detail: g.detail || null,
        projectId: g.projectId || null,
        happenedAt: toDate(g.happenedAt) ?? new Date(),
      },
    });
  }
  for (const r of resources) {
    await prisma.resource.create({
      data: {
        id: r.id,
        name: r.name,
        category: r.category,
        url: r.url || null,
        note: r.note || null,
        important: r.important,
      },
    });
  }
  for (const b of scheduleBlocks) {
    await prisma.scheduleBlock.create({
      data: {
        id: b.id,
        title: b.title,
        date: toDate(b.date),
        startMin: b.startMin,
        endMin: b.endMin,
        kind: b.kind,
      },
    });
  }
  for (const m of moneyRecords) {
    await prisma.moneyRecord.create({
      data: {
        id: m.id,
        kind: m.kind as "SALARY" | "ADVANCE" | "REIMBURSED" | "OTHER",
        amount: m.amount,
        currency: m.currency,
        happenedAt: toDate(m.happenedAt) ?? new Date(),
        note: m.note || null,
      },
    });
  }
  for (const e of timelineEvents) {
    await prisma.timelineEvent.create({
      data: {
        id: e.id,
        projectId: e.projectId,
        entityType: "Seed",
        action: e.action,
        message: e.message,
        createdAt: toDate(e.createdAt) ?? new Date(),
      },
    });
  }

  console.log("✅ 初始化完成！刷新页面即可看到你的真实数据。");
}

main()
  .catch((e) => {
    console.error("❌ 初始化失败：", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
