"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  ContactRole,
  FileStatus,
  FileType,
  GrowthCategory,
  MeetingReviewStatus,
  MoneyKind,
  Priority,
  ProjectContactSide,
  ProjectStatus,
  QuestionStatus,
  ReceptionStatus,
  ReceptionType,
  ReviewRoundStatus,
  StageStatus,
  Tag,
  TagType,
  TaskStatus,
  TemplateType,
} from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { isDatabaseConfigured } from "@/lib/db-status";
import { AUTH_COOKIE } from "@/lib/auth";
import {
  SETTING_KEYS,
  getEffectivePassword,
  passwordCookieValue,
  setDbSetting,
} from "@/lib/app-settings";
import { LOCALE_COOKIE } from "@/lib/i18n";
import { isStorageConfigured, uploadToBucket } from "@/lib/storage";
import {
  contactRoles,
  defaultStageTemplate,
  fileTypes,
  regions,
  taskTypes,
  workflowTemplates,
} from "@/lib/default-data";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getDate(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value ? new Date(`${value}T00:00:00`) : undefined;
}

// datetime-local 输入返回 "YYYY-MM-DDTHH:mm"，按本地时间解析
function getDateTime(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value ? new Date(value) : undefined;
}

function getStringList(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((item) => String(item).trim())
    .filter(Boolean);
}

function requireDatabase(path: string) {
  if (!isDatabaseConfigured()) {
    redirect(`${path}?setup=database-required`);
  }
}

async function ensureTag(type: TagType, name: string): Promise<Tag | null> {
  if (!name) return null;

  return getPrisma().tag.upsert({
    where: { type_name: { type, name } },
    create: { type, name },
    update: {},
  });
}

async function ensureContactRole(name: string): Promise<ContactRole> {
  return getPrisma().contactRole.upsert({
    where: { name },
    create: { name },
    update: {},
  });
}

async function ensureFileType(name: string): Promise<FileType> {
  return getPrisma().fileType.upsert({
    where: { name },
    create: { name },
    update: {},
  });
}

async function ensureStageTemplate() {
  const existing = await getPrisma().stageTemplate.findFirst({
    where: { name: defaultStageTemplate.name },
    include: { items: true },
  });

  if (existing) {
    return existing;
  }

  return getPrisma().stageTemplate.create({
    data: {
      name: defaultStageTemplate.name,
      isDefault: true,
      items: {
        create: defaultStageTemplate.items.map((item) => ({
          name: item.name,
          sortOrder: item.sortOrder,
          description: item.description ?? null,
        })),
      },
    },
    include: { items: true },
  });
}

export async function initializeDefaultsAction() {
  requireDatabase("/settings");

  await Promise.all([
    ...regions.map((name) => ensureTag(TagType.REGION, name)),
    ...taskTypes.map((name) => ensureTag(TagType.TASK_TYPE, name)),
    ensureTag(TagType.PROJECT_TYPE, "标准项目"),
    ensureTag(TagType.PROJECT_TYPE, "接待/展会专项"),
    ...contactRoles.map((name) => ensureContactRole(name)),
    ...fileTypes.map((name) => ensureFileType(name)),
  ]);

  await ensureStageTemplate();

  revalidatePath("/settings");
  redirect("/settings?created=defaults");
}

export async function createContactAction(formData: FormData) {
  requireDatabase("/contacts");

  const name = getString(formData, "name");
  const organization = getString(formData, "organization");
  const title = getString(formData, "title");
  const regionName = getString(formData, "region");
  const email = getString(formData, "email");
  const wechat = getString(formData, "wechat");
  const roleName = getString(formData, "role");

  if (!name || !organization) {
    redirect("/contacts?error=missing-required");
  }

  const [regionTag, role] = await Promise.all([
    ensureTag(TagType.REGION, regionName),
    roleName ? ensureContactRole(roleName) : null,
  ]);

  await getPrisma().contact.create({
    data: {
      name,
      organization,
      title,
      email,
      wechat,
      regionTagId: regionTag?.id,
      roles: role
        ? {
            create: {
              roleId: role.id,
            },
          }
        : undefined,
    },
  });

  revalidatePath("/contacts");
  revalidatePath("/");
  redirect("/contacts?created=contact");
}

export async function createProjectAction(formData: FormData) {
  requireDatabase("/projects");

  const nameZh = getString(formData, "nameZh");
  const nameEn = getString(formData, "nameEn");
  const clientName = getString(formData, "clientName");
  const regionName = getString(formData, "region");
  const projectTypeName = getString(formData, "projectType");
  const plannedStart = getDate(formData, "plannedStart");
  const plannedEnd = getDate(formData, "plannedEnd");
  const ownerId = getString(formData, "ownerId");
  const clientContactId = getString(formData, "clientContactId");
  const supplierContactId = getString(formData, "supplierContactId");

  if (!nameZh || !clientName) {
    redirect("/projects?error=missing-required");
  }

  const [regionTag, projectTypeTag, template] = await Promise.all([
    ensureTag(TagType.REGION, regionName),
    ensureTag(TagType.PROJECT_TYPE, projectTypeName || "标准项目"),
    ensureStageTemplate(),
  ]);

  const contactLinks = [
    ownerId
      ? {
          contactId: ownerId,
          side: ProjectContactSide.OUR_TEAM,
          isPrimary: true,
        }
      : null,
    clientContactId
      ? {
          contactId: clientContactId,
          side: ProjectContactSide.CLIENT,
          isPrimary: true,
        }
      : null,
    supplierContactId
      ? {
          contactId: supplierContactId,
          side: ProjectContactSide.SUPPLIER,
          isPrimary: true,
        }
      : null,
  ].filter(Boolean) as Array<{
    contactId: string;
    side: ProjectContactSide;
    isPrimary: boolean;
  }>;

  const project = await getPrisma().project.create({
    data: {
      nameZh,
      nameEn,
      clientName,
      plannedStart,
      plannedEnd,
      regionTagId: regionTag?.id,
      projectTypeTagId: projectTypeTag?.id,
      stageTemplateId: template.id,
      contacts: {
        create: contactLinks,
      },
      stages: {
        create: template.items
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((item) => ({
            name: item.name,
            sortOrder: item.sortOrder,
            sourceTemplateItemId: item.id,
          })),
      },
    },
  });

  await getPrisma().timelineEvent.create({
    data: {
      projectId: project.id,
      entityType: "Project",
      entityId: project.id,
      action: "项目创建",
      message: `新建项目「${nameZh}」，已按默认阶段模板生成阶段。`,
    },
  });

  revalidatePath("/");
  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function createTaskAction(formData: FormData) {
  requireDatabase("/tasks");

  // projectId 可为空：不挂项目的个人/行政事务（报销、入职手续等）
  const projectId = getString(formData, "projectId");
  const title = getString(formData, "title");
  const typeName = getString(formData, "type");
  const assigneeId = getString(formData, "assigneeId");
  const dueDate = getDate(formData, "dueDate");
  const priority = parsePriority(getString(formData, "priority"));

  if (!title) {
    redirect("/tasks?error=missing-required");
  }

  const typeTag = await ensureTag(TagType.TASK_TYPE, typeName || "商务沟通");

  await getPrisma().task.create({
    data: {
      projectId: projectId || null,
      title,
      dueDate,
      priority,
      typeTagId: typeTag?.id,
      assigneeId: assigneeId || undefined,
    },
  });

  if (projectId) {
    await getPrisma().timelineEvent.create({
      data: {
        projectId,
        entityType: "Task",
        action: "任务创建",
        message: `新增任务「${title}」。`,
      },
    });
    revalidatePath(`/projects/${projectId}`);
  }

  revalidatePath("/");
  revalidatePath("/tasks");
  redirect("/tasks?created=task");
}

function parsePriority(value: string): Priority {
  return (Object.values(Priority) as string[]).includes(value)
    ? (value as Priority)
    : Priority.MEDIUM;
}

function parseTaskStatus(value: string): TaskStatus {
  return (Object.values(TaskStatus) as string[]).includes(value)
    ? (value as TaskStatus)
    : TaskStatus.TODO;
}

export async function updateTaskStatusAction(formData: FormData) {
  requireDatabase("/tasks");

  const taskId = getString(formData, "taskId");
  const status = parseTaskStatus(getString(formData, "status"));
  if (!taskId) redirect("/tasks");

  const task = await getPrisma().task.update({
    where: { id: taskId },
    data: { status },
    select: { projectId: true, title: true },
  });

  if (task.projectId && status === TaskStatus.DONE) {
    await getPrisma().timelineEvent.create({
      data: {
        projectId: task.projectId,
        entityType: "Task",
        entityId: taskId,
        action: "任务完成",
        message: `任务「${task.title}」已标记完成。`,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  if (task.projectId) revalidatePath(`/projects/${task.projectId}`);
}

export async function deleteTaskAction(formData: FormData) {
  requireDatabase("/tasks");

  const taskId = getString(formData, "taskId");
  if (taskId) {
    await getPrisma().task.delete({ where: { id: taskId } }).catch(() => {});
  }
  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
}

function parseFileStatus(value: string): FileStatus {
  return (Object.values(FileStatus) as string[]).includes(value)
    ? (value as FileStatus)
    : FileStatus.DRAFT;
}

async function createFileRecord(params: {
  projectId: string;
  stageId?: string;
  name: string;
  typeName: string;
  version?: string;
  status: FileStatus;
  url?: string;
}) {
  const fileType = params.typeName
    ? await ensureFileType(params.typeName)
    : null;

  await getPrisma().projectFile.create({
    data: {
      projectId: params.projectId,
      stageId: params.stageId || null,
      name: params.name,
      version: params.version || null,
      status: params.status,
      url: params.url || null,
      fileTypeId: fileType?.id,
    },
  });

  await getPrisma().timelineEvent.create({
    data: {
      projectId: params.projectId,
      entityType: "ProjectFile",
      action: "文件入库",
      message: `文件库新增「${params.name}」。`,
    },
  });
}

// 方式一：只登记文件名 + 外部链接（网盘 / OneDrive / Google Drive 等）
export async function createFileLinkAction(formData: FormData) {
  requireDatabase("/projects");

  const projectId = getString(formData, "projectId");
  const name = getString(formData, "name");
  const typeName = getString(formData, "type");
  const version = getString(formData, "version");
  const stageId = getString(formData, "stageId");
  const url = getString(formData, "url");
  const status = parseFileStatus(getString(formData, "status"));

  if (!projectId || !name) {
    redirect(`/projects/${projectId}?error=file-missing`);
  }

  await createFileRecord({
    projectId,
    stageId,
    name,
    typeName,
    version,
    status,
    url,
  });

  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}?created=file-link`);
}

export async function updateFileAction(formData: FormData) {
  requireDatabase("/projects");
  const id = getString(formData, "id");
  const projectId = getString(formData, "projectId");
  const name = getString(formData, "name");
  if (!id || !name) redirect(`/projects/${projectId}?error=file-missing`);

  const typeName = getString(formData, "type");
  const fileType = typeName ? await ensureFileType(typeName) : null;
  await getPrisma().projectFile.update({
    where: { id },
    data: {
      name,
      version: getString(formData, "version") || null,
      status: parseFileStatus(getString(formData, "status")),
      url: getString(formData, "url") || null,
      stageId: getString(formData, "stageId") || null,
      fileTypeId: fileType?.id ?? null,
    },
  });
  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}?created=file-link`);
}

export async function deleteFileAction(formData: FormData) {
  requireDatabase("/projects");
  const id = getString(formData, "id");
  const projectId = getString(formData, "projectId");
  if (id) await getPrisma().projectFile.delete({ where: { id } }).catch(() => {});
  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}`);
}

// 方式二：把文件本体上传到 Supabase Storage，自动生成访问链接后入库
export async function uploadFileAction(formData: FormData) {
  requireDatabase("/projects");

  const projectId = getString(formData, "projectId");
  const typeName = getString(formData, "type");
  const version = getString(formData, "version");
  const stageId = getString(formData, "stageId");
  const status = parseFileStatus(getString(formData, "status"));
  const file = formData.get("file");

  if (!projectId) {
    redirect("/projects");
  }

  if (!isStorageConfigured()) {
    redirect(`/projects/${projectId}?error=storage-not-configured`);
  }

  if (!(file instanceof File) || file.size === 0) {
    redirect(`/projects/${projectId}?error=file-empty`);
  }

  const uploadFile = file as File;
  let url: string;
  try {
    url = await uploadToBucket(uploadFile, `project-${projectId}`);
  } catch {
    redirect(`/projects/${projectId}?error=upload-failed`);
  }

  await createFileRecord({
    projectId,
    stageId,
    name: getString(formData, "name") || uploadFile.name,
    typeName,
    version,
    status,
    url: url!,
  });

  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}?created=file-upload`);
}

function parseReceptionType(value: string): ReceptionType {
  return (Object.values(ReceptionType) as string[]).includes(value)
    ? (value as ReceptionType)
    : ReceptionType.VISIT;
}

function parseReceptionStatus(value: string): ReceptionStatus {
  return (Object.values(ReceptionStatus) as string[]).includes(value)
    ? (value as ReceptionStatus)
    : ReceptionStatus.PLANNED;
}

export async function createReceptionAction(formData: FormData) {
  requireDatabase("/receptions");

  const type = parseReceptionType(getString(formData, "type"));
  const title = getString(formData, "title");
  const location = getString(formData, "location");
  const purpose = getString(formData, "purpose");
  const projectId = getString(formData, "projectId");
  const status = parseReceptionStatus(getString(formData, "status"));
  const startAt = getDateTime(formData, "startAt");
  const endAt = getDateTime(formData, "endAt");
  const visitorIds = getStringList(formData, "visitorIds");

  if (!title) {
    redirect("/receptions?error=missing-required");
  }

  const reception = await getPrisma().reception.create({
    data: {
      type,
      title,
      location: location || null,
      purpose: purpose || null,
      projectId: projectId || null,
      status,
      startAt,
      endAt,
      visitors: visitorIds.length
        ? {
            create: visitorIds.map((contactId) => ({ contactId })),
          }
        : undefined,
    },
  });

  if (projectId) {
    await getPrisma().timelineEvent.create({
      data: {
        projectId,
        entityType: "Reception",
        entityId: reception.id,
        action: type === "BUSINESS_TRIP" ? "出差安排" : "接待安排",
        message: `新增「${title}」。`,
      },
    });
  }

  // 行前清单：勾选后按开始时间自动生成一组准备任务
  const wantChecklist = getString(formData, "checklist") === "on";
  if (wantChecklist && startAt) {
    const typeTag = await ensureTag(TagType.TASK_TYPE, "接待安排");
    const offset = (days: number) =>
      new Date(startAt.getTime() + days * 86400000);
    const endBase = endAt ?? startAt;
    const checklist =
      type === ReceptionType.BUSINESS_TRIP
        ? [
            { title: `【${title}】OA 出差申请与订票订酒店`, due: offset(-7) },
            { title: `【${title}】准备议程与出差材料`, due: offset(-3) },
            { title: `【${title}】与对方确认时间地点`, due: offset(-1) },
            {
              title: `【${title}】整理票据提交报销`,
              due: new Date(endBase.getTime() + 3 * 86400000),
            },
          ]
        : [
            { title: `【${title}】确认议程并制作桌牌`, due: offset(-7) },
            { title: `【${title}】预订饭店与酒店`, due: offset(-7) },
            { title: `【${title}】车辆路线 / 用车申请`, due: offset(-5) },
            { title: `【${title}】确认接机/送机与入住安排`, due: offset(-3) },
            { title: `【${title}】准备伴手礼与讲解材料`, due: offset(-3) },
            {
              title: `【${title}】整理照片纪要并报销`,
              due: new Date(endBase.getTime() + 3 * 86400000),
            },
          ];
    await getPrisma().task.createMany({
      data: checklist.map((item) => ({
        projectId: projectId || null,
        title: item.title,
        dueDate: item.due,
        typeTagId: typeTag?.id,
      })),
    });
  }

  revalidatePath("/receptions");
  revalidatePath("/calendar");
  revalidatePath("/tasks");
  redirect(
    wantChecklist && startAt
      ? "/receptions?created=reception-checklist"
      : "/receptions?created=reception",
  );
}

export async function createResourceAction(formData: FormData) {
  requireDatabase("/resources");

  const name = getString(formData, "name");
  const category = getString(formData, "category") || "其他";
  const url = getString(formData, "url");
  const note = getString(formData, "note");
  const important = getString(formData, "important") === "on";

  if (!name) {
    redirect("/resources?error=missing-required");
  }

  await getPrisma().resource.create({
    data: {
      name,
      category,
      url: url || null,
      note: note || null,
      important,
    },
  });

  revalidatePath("/resources");
  redirect("/resources?created=resource");
}

export async function updateResourceAction(formData: FormData) {
  requireDatabase("/resources");
  const id = getString(formData, "id");
  const name = getString(formData, "name");
  if (!id || !name) redirect("/resources?error=missing-required");
  await getPrisma().resource.update({
    where: { id },
    data: {
      name,
      category: getString(formData, "category") || "其他",
      url: getString(formData, "url") || null,
      note: getString(formData, "note") || null,
      important: getString(formData, "important") === "on",
    },
  });
  revalidatePath("/resources");
  redirect("/resources?created=resource");
}

export async function deleteResourceAction(formData: FormData) {
  requireDatabase("/resources");
  const id = getString(formData, "id");
  if (id) await getPrisma().resource.delete({ where: { id } }).catch(() => {});
  revalidatePath("/resources");
  redirect("/resources");
}

// ── 拖动改期：甘特图阶段、日历任务/接待 ────────────────────────
// 这些动作直接接收参数（不是表单），供客户端拖动结束后调用。

export async function updateStageScheduleAction(
  stageId: string,
  startISO: string,
  endISO: string,
) {
  if (!isDatabaseConfigured()) return;

  const stage = await getPrisma().projectStage.update({
    where: { id: stageId },
    data: {
      plannedStart: startISO ? new Date(`${startISO}T00:00:00`) : null,
      plannedEnd: endISO ? new Date(`${endISO}T00:00:00`) : null,
    },
    select: { projectId: true, name: true },
  });

  await getPrisma().timelineEvent.create({
    data: {
      projectId: stage.projectId,
      entityType: "ProjectStage",
      entityId: stageId,
      action: "阶段改期",
      message: `阶段「${stage.name}」计划时间调整为 ${startISO} 至 ${endISO}。`,
    },
  });

  revalidatePath("/");
  revalidatePath(`/projects/${stage.projectId}`);
}

export async function moveTaskDueDateAction(taskId: string, dueISO: string) {
  if (!isDatabaseConfigured()) return;

  const task = await getPrisma().task.update({
    where: { id: taskId },
    data: { dueDate: dueISO ? new Date(`${dueISO}T00:00:00`) : null },
    select: { projectId: true },
  });

  revalidatePath("/calendar");
  revalidatePath("/");
  if (task.projectId) revalidatePath(`/projects/${task.projectId}`);
}

export async function moveReceptionAction(
  receptionId: string,
  deltaDays: number,
) {
  if (!isDatabaseConfigured() || !deltaDays) return;

  const rec = await getPrisma().reception.findUnique({
    where: { id: receptionId },
    select: { startAt: true, endAt: true },
  });
  if (!rec) return;

  const shift = (d: Date | null) =>
    d ? new Date(d.getTime() + deltaDays * 86400000) : null;

  await getPrisma().reception.update({
    where: { id: receptionId },
    data: { startAt: shift(rec.startAt), endAt: shift(rec.endAt) },
  });

  revalidatePath("/calendar");
  revalidatePath("/receptions");
}

// ── 右键快捷操作（日历 / 甘特图 / 任务行）─────────────────
// 直接接收参数供客户端事件调用，不走表单。

export async function setTaskStatusQuickAction(taskId: string, status: string) {
  if (!isDatabaseConfigured()) return;
  const parsed = parseTaskStatus(status);
  const task = await getPrisma().task.update({
    where: { id: taskId },
    data: { status: parsed },
    select: { projectId: true, title: true },
  });
  if (task.projectId && parsed === TaskStatus.DONE) {
    await getPrisma().timelineEvent.create({
      data: {
        projectId: task.projectId,
        entityType: "Task",
        entityId: taskId,
        action: "任务完成",
        message: `任务「${task.title}」已标记完成。`,
      },
    });
  }
  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  if (task.projectId) revalidatePath(`/projects/${task.projectId}`);
}

export async function deleteTaskQuickAction(taskId: string) {
  if (!isDatabaseConfigured()) return;
  await getPrisma().task.delete({ where: { id: taskId } }).catch(() => {});
  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
}

export async function setReceptionStatusQuickAction(
  receptionId: string,
  status: string,
) {
  if (!isDatabaseConfigured()) return;
  await getPrisma().reception.update({
    where: { id: receptionId },
    data: { status: parseReceptionStatus(status) },
  });
  revalidatePath("/receptions");
  revalidatePath("/calendar");
}

export async function deleteReceptionQuickAction(receptionId: string) {
  if (!isDatabaseConfigured()) return;
  await getPrisma()
    .reception.delete({ where: { id: receptionId } })
    .catch(() => {});
  revalidatePath("/receptions");
  revalidatePath("/calendar");
}

export async function setStageStatusQuickAction(
  stageId: string,
  status: string,
) {
  if (!isDatabaseConfigured()) return;
  const parsed = parseStageStatus(status);
  const stage = await getPrisma().projectStage.update({
    where: { id: stageId },
    data: {
      status: parsed,
      actualCompleted: parsed === StageStatus.COMPLETED ? new Date() : null,
    },
    select: { projectId: true, name: true },
  });
  await getPrisma().timelineEvent.create({
    data: {
      projectId: stage.projectId,
      entityType: "ProjectStage",
      entityId: stageId,
      action: "阶段状态",
      message: `阶段「${stage.name}」状态更新。`,
    },
  });
  revalidatePath("/");
  revalidatePath(`/projects/${stage.projectId}`);
}

// ── 一键推进：完成当前阶段，下一阶段进入进行中 ────────────

export async function advanceStageAction(formData: FormData) {
  const projectId = getString(formData, "projectId");
  if (!projectId) redirect("/projects");
  if (!isDatabaseConfigured()) {
    redirect(`/projects/${projectId}?setup=database-required`);
  }

  const stages = await getPrisma().projectStage.findMany({
    where: { projectId },
    orderBy: { sortOrder: "asc" },
  });
  const current =
    stages.find((s) => s.status === StageStatus.IN_PROGRESS) ??
    stages.find((s) => s.status === StageStatus.DELAYED) ??
    stages.find((s) => s.status === StageStatus.NOT_STARTED);
  if (!current) {
    redirect(`/projects/${projectId}`);
  }

  await getPrisma().projectStage.update({
    where: { id: current!.id },
    data: { status: StageStatus.COMPLETED, actualCompleted: new Date() },
  });

  const next = stages.find(
    (s) =>
      s.sortOrder > current!.sortOrder && s.status === StageStatus.NOT_STARTED,
  );
  if (next) {
    await getPrisma().projectStage.update({
      where: { id: next.id },
      data: { status: StageStatus.IN_PROGRESS },
    });
  }

  await getPrisma().timelineEvent.create({
    data: {
      projectId,
      entityType: "ProjectStage",
      entityId: current!.id,
      action: "阶段推进",
      message: next
        ? `阶段「${current!.name}」完成，进入「${next.name}」。`
        : `阶段「${current!.name}」完成，全部阶段已走完。`,
    },
  });

  revalidatePath("/");
  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}?updated=advanced`);
}

// ── 知识库 ────────────────────────────────────────────────

export async function createKnowledgeNoteAction(formData: FormData) {
  requireDatabase("/knowledge");
  const topic = getString(formData, "topic") || "其他";
  const title = getString(formData, "title");
  const content = getString(formData, "content");
  const url = getString(formData, "url");
  const projectId = getString(formData, "projectId");
  if (!title || !content) {
    redirect("/knowledge?error=missing-required");
  }
  await getPrisma().knowledgeNote.create({
    data: {
      topic,
      title,
      content,
      url: url || null,
      projectId: projectId || null,
    },
  });
  revalidatePath("/knowledge");
  redirect("/knowledge?created=note");
}

export async function updateKnowledgeNoteAction(formData: FormData) {
  requireDatabase("/knowledge");
  const id = getString(formData, "id");
  const title = getString(formData, "title");
  const content = getString(formData, "content");
  if (!id || !title || !content) {
    redirect("/knowledge?error=missing-required");
  }
  await getPrisma().knowledgeNote.update({
    where: { id },
    data: {
      topic: getString(formData, "topic") || "其他",
      title,
      content,
      url: getString(formData, "url") || null,
      projectId: getString(formData, "projectId") || null,
    },
  });
  revalidatePath("/knowledge");
  redirect("/knowledge?created=note");
}

export async function deleteKnowledgeNoteAction(formData: FormData) {
  requireDatabase("/knowledge");
  const id = getString(formData, "id");
  if (id) {
    await getPrisma().knowledgeNote.delete({ where: { id } }).catch(() => {});
  }
  revalidatePath("/knowledge");
}

// ── 问题反馈清单：逐条跟踪甲方/供应商问答 ──────────────────

function parseQuestionStatus(value: string): QuestionStatus {
  return (Object.values(QuestionStatus) as string[]).includes(value)
    ? (value as QuestionStatus)
    : QuestionStatus.OPEN;
}

export async function createFeedbackQuestionAction(formData: FormData) {
  requireDatabase("/meeting-reviews");
  const projectId = getString(formData, "projectId");
  const question = getString(formData, "question");
  const source = getString(formData, "source") || "甲方";
  if (!projectId || !question) {
    redirect("/meeting-reviews?error=missing-required");
  }
  await getPrisma().feedbackQuestion.create({
    data: { projectId, question, source },
  });
  revalidatePath("/meeting-reviews");
  redirect("/meeting-reviews?created=question");
}

export async function updateFeedbackQuestionAction(formData: FormData) {
  requireDatabase("/meeting-reviews");
  const id = getString(formData, "id");
  if (!id) redirect("/meeting-reviews");
  const status = parseQuestionStatus(getString(formData, "status"));
  const answer = getString(formData, "answer");
  const note = getString(formData, "note");
  await getPrisma().feedbackQuestion.update({
    where: { id },
    data: { status, answer: answer || null, note: note || null },
  });
  revalidatePath("/meeting-reviews");
  redirect("/meeting-reviews?created=question-updated");
}

export async function deleteFeedbackQuestionAction(formData: FormData) {
  requireDatabase("/meeting-reviews");
  const id = getString(formData, "id");
  if (id) {
    await getPrisma().feedbackQuestion.delete({ where: { id } }).catch(() => {});
  }
  revalidatePath("/meeting-reviews");
}

// ── 项目看板拖拽改状态 ────────────────────────────────────

export async function updateProjectStatusQuickAction(
  projectId: string,
  status: string,
) {
  if (!isDatabaseConfigured()) return;
  const parsed = (Object.values(ProjectStatus) as string[]).includes(status)
    ? (status as ProjectStatus)
    : null;
  if (!parsed) return;
  const project = await getPrisma().project.update({
    where: { id: projectId },
    data: { status: parsed },
    select: { nameZh: true },
  });
  await getPrisma().timelineEvent.create({
    data: {
      projectId,
      entityType: "Project",
      entityId: projectId,
      action: "项目状态",
      message: `项目「${project.nameZh}」状态调整为 ${parsed}。`,
    },
  });
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
}

// ── 按流程模板一键生成任务（报销/出差申请/用车/供应商新增…）──

export async function createWorkflowTasksAction(formData: FormData) {
  requireDatabase("/tasks");
  const key = getString(formData, "workflow");
  const projectId = getString(formData, "projectId");
  const baseDate = getDate(formData, "baseDate") ?? new Date();
  const template = workflowTemplates.find((item) => item.key === key);
  if (!template) redirect("/tasks");

  const typeTag = await ensureTag(TagType.TASK_TYPE, "内部流程");
  await getPrisma().task.createMany({
    data: template!.items.map((item) => ({
      projectId: projectId || null,
      title: `【${template!.name}】${item.title}`,
      dueDate: new Date(baseDate.getTime() + item.offset * 86400000),
      typeTagId: typeTag?.id,
    })),
  });

  revalidatePath("/tasks");
  revalidatePath("/");
  revalidatePath("/calendar");
  redirect(`/tasks?created=workflow-${template!.items.length}`);
}

// ── 周计划时间块 ──────────────────────────────────────────

export async function createScheduleBlockAction(formData: FormData) {
  requireDatabase("/week");
  const title = getString(formData, "title");
  const dateStr = getString(formData, "date"); // 空 = 每天例行
  const start = getString(formData, "start"); // HH:mm
  const end = getString(formData, "end");
  if (!title || !start || !end) {
    redirect("/week?error=missing-required");
  }
  const toMin = (v: string) => {
    const [h, m] = v.split(":").map(Number);
    return h * 60 + (m || 0);
  };
  const startMin = toMin(start);
  const endMin = Math.max(toMin(end), startMin + 15);

  await getPrisma().scheduleBlock.create({
    data: {
      title,
      date: dateStr ? new Date(`${dateStr}T00:00:00`) : null,
      startMin,
      endMin,
      kind: dateStr ? "work" : "routine",
      location: getString(formData, "location") || null,
      participants: getString(formData, "participants") || null,
      note: getString(formData, "note") || null,
      projectId: getString(formData, "projectId") || null,
    },
  });
  revalidatePath("/week");
  redirect("/week?created=block");
}

// 点击时间块 → 编辑全部字段（主题/日期/时间/地点/参与人/我的任务/项目）
export async function updateScheduleBlockAction(formData: FormData) {
  requireDatabase("/week");
  const id = getString(formData, "id");
  const title = getString(formData, "title");
  const dateStr = getString(formData, "date");
  const start = getString(formData, "start");
  const end = getString(formData, "end");
  if (!id || !title || !start || !end) {
    redirect("/week?error=missing-required");
  }
  const toMin = (v: string) => {
    const [h, m] = v.split(":").map(Number);
    return h * 60 + (m || 0);
  };
  const startMin = toMin(start);
  const endMin = Math.max(toMin(end), startMin + 15);
  await getPrisma().scheduleBlock.update({
    where: { id },
    data: {
      title,
      date: dateStr ? new Date(`${dateStr}T00:00:00`) : null,
      startMin,
      endMin,
      location: getString(formData, "location") || null,
      participants: getString(formData, "participants") || null,
      note: getString(formData, "note") || null,
      projectId: getString(formData, "projectId") || null,
    },
  });
  revalidatePath("/week");
  redirect("/week?created=block");
}

/** 拖动后落库：换天/改时间。dateStr 空串 = 保持例行 */
export async function moveScheduleBlockAction(
  blockId: string,
  dateStr: string,
  startMin: number,
  endMin: number,
) {
  if (!isDatabaseConfigured()) return;
  const block = await getPrisma().scheduleBlock.findUnique({
    where: { id: blockId },
    select: { date: true },
  });
  if (!block) return;
  await getPrisma().scheduleBlock.update({
    where: { id: blockId },
    data: {
      // 例行块拖动只改时间不改日期；有日期的块可以换天
      date: block.date ? new Date(`${dateStr}T00:00:00`) : null,
      startMin: Math.max(0, Math.min(startMin, 1425)),
      endMin: Math.max(startMin + 15, Math.min(endMin, 1440)),
    },
  });
  revalidatePath("/week");
}

export async function deleteScheduleBlockAction(blockId: string) {
  if (!isDatabaseConfigured()) return;
  await getPrisma()
    .scheduleBlock.delete({ where: { id: blockId } })
    .catch(() => {});
  revalidatePath("/week");
}

// ── 财务记录：工资 / 垫付 / 报销 ──────────────────────────

function parseMoneyKind(value: string): MoneyKind {
  return (Object.values(MoneyKind) as string[]).includes(value)
    ? (value as MoneyKind)
    : MoneyKind.ADVANCE;
}

export async function createMoneyRecordAction(formData: FormData) {
  requireDatabase("/money");
  const kind = parseMoneyKind(getString(formData, "kind"));
  const amount = Number(getString(formData, "amount"));
  const currency = getString(formData, "currency") || "CNY";
  const happenedAt = getDate(formData, "happenedAt") ?? new Date();
  const note = getString(formData, "note");
  if (!Number.isFinite(amount) || amount <= 0) {
    redirect("/money?error=missing-required");
  }
  await getPrisma().moneyRecord.create({
    data: { kind, amount, currency, happenedAt, note: note || null },
  });
  revalidatePath("/money");
  redirect("/money?created=record");
}

/** 垫付 → 报销到账（一键回款） */
export async function markReimbursedAction(formData: FormData) {
  requireDatabase("/money");
  const id = getString(formData, "id");
  if (id) {
    await getPrisma().moneyRecord.update({
      where: { id },
      data: { kind: MoneyKind.REIMBURSED },
    }).catch(() => {});
  }
  revalidatePath("/money");
}

export async function deleteMoneyRecordAction(formData: FormData) {
  requireDatabase("/money");
  const id = getString(formData, "id");
  if (id) {
    await getPrisma().moneyRecord.delete({ where: { id } }).catch(() => {});
  }
  revalidatePath("/money");
}

export async function updateMoneyRecordAction(formData: FormData) {
  requireDatabase("/money");
  const id = getString(formData, "id");
  const amount = Number(getString(formData, "amount"));
  if (!id || !Number.isFinite(amount) || amount <= 0) {
    redirect("/money?error=missing-required");
  }
  await getPrisma().moneyRecord.update({
    where: { id },
    data: {
      kind: parseMoneyKind(getString(formData, "kind")),
      amount,
      currency: getString(formData, "currency") || "CNY",
      happenedAt: getDate(formData, "happenedAt") ?? new Date(),
      note: getString(formData, "note") || null,
    },
  });
  revalidatePath("/money");
  redirect("/money?created=record");
}

// ── 编辑历史数据：成长档案 / 联系人 / 接待 ─────────────────

export async function updateGrowthLogAction(formData: FormData) {
  requireDatabase("/growth");
  const id = getString(formData, "id");
  const title = getString(formData, "title");
  if (!id || !title) redirect("/growth?error=missing-required");
  await getPrisma().growthLog.update({
    where: { id },
    data: {
      title,
      detail: getString(formData, "detail") || null,
      category: parseGrowthCategory(getString(formData, "category")),
      projectId: getString(formData, "projectId") || null,
      happenedAt: getDate(formData, "happenedAt") ?? new Date(),
    },
  });
  revalidatePath("/growth");
  redirect("/growth?created=log");
}

export async function updateContactAction(formData: FormData) {
  requireDatabase("/contacts");
  const id = getString(formData, "id");
  const name = getString(formData, "name");
  const organization = getString(formData, "organization");
  if (!id || !name || !organization) {
    redirect("/contacts?error=missing-required");
  }
  const regionName = getString(formData, "region");
  const regionTag = await ensureTag(TagType.REGION, regionName);
  await getPrisma().contact.update({
    where: { id },
    data: {
      name,
      organization,
      title: getString(formData, "title") || null,
      email: getString(formData, "email") || null,
      wechat: getString(formData, "wechat") || null,
      regionTagId: regionTag?.id ?? null,
    },
  });
  revalidatePath("/contacts");
  revalidatePath("/");
  redirect("/contacts?created=contact");
}

export async function deleteContactAction(formData: FormData) {
  requireDatabase("/contacts");
  const id = getString(formData, "id");
  if (id) {
    // 有引用时 onDelete: Restrict 会报错，catch 掉给出提示
    try {
      await getPrisma().contact.delete({ where: { id } });
    } catch {
      redirect("/contacts?error=contact-in-use");
    }
  }
  revalidatePath("/contacts");
  redirect("/contacts");
}

export async function updateReceptionAction(formData: FormData) {
  requireDatabase("/receptions");
  const id = getString(formData, "id");
  const title = getString(formData, "title");
  if (!id || !title) redirect("/receptions?error=missing-required");
  const visitorIds = getStringList(formData, "visitorIds");
  await getPrisma().reception.update({
    where: { id },
    data: {
      type: parseReceptionType(getString(formData, "type")),
      title,
      location: getString(formData, "location") || null,
      purpose: getString(formData, "purpose") || null,
      projectId: getString(formData, "projectId") || null,
      status: parseReceptionStatus(getString(formData, "status")),
      startAt: getDateTime(formData, "startAt"),
      endAt: getDateTime(formData, "endAt"),
      visitors: {
        deleteMany: {},
        create: visitorIds.map((contactId) => ({ contactId })),
      },
    },
  });
  revalidatePath("/receptions");
  revalidatePath("/calendar");
  redirect("/receptions?created=reception");
}

export async function deleteReceptionFormAction(formData: FormData) {
  requireDatabase("/receptions");
  const id = getString(formData, "id");
  if (id) {
    await getPrisma().reception.delete({ where: { id } }).catch(() => {});
  }
  revalidatePath("/receptions");
  revalidatePath("/calendar");
  redirect("/receptions");
}

// ── AI 提示词模板（存 TextTemplate 表）─────────────────────

export async function createPromptTemplateAction(formData: FormData) {
  requireDatabase("/assistant");
  const name = getString(formData, "name");
  const content = getString(formData, "content");
  if (!name || !content) {
    redirect("/assistant?error=template-missing");
  }
  await getPrisma().textTemplate.create({
    data: { name, content, type: TemplateType.EMAIL },
  });
  revalidatePath("/assistant");
  redirect("/assistant?created=template");
}

export async function deletePromptTemplateAction(formData: FormData) {
  requireDatabase("/assistant");
  const id = getString(formData, "id");
  if (id) {
    await getPrisma().textTemplate.delete({ where: { id } }).catch(() => {});
  }
  revalidatePath("/assistant");
}

// ── 登录 / 退出 ───────────────────────────────────────────

export async function loginAction(formData: FormData) {
  const expected = await getEffectivePassword();
  // 没设密码：不启用保护，直接进
  if (!expected) {
    redirect("/");
  }

  const password = getString(formData, "password");
  if (password !== expected) {
    redirect("/login?error=bad-password");
  }

  const store = await cookies();
  // cookie 里存密码哈希而非明文；改密码后所有旧 cookie 立即失效
  store.set(AUTH_COOKIE, passwordCookieValue(expected), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/");
}

// ── 界面语言：中文版 / 英文版整体切换 ────────────────────

export async function setLocaleAction(formData: FormData) {
  const locale = getString(formData, "locale") === "en" ? "en" : "zh";
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  const back = getString(formData, "back") || "/settings";
  revalidatePath("/", "layout");
  redirect(back);
}

// ── 运行时配置：登录密码 / AI Key 存数据库，免改 .env ─────

export async function saveAppPasswordAction(formData: FormData) {
  requireDatabase("/settings");
  const password = getString(formData, "password");
  await setDbSetting(SETTING_KEYS.password, password);

  // 改密码后当前会话也要重新登录（除非清空了密码）
  const store = await cookies();
  if (password) {
    store.set(AUTH_COOKIE, passwordCookieValue(password), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  revalidatePath("/settings");
  redirect("/settings?saved=password");
}

export async function saveDeepseekKeyAction(formData: FormData) {
  requireDatabase("/settings");
  const key = getString(formData, "key");
  await setDbSetting(SETTING_KEYS.deepseekKey, key);
  revalidatePath("/settings");
  revalidatePath("/assistant");
  redirect("/settings?saved=aikey");
}

export async function logoutAction() {
  const store = await cookies();
  store.delete(AUTH_COOKIE);
  redirect("/login");
}

// ── 项目阶段在线编辑（计划日期 / 状态）──────────────────

function parseStageStatus(value: string): StageStatus {
  return (Object.values(StageStatus) as string[]).includes(value)
    ? (value as StageStatus)
    : StageStatus.NOT_STARTED;
}

export async function updateStageAction(formData: FormData) {
  const stageId = getString(formData, "stageId");
  if (!stageId) redirect("/projects");
  if (!isDatabaseConfigured()) {
    redirect(`/projects?setup=database-required`);
  }

  const plannedStart = getDate(formData, "plannedStart");
  const plannedEnd = getDate(formData, "plannedEnd");
  const status = parseStageStatus(getString(formData, "status"));

  const stage = await getPrisma().projectStage.update({
    where: { id: stageId },
    data: {
      plannedStart: plannedStart ?? null,
      plannedEnd: plannedEnd ?? null,
      status,
      actualCompleted:
        status === StageStatus.COMPLETED ? new Date() : null,
    },
    select: { projectId: true, name: true },
  });

  await getPrisma().timelineEvent.create({
    data: {
      projectId: stage.projectId,
      entityType: "ProjectStage",
      entityId: stageId,
      action: "阶段编辑",
      message: `阶段「${stage.name}」已更新计划时间/状态。`,
    },
  });

  revalidatePath("/");
  revalidatePath(`/projects/${stage.projectId}`);
  redirect(`/projects/${stage.projectId}?updated=stage`);
}

// ── 设置：标签 / 文件类型 / 角色 / 阶段模板 增删改 ────────

export async function createTagAction(formData: FormData) {
  requireDatabase("/settings");
  const type = getString(formData, "type") as TagType;
  const name = getString(formData, "name");
  if (!name || !(Object.values(TagType) as string[]).includes(type)) {
    redirect("/settings?error=tag");
  }
  await ensureTag(type, name);
  revalidatePath("/settings");
  redirect("/settings?saved=tag");
}

export async function deleteTagAction(formData: FormData) {
  requireDatabase("/settings");
  const id = getString(formData, "id");
  if (id) {
    await getPrisma().tag.delete({ where: { id } }).catch(() => {});
  }
  revalidatePath("/settings");
  redirect("/settings?saved=tag");
}

export async function createFileTypeAction(formData: FormData) {
  requireDatabase("/settings");
  const name = getString(formData, "name");
  if (name) await ensureFileType(name);
  revalidatePath("/settings");
  redirect("/settings?saved=filetype");
}

export async function deleteFileTypeAction(formData: FormData) {
  requireDatabase("/settings");
  const id = getString(formData, "id");
  if (id) {
    await getPrisma().fileType.delete({ where: { id } }).catch(() => {});
  }
  revalidatePath("/settings");
  redirect("/settings?saved=filetype");
}

export async function createContactRoleAction(formData: FormData) {
  requireDatabase("/settings");
  const name = getString(formData, "name");
  if (name) await ensureContactRole(name);
  revalidatePath("/settings");
  redirect("/settings?saved=role");
}

export async function deleteContactRoleAction(formData: FormData) {
  requireDatabase("/settings");
  const id = getString(formData, "id");
  if (id) {
    await getPrisma().contactRole.delete({ where: { id } }).catch(() => {});
  }
  revalidatePath("/settings");
  redirect("/settings?saved=role");
}

export async function addStageTemplateItemAction(formData: FormData) {
  requireDatabase("/settings");
  const name = getString(formData, "name");
  if (!name) redirect("/settings?error=stage");

  const template = await ensureStageTemplate();
  const max = await getPrisma().stageTemplateItem.aggregate({
    where: { templateId: template.id },
    _max: { sortOrder: true },
  });
  await getPrisma().stageTemplateItem.create({
    data: {
      templateId: template.id,
      name,
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
  });
  revalidatePath("/settings");
  redirect("/settings?saved=stage");
}

export async function renameStageTemplateItemAction(formData: FormData) {
  requireDatabase("/settings");
  const id = getString(formData, "id");
  const name = getString(formData, "name");
  if (id && name) {
    await getPrisma().stageTemplateItem.update({
      where: { id },
      data: { name },
    });
  }
  revalidatePath("/settings");
  redirect("/settings?saved=stage");
}

export async function deleteStageTemplateItemAction(formData: FormData) {
  requireDatabase("/settings");
  const id = getString(formData, "id");
  if (id) {
    await getPrisma().stageTemplateItem.delete({ where: { id } }).catch(() => {});
  }
  revalidatePath("/settings");
  redirect("/settings?saved=stage");
}

// ── 会议纪要：新建流程 / 新增一轮 / 定稿入库 ─────────────

export async function createMeetingReviewAction(formData: FormData) {
  requireDatabase("/meeting-reviews");
  const projectId = getString(formData, "projectId");
  const title = getString(formData, "title");
  if (!projectId || !title) {
    redirect("/meeting-reviews?error=missing-required");
  }

  await getPrisma().meetingReview.create({
    data: { projectId, title, status: MeetingReviewStatus.IN_PROGRESS },
  });
  await getPrisma().timelineEvent.create({
    data: {
      projectId,
      entityType: "MeetingReview",
      action: "纪要流程创建",
      message: `新建会议纪要循环「${title}」。`,
    },
  });

  revalidatePath("/meeting-reviews");
  redirect("/meeting-reviews?created=review");
}

export async function addReviewRoundAction(formData: FormData) {
  requireDatabase("/meeting-reviews");
  const reviewId = getString(formData, "reviewId");
  const senderId = getString(formData, "senderId");
  const receiverId = getString(formData, "receiverId");
  const feedback = getString(formData, "feedback");
  if (!reviewId) redirect("/meeting-reviews");

  const max = await getPrisma().meetingReviewRound.aggregate({
    where: { reviewId },
    _max: { roundNo: true },
  });

  await getPrisma().meetingReviewRound.create({
    data: {
      reviewId,
      roundNo: (max._max.roundNo ?? 0) + 1,
      senderContactId: senderId || null,
      receiverContactId: receiverId || null,
      feedback: feedback || null,
      sentAt: new Date(),
      status: ReviewRoundStatus.SENT,
    },
  });

  revalidatePath("/meeting-reviews");
  redirect("/meeting-reviews?created=round");
}

export async function finalizeReviewAction(formData: FormData) {
  requireDatabase("/meeting-reviews");
  const reviewId = getString(formData, "reviewId");
  if (!reviewId) redirect("/meeting-reviews");

  const review = await getPrisma().meetingReview.findUnique({
    where: { id: reviewId },
    select: { id: true, projectId: true, title: true, stageId: true },
  });
  if (!review) redirect("/meeting-reviews");

  // 定稿：生成一条文件库记录并把纪要标记为已定稿
  const fileType = await ensureFileType("会议纪要");
  const file = await getPrisma().projectFile.create({
    data: {
      projectId: review!.projectId,
      stageId: review!.stageId,
      name: `${review!.title}（定稿）`,
      fileTypeId: fileType.id,
      status: FileStatus.APPROVED,
      version: "final",
    },
  });

  await getPrisma().meetingReview.update({
    where: { id: reviewId },
    data: { status: MeetingReviewStatus.FINALIZED, finalFileId: file.id },
  });

  await getPrisma().timelineEvent.create({
    data: {
      projectId: review!.projectId,
      entityType: "MeetingReview",
      entityId: reviewId,
      action: "纪要定稿入库",
      message: `会议纪要「${review!.title}」已定稿并存入文件库。`,
    },
  });

  revalidatePath("/meeting-reviews");
  revalidatePath(`/projects/${review!.projectId}`);
  redirect("/meeting-reviews?created=finalized");
}

// ── 浮动 AI 小助手：把口述的一天批量落库 ─────────────────

export type DailyDraft = {
  type: "task" | "growth" | "question" | "knowledge";
  title: string;
  project?: string;
  date?: string;
  detail?: string;
  category?: string;
  source?: string;
};

const GROWTH_LABEL_TO_ENUM: Record<string, GrowthCategory> = {
  成果亮点: GrowthCategory.ACHIEVEMENT,
  技能积累: GrowthCategory.SKILL,
  复盘教训: GrowthCategory.LESSON,
  证书培训: GrowthCategory.CERTIFICATE,
  人脉资源: GrowthCategory.NETWORK,
};

export async function createDailyItemsAction(items: DailyDraft[]) {
  if (!isDatabaseConfigured()) return { created: 0 };
  const prisma = getPrisma();
  const projects = await prisma.project.findMany({
    select: { id: true, nameZh: true, nameEn: true },
  });
  const matchProject = (name?: string) => {
    if (!name) return null;
    const hit = projects.find(
      (p) =>
        p.nameZh.includes(name) ||
        name.includes(p.nameZh) ||
        (p.nameEn && p.nameEn.toLowerCase().includes(name.toLowerCase())),
    );
    return hit?.id ?? null;
  };
  const toDate = (s?: string) =>
    s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00:00`) : null;

  let created = 0;
  for (const item of items) {
    const title = (item.title ?? "").trim();
    if (!title) continue;
    const projectId = matchProject(item.project);
    try {
      if (item.type === "growth") {
        await prisma.growthLog.create({
          data: {
            title,
            detail: item.detail || null,
            category: GROWTH_LABEL_TO_ENUM[item.category ?? ""] ?? GrowthCategory.ACHIEVEMENT,
            projectId,
            happenedAt: toDate(item.date) ?? new Date(),
          },
        });
      } else if (item.type === "question") {
        if (!projectId) continue; // 问题必须挂项目
        await prisma.feedbackQuestion.create({
          data: {
            projectId,
            question: title,
            source: item.source || "甲方",
            note: item.detail || null,
          },
        });
      } else if (item.type === "knowledge") {
        await prisma.knowledgeNote.create({
          data: {
            topic: item.category || "其他",
            title,
            content: item.detail || title,
            projectId,
          },
        });
      } else {
        // task
        await prisma.task.create({
          data: {
            projectId,
            title,
            dueDate: toDate(item.date),
            description: item.detail || null,
          },
        });
      }
      created += 1;
    } catch {
      // 单条失败不影响其他
    }
  }

  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/growth");
  revalidatePath("/knowledge");
  revalidatePath("/meeting-reviews");
  return { created };
}

// ── 成长档案：为跳槽/职业发展积累素材 ─────────────────────

function parseGrowthCategory(value: string): GrowthCategory {
  return (Object.values(GrowthCategory) as string[]).includes(value)
    ? (value as GrowthCategory)
    : GrowthCategory.ACHIEVEMENT;
}

export async function createGrowthLogAction(formData: FormData) {
  requireDatabase("/growth");

  const title = getString(formData, "title");
  const detail = getString(formData, "detail");
  const category = parseGrowthCategory(getString(formData, "category"));
  const projectId = getString(formData, "projectId");
  const happenedAt = getDate(formData, "happenedAt");

  if (!title) {
    redirect("/growth?error=missing-required");
  }

  await getPrisma().growthLog.create({
    data: {
      title,
      detail: detail || null,
      category,
      projectId: projectId || null,
      happenedAt: happenedAt ?? new Date(),
    },
  });

  revalidatePath("/growth");
  redirect("/growth?created=log");
}

export async function deleteGrowthLogAction(formData: FormData) {
  requireDatabase("/growth");
  const id = getString(formData, "id");
  if (id) {
    await getPrisma().growthLog.delete({ where: { id } }).catch(() => {});
  }
  revalidatePath("/growth");
}

// ── 数据导入（恢复联系人 / 资料库这类独立记录）──────────

export async function importDataAction(formData: FormData) {
  requireDatabase("/settings");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/settings?error=import-empty");
  }

  let data: {
    contacts?: Array<{ name?: string; organization?: string; title?: string; email?: string; wechat?: string }>;
    resources?: Array<{ name?: string; category?: string; url?: string; note?: string; important?: boolean }>;
  };
  try {
    data = JSON.parse(await (file as File).text());
  } catch {
    redirect("/settings?error=import-bad");
  }

  const prisma = getPrisma();
  let count = 0;

  for (const c of data!.contacts ?? []) {
    if (!c?.name || !c?.organization) continue;
    await prisma.contact.create({
      data: {
        name: c.name,
        organization: c.organization,
        title: c.title || null,
        email: c.email || null,
        wechat: c.wechat || null,
      },
    });
    count += 1;
  }

  for (const r of data!.resources ?? []) {
    if (!r?.name) continue;
    await prisma.resource.create({
      data: {
        name: r.name,
        category: r.category || "其他",
        url: r.url || null,
        note: r.note || null,
        important: Boolean(r.important),
      },
    });
    count += 1;
  }

  revalidatePath("/contacts");
  revalidatePath("/resources");
  redirect(`/settings?imported=${count}`);
}
