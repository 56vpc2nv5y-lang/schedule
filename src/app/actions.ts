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
  TaskSource,
  TaskStatus,
  TemplateType,
} from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { isDatabaseConfigured } from "@/lib/db-status";
import { AUTH_COOKIE } from "@/lib/auth";
import { parseDateKey, parseDateTimeInput } from "@/lib/date-time";
import {
  SETTING_KEYS,
  getEffectivePassword,
  passwordCookieValue,
  setDbSetting,
} from "@/lib/app-settings";
import { isStorageConfigured, uploadToBucket } from "@/lib/storage";
import {
  deleteChecklistTask,
  syncReceptionChecklistTasks,
  syncTrainingChecklistTasks,
} from "@/lib/task-sync";
import {
  contactRoles,
  defaultStageTemplate,
  defaultVisitChecklist,
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
  return value ? parseDateKey(value) : undefined;
}

// datetime-local 杈撳叆杩斿洖 "YYYY-MM-DDTHH:mm"锛屾寜鏈湴鏃堕棿瑙ｆ瀽
function getDateTime(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value ? parseDateTimeInput(value) : undefined;
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
    ensureTag(TagType.PROJECT_TYPE, "鏍囧噯椤圭洰"),
    ensureTag(TagType.PROJECT_TYPE, "鎺ュ緟/灞曚細涓撻」"),
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
  revalidatePath("/today");
  revalidatePath("/tasks");
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
    ensureTag(TagType.PROJECT_TYPE, projectTypeName || "鏍囧噯椤圭洰"),
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
  revalidatePath("/today");
  revalidatePath("/tasks");
  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function createTaskAction(formData: FormData) {
  requireDatabase("/tasks");

  // projectId 鍙负绌猴細涓嶆寕椤圭洰鐨勪釜浜?琛屾斂浜嬪姟锛堟姤閿€銆佸叆鑱屾墜缁瓑锛?
  const projectId = getString(formData, "projectId");
  const title = getString(formData, "title");
  const description = getString(formData, "description");
  const typeName = getString(formData, "type");
  const assigneeId = getString(formData, "assigneeId");
  const dueDate = getDate(formData, "dueDate");
  const priority = parsePriority(getString(formData, "priority"));
  const status = parseTaskStatus(getString(formData, "status"));
  const waitingOn = getString(formData, "waitingOn");
  const sendChannel = getString(formData, "sendChannel");

  if (!title) {
    redirect("/tasks?error=missing-required");
  }

  const typeTag = await ensureTag(
    TagType.TASK_TYPE,
    taskTypes.includes(typeName as (typeof taskTypes)[number]) ? typeName : "项目",
  );

  await getPrisma().task.create({
    data: {
      projectId: projectId || null,
      title,
      description: description || null,
      dueDate,
      priority,
      status,
      waitingOn: waitingOn || null,
      sendChannel: sendChannel || null,
      source: TaskSource.MANUAL,
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
  revalidatePath("/today");
  revalidatePath("/tasks");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
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
    : TaskStatus.NOT_STARTED;
}

export async function updateTaskStatusAction(formData: FormData) {
  requireDatabase("/tasks");

  const taskId = getString(formData, "taskId");
  const status = parseTaskStatus(getString(formData, "status"));
  if (!taskId) redirect("/tasks");

  const task = await getPrisma().task.update({
    where: { id: taskId },
    data: { status },
    select: { projectId: true, title: true, source: true, sourceRefId: true },
  });

  // Checklist-backed rows share completion with their source record.
  if (task.sourceRefId && task.source === TaskSource.TRAINING_CHECKLIST) {
    await getPrisma().trainingChecklistItem.update({
      where: { id: task.sourceRefId },
      data: { done: status === TaskStatus.DONE },
    }).catch(() => {});
    if (task.projectId) await syncTrainingChecklistTasks(task.projectId);
  }
  if (task.sourceRefId && task.source === TaskSource.RECEPTION_CHECKLIST) {
    const item = await getPrisma().receptionChecklistItem.update({
      where: { id: task.sourceRefId },
      data: { done: status === TaskStatus.DONE },
      select: { receptionId: true },
    }).catch(() => null);
    if (item) {
      await syncReceptionChecklistTasks(item.receptionId);
      revalidatePath("/receptions");
      revalidatePath("/receptions/" + item.receptionId);
    }
  }
  if (
    task.sourceRefId &&
    task.source === TaskSource.FEEDBACK_FOLLOW_UP &&
    status === TaskStatus.DONE
  ) {
    await getPrisma().feedbackQuestion.update({
      where: { id: task.sourceRefId },
      data: { status: QuestionStatus.TO_CLIENT },
    }).catch(() => {});
    revalidatePath("/meeting-reviews");
  }
  if (task.projectId && status === TaskStatus.DONE) {
    await getPrisma().timelineEvent.create({
      data: {
        projectId: task.projectId,
        entityType: "Task",
        entityId: taskId,
        action: "浠诲姟瀹屾垚",
        message: `任务「${task.title}」已标记完成。`,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/today");
  revalidatePath("/tasks");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  if (task.projectId) revalidatePath(`/projects/${task.projectId}`);
}

export async function deleteTaskAction(formData: FormData) {
  requireDatabase("/tasks");

  const taskId = getString(formData, "taskId");
  if (taskId) {
    const task = await getPrisma().task.findUnique({
      where: { id: taskId },
      select: { source: true },
    });
    if (task?.source === TaskSource.MANUAL) {
      await getPrisma().task.delete({ where: { id: taskId } }).catch(() => {});
    }
  }
  revalidatePath("/");
  revalidatePath("/today");
  revalidatePath("/tasks");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
}

// 缂栬緫浠诲姟锛氭爣棰?/ 鎵€灞為」鐩?/ 绫诲瀷 / 浼樺厛绾?/ 鎴 / 璐熻矗浜?
export async function updateTaskAction(formData: FormData) {
  requireDatabase("/tasks");

  const taskId = getString(formData, "taskId");
  const title = getString(formData, "title");
  const description = getString(formData, "description");
  if (!taskId) redirect("/tasks");
  if (!title) redirect("/tasks?error=missing-required");

  const projectId = getString(formData, "projectId");
  const typeName = getString(formData, "type");
  const assigneeId = getString(formData, "assigneeId");
  const dueDate = getDate(formData, "dueDate");
  const priority = parsePriority(getString(formData, "priority"));
  const status = parseTaskStatus(getString(formData, "status"));
  const waitingOn = getString(formData, "waitingOn");
  const sendChannel = getString(formData, "sendChannel");
  const typeTag = await ensureTag(
    TagType.TASK_TYPE,
    taskTypes.includes(typeName as (typeof taskTypes)[number]) ? typeName : "项目",
  );

  const previous = await getPrisma().task.findUnique({
    where: { id: taskId },
    select: { projectId: true, source: true },
  });
  if (previous?.source !== TaskSource.MANUAL) {
    redirect("/tasks?error=source-task");
  }

  await getPrisma().task.update({
    where: { id: taskId },
    data: {
      projectId: projectId || null,
      title,
      description: description || null,
      dueDate: dueDate ?? null,
      priority,
      status,
      waitingOn: waitingOn || null,
      sendChannel: sendChannel || null,
      typeTagId: typeTag?.id ?? null,
      assigneeId: assigneeId || null,
    },
  });

  revalidatePath("/");
  revalidatePath("/today");
  revalidatePath("/tasks");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  if (previous?.projectId && previous.projectId !== projectId) {
    revalidatePath(`/projects/${previous.projectId}`);
  }
  if (projectId) revalidatePath(`/projects/${projectId}`);
  redirect("/tasks?created=task");
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
      action: "鏂囦欢鍏ュ簱",
      message: `文件库新增「${params.name}」。`,
    },
  });
}

// 鏂瑰紡涓€锛氬彧鐧昏鏂囦欢鍚?+ 澶栭儴閾炬帴锛堢綉鐩?/ OneDrive / Google Drive 绛夛級
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

// 鏂瑰紡浜岋細鎶婃枃浠舵湰浣撲笂浼犲埌 Supabase Storage锛岃嚜鍔ㄧ敓鎴愯闂摼鎺ュ悗鍏ュ簱
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
        action: type === "BUSINESS_TRIP" ? "鍑哄樊瀹夋帓" : "鎺ュ緟瀹夋帓",
        message: `新增「${title}」。`,
      },
    });
  }

  // 琛屽墠娓呭崟锛氬嬀閫夊悗鎸夊紑濮嬫椂闂磋嚜鍔ㄧ敓鎴愪竴缁勫噯澶囦换鍔?
  const wantChecklist = getString(formData, "checklist") === "on";
  if (wantChecklist) {
    await getPrisma().receptionChecklistItem.createMany({
      data: defaultVisitChecklist.map((item, index) => ({
        receptionId: reception.id,
        phase: item.phase,
        title: item.title,
        sortOrder: index,
      })),
    });
    await syncReceptionChecklistTasks(reception.id);
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

// 鈹€鈹€ 鎺ュ緟娓呭崟锛圫OP锛?鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

function revalidateReception(receptionId: string) {
  revalidatePath(`/receptions/${receptionId}`);
  revalidatePath("/receptions");
  revalidatePath("/today");
  revalidatePath("/tasks");
}

export async function toggleReceptionChecklistItemAction(
  id: string,
  done: boolean,
  receptionId: string,
) {
  if (!isDatabaseConfigured()) return;
  await getPrisma().receptionChecklistItem.update({
    where: { id },
    data: { done },
  });
  await syncReceptionChecklistTasks(receptionId);
  revalidateReception(receptionId);
}

export async function addReceptionChecklistItemAction(
  receptionId: string,
  phase: string,
  title: string,
) {
  if (!isDatabaseConfigured()) return;
  if (!title.trim()) return;
  const count = await getPrisma().receptionChecklistItem.count({
    where: { receptionId },
  });
  await getPrisma().receptionChecklistItem.create({
    data: {
      receptionId,
      phase: phase || "琛屽墠鍑嗗",
      title: title.trim(),
      sortOrder: count,
    },
  });
  await syncReceptionChecklistTasks(receptionId);
  revalidateReception(receptionId);
}

export async function deleteReceptionChecklistItemAction(
  id: string,
  receptionId: string,
) {
  if (!isDatabaseConfigured()) return;
  await deleteChecklistTask(TaskSource.RECEPTION_CHECKLIST, id);
  await getPrisma().receptionChecklistItem.delete({ where: { id } });
  revalidateReception(receptionId);
}

/** 涓€閿鐢ㄥ唴缃€屽鏂规潵璁裤€嶆ā鏉匡細鎶婃ā鏉?items 灞曞紑鎴愯鎺ュ緟鐨勬竻鍗?*/
export async function applyReceptionChecklistTemplateAction(receptionId: string) {
  if (!isDatabaseConfigured()) return;
  const existing = await getPrisma().receptionChecklistItem.count({
    where: { receptionId },
  });
  await getPrisma().receptionChecklistItem.createMany({
    data: defaultVisitChecklist.map((item, index) => ({
      receptionId,
      phase: item.phase,
      title: item.title,
      sortOrder: existing + index,
    })),
  });
  await syncReceptionChecklistTasks(receptionId);
  revalidateReception(receptionId);
}

export async function createResourceAction(formData: FormData) {
  requireDatabase("/resources");

  const name = getString(formData, "name");
  const category = getString(formData, "category") || "鍏朵粬";
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

export async function uploadResourceAction(formData: FormData) {
  requireDatabase("/resources");

  const file = formData.get("file");
  const name = getString(formData, "name");
  const category = getString(formData, "category") || "鍏朵粬";
  const note = getString(formData, "note");
  const important = getString(formData, "important") === "on";

  if (!isStorageConfigured()) {
    redirect("/resources?new=1&error=storage-not-configured#new");
  }
  if (!(file instanceof File) || file.size === 0) {
    redirect("/resources?new=1&error=file-empty#new");
  }
  if (file.size > 20 * 1024 * 1024) {
    redirect("/resources?new=1&error=file-too-large#new");
  }

  let url: string;
  try {
    url = await uploadToBucket(file, "resources");
  } catch {
    redirect("/resources?new=1&error=upload-failed#new");
  }

  await getPrisma().resource.create({
    data: {
      name: name || file.name,
      category,
      url: url!,
      note: note || null,
      important,
    },
  });

  revalidatePath("/resources");
  redirect("/resources?created=resource-upload");
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
      category: getString(formData, "category") || "鍏朵粬",
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

// 鈹€鈹€ 鎷栧姩鏀规湡锛氱敇鐗瑰浘闃舵銆佹棩鍘嗕换鍔?鎺ュ緟 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
// 杩欎簺鍔ㄤ綔鐩存帴鎺ユ敹鍙傛暟锛堜笉鏄〃鍗曪級锛屼緵瀹㈡埛绔嫋鍔ㄧ粨鏉熷悗璋冪敤銆?

export async function updateStageScheduleAction(
  stageId: string,
  startISO: string,
  endISO: string,
) {
  if (!isDatabaseConfigured()) return;

  const stage = await getPrisma().projectStage.update({
    where: { id: stageId },
    data: {
      plannedStart: startISO ? parseDateKey(startISO) : null,
      plannedEnd: endISO ? parseDateKey(endISO) : null,
    },
    select: { projectId: true, name: true },
  });

  await getPrisma().timelineEvent.create({
    data: {
      projectId: stage.projectId,
      entityType: "ProjectStage",
      entityId: stageId,
      action: "闃舵鏀规湡",
      message: `阶段「${stage.name}」计划时间调整为 ${startISO} 至 ${endISO}。`,
    },
  });

  revalidatePath("/");
  revalidatePath("/today");
  revalidatePath("/tasks");
  revalidatePath(`/projects/${stage.projectId}`);
}

export async function moveTaskDueDateAction(taskId: string, dueISO: string) {
  if (!isDatabaseConfigured()) return;

  const task = await getPrisma().task.update({
    where: { id: taskId },
    data: { dueDate: dueISO ? parseDateKey(dueISO) : null },
    select: { projectId: true },
  });

  revalidatePath("/calendar");
  revalidatePath("/");
  revalidatePath("/today");
  revalidatePath("/tasks");
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

// 鈹€鈹€ 鍙抽敭蹇嵎鎿嶄綔锛堟棩鍘?/ 鐢樼壒鍥?/ 浠诲姟琛岋級鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
// 鐩存帴鎺ユ敹鍙傛暟渚涘鎴风浜嬩欢璋冪敤锛屼笉璧拌〃鍗曘€?

export async function setTaskStatusQuickAction(taskId: string, status: string) {
  if (!isDatabaseConfigured()) return;
  const parsed = parseTaskStatus(status);
  const task = await getPrisma().task.update({
    where: { id: taskId },
    data: { status: parsed },
    select: { projectId: true, title: true, source: true, sourceRefId: true },
  });
  if (task.sourceRefId && task.source === TaskSource.TRAINING_CHECKLIST) {
    await getPrisma().trainingChecklistItem.update({
      where: { id: task.sourceRefId },
      data: { done: parsed === TaskStatus.DONE },
    }).catch(() => {});
    if (task.projectId) await syncTrainingChecklistTasks(task.projectId);
  }
  if (task.sourceRefId && task.source === TaskSource.RECEPTION_CHECKLIST) {
    const item = await getPrisma().receptionChecklistItem.update({
      where: { id: task.sourceRefId },
      data: { done: parsed === TaskStatus.DONE },
      select: { receptionId: true },
    }).catch(() => null);
    if (item) {
      await syncReceptionChecklistTasks(item.receptionId);
      revalidatePath("/receptions");
      revalidatePath("/receptions/" + item.receptionId);
    }
  }
  if (
    task.sourceRefId &&
    task.source === TaskSource.FEEDBACK_FOLLOW_UP &&
    parsed === TaskStatus.DONE
  ) {
    await getPrisma().feedbackQuestion.update({
      where: { id: task.sourceRefId },
      data: { status: QuestionStatus.TO_CLIENT },
    }).catch(() => {});
    revalidatePath("/meeting-reviews");
  }
  if (task.projectId && parsed === TaskStatus.DONE) {
    await getPrisma().timelineEvent.create({
      data: {
        projectId: task.projectId,
        entityType: "Task",
        entityId: taskId,
        action: "浠诲姟瀹屾垚",
        message: `任务「${task.title}」已标记完成。`,
      },
    });
  }
  revalidatePath("/");
  revalidatePath("/today");
  revalidatePath("/tasks");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  if (task.projectId) revalidatePath(`/projects/${task.projectId}`);
}

export async function deleteTaskQuickAction(taskId: string) {
  if (!isDatabaseConfigured()) return;
  await getPrisma().task.delete({ where: { id: taskId } }).catch(() => {});
  revalidatePath("/");
  revalidatePath("/today");
  revalidatePath("/tasks");
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
  revalidatePath("/today");
  revalidatePath("/tasks");
  revalidatePath(`/projects/${stage.projectId}`);
}

// 鈹€鈹€ 涓€閿帹杩涳細瀹屾垚褰撳墠闃舵锛屼笅涓€闃舵杩涘叆杩涜涓?鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

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
  revalidatePath("/today");
  revalidatePath("/tasks");
  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}?updated=advanced`);
}

// 鈹€鈹€ 鐭ヨ瘑搴?鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

export async function createKnowledgeNoteAction(formData: FormData) {
  requireDatabase("/knowledge");
  const topic = getString(formData, "topic") || "鍏朵粬";
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
      topic: getString(formData, "topic") || "鍏朵粬",
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

// 鈹€鈹€ 闂鍙嶉娓呭崟锛氶€愭潯璺熻釜鐢叉柟/渚涘簲鍟嗛棶绛?鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

function parseQuestionStatus(value: string): QuestionStatus {
  return (Object.values(QuestionStatus) as string[]).includes(value)
    ? (value as QuestionStatus)
    : QuestionStatus.ORGANIZING;
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
    data: {
      projectId,
      question,
      source,
      background: getString(formData, "background") || null,
      supplierQuestion: getString(formData, "supplierQuestion") || null,
      ownerContactId: getString(formData, "ownerContactId") || null,
      questionAt: getDateTime(formData, "questionAt") ?? null,
      plannedSupplierSendAt: getDateTime(formData, "plannedSupplierSendAt") ?? null,
      expectedReplyAt: getDateTime(formData, "expectedReplyAt") ?? null,
    },
  });
  revalidatePath("/meeting-reviews");
  redirect("/meeting-reviews?created=question");
}

export async function updateFeedbackQuestionAction(formData: FormData) {
  requireDatabase("/meeting-reviews");
  const id = getString(formData, "id");
  if (!id) redirect("/meeting-reviews");
  const status = parseQuestionStatus(getString(formData, "status"));
  const now = new Date();
  const isArchived = status === QuestionStatus.SENT_CLIENT;

  await getPrisma().feedbackQuestion.update({
    where: { id },
    data: {
      status,
      question: getString(formData, "question") || undefined,
      source: getString(formData, "source") || undefined,
      answer: getString(formData, "answer") || null,
      note: getString(formData, "note") || null,
      background: getString(formData, "background") || null,
      supplierQuestion: getString(formData, "supplierQuestion") || null,
      supplierReply: getString(formData, "supplierReply") || null,
      sunnyJudgment: getString(formData, "sunnyJudgment") || null,
      followUpLog: getString(formData, "followUpLog") || null,
      finalReplyZh: getString(formData, "finalReplyZh") || null,
      finalReplyEn: getString(formData, "finalReplyEn") || null,
      internalNote: getString(formData, "internalNote") || null,
      ownerContactId: getString(formData, "ownerContactId") || null,
      sendChannel: getString(formData, "sendChannel") || null,
      dueAt: getDateTime(formData, "dueAt") ?? null,
      questionAt: getDateTime(formData, "questionAt") ?? null,
      plannedSupplierSendAt: getDateTime(formData, "plannedSupplierSendAt") ?? null,
      supplierSentAt: getDateTime(formData, "supplierSentAt") ?? null,
      expectedReplyAt: getDateTime(formData, "expectedReplyAt") ?? null,
      actualReplyAt: getDateTime(formData, "actualReplyAt") ?? null,
      leaderReviewedAt: getDateTime(formData, "leaderReviewedAt") ?? null,
      translatedAt: getDateTime(formData, "translatedAt") ?? null,
      clientSentAt: getDateTime(formData, "clientSentAt") ?? (isArchived ? now : null),
      archivedAt: isArchived ? now : null,
    },
  });
  revalidatePath("/meeting-reviews");
  redirect("/meeting-reviews?created=question-updated");
}

export async function createFeedbackFollowUpTaskAction(formData: FormData) {
  requireDatabase("/meeting-reviews");
  const questionId = getString(formData, "questionId");
  if (!questionId) redirect("/meeting-reviews");

  const prisma = getPrisma();
  const question = await prisma.feedbackQuestion.findUnique({
    where: { id: questionId },
    select: {
      id: true,
      projectId: true,
      source: true,
      question: true,
      note: true,
      status: true,
      followUpTaskId: true,
    },
  });
  if (!question) redirect("/meeting-reviews");
  if (question.followUpTaskId) {
    redirect("/meeting-reviews?created=follow-up-task-exists");
  }
  if (
    question.status === QuestionStatus.SENT_CLIENT
  ) {
    redirect("/meeting-reviews?error=question-not-actionable");
  }

  const typeTag = await ensureTag(TagType.TASK_TYPE, "项目");
  const title =
    question.status === QuestionStatus.LEADER_REVIEW
      ? "安排 Leader 审核：" + question.question
      : question.status === QuestionStatus.TO_CLIENT
        ? "发送客户版回复：" + question.question
        : "跟进问题闭环：" + question.question;
  const task = await prisma.task.create({
    data: {
      projectId: question.projectId,
      typeTagId: typeTag?.id ?? null,
      title,
      description:
        "来自问题反馈清单（" +
        question.source +
        "）。待确认：" +
        (question.note || question.question),
      priority:
        question.status === QuestionStatus.LEADER_REVIEW || question.status === QuestionStatus.TO_CLIENT
          ? Priority.HIGH
          : Priority.MEDIUM,
      dueDate: new Date(),
      source: TaskSource.FEEDBACK_FOLLOW_UP,
      sourceRefId: question.id,
      sourceLabel: "来自纪要 / " + question.source,
      status: TaskStatus.NOT_STARTED,
    },
  });
  await prisma.feedbackQuestion.update({
    where: { id: question.id },
    data: { followUpTaskId: task.id },
  });
  await prisma.timelineEvent.create({
    data: {
      projectId: question.projectId,
      entityType: "FeedbackQuestion",
      entityId: question.id,
      action: "生成跟进任务",
      message: "问题已生成后续任务「" + task.title + "」。",
    },
  });

  revalidatePath("/");
  revalidatePath("/today");
  revalidatePath("/tasks");
  revalidatePath("/tasks");
  revalidatePath("/meeting-reviews");
  revalidatePath("/projects/" + question.projectId);
  redirect("/meeting-reviews?created=follow-up-task");
}
export async function deleteFeedbackQuestionAction(formData: FormData) {
  requireDatabase("/meeting-reviews");
  const id = getString(formData, "id");
  if (id) {
    await getPrisma().feedbackQuestion.delete({ where: { id } }).catch(() => {});
  }
  revalidatePath("/meeting-reviews");
}

// 鈹€鈹€ 椤圭洰鐪嬫澘鎷栨嫿鏀圭姸鎬?鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

async function setProjectStatus(projectId: string, status: ProjectStatus) {
  const prisma = getPrisma();
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, nameZh: true, status: true, trainingProfile: { select: { id: true } } },
  });
  if (!project) return;

  if (project.status !== status) {
    await prisma.project.update({ where: { id: projectId }, data: { status } });
    const statusLabel: Record<ProjectStatus, string> = {
      ACTIVE: "进行中",
      PAUSED: "暂停",
      COMPLETED: "已完成",
      CANCELLED: "已取消",
      ARCHIVED: "已归档",
    };
    const statusMessage = "项目“" + project.nameZh + "”状态调整为“" + statusLabel[status] + "”。";
    const previousStatusEvent = await prisma.timelineEvent.findFirst({
      where: {
        projectId,
        OR: [{ action: "项目状态调整" }, { action: "项目状态" }],
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, action: true, message: true, createdAt: true },
    });
    const now = new Date();
    const sameMinute =
      previousStatusEvent &&
      previousStatusEvent.createdAt.toISOString().slice(0, 16) ===
        now.toISOString().slice(0, 16);

    if (sameMinute) {
      await prisma.timelineEvent.update({
        where: { id: previousStatusEvent.id },
        data: { action: "项目状态调整", message: statusMessage },
      });
    } else {
      await prisma.timelineEvent.create({
        data: {
          projectId,
          entityType: "Project",
          entityId: projectId,
          action: "项目状态调整",
          message: statusMessage,
        },
      });
    }
  }

  // Project.status is authoritative. Training only reflects that status; it never
  // changes the status by itself or overwrites the saved working phase.
  if (project.trainingProfile) {
    await prisma.trainingProfile.update({
      where: { projectId },
      data: { postponed: status === ProjectStatus.PAUSED },
    });
    await syncTrainingChecklistTasks(projectId);
  }

  revalidatePath("/");
  revalidatePath("/today");
  revalidatePath("/tasks");
  revalidatePath("/projects");
  revalidatePath("/calendar");
  revalidatePath("/meeting-reviews");
  revalidatePath("/projects/" + projectId);
}

export async function updateProjectStatusQuickAction(projectId: string, status: string) {
  if (!isDatabaseConfigured()) return;
  const parsed = (Object.values(ProjectStatus) as string[]).includes(status)
    ? (status as ProjectStatus)
    : null;
  if (!parsed) return;
  await setProjectStatus(projectId, parsed);
}

export async function updateProjectStatusAction(formData: FormData) {
  requireDatabase("/projects");
  const projectId = getString(formData, "projectId");
  const status = getString(formData, "status");
  if (!projectId) redirect("/projects");
  await updateProjectStatusQuickAction(projectId, status);
  redirect("/projects/" + projectId + "?updated=status");
}
export async function createWorkflowTasksAction(formData: FormData) {
  requireDatabase("/tasks");
  const key = getString(formData, "workflow");
  const projectId = getString(formData, "projectId");
  const baseDate = getDate(formData, "baseDate") ?? new Date();
  const template = workflowTemplates.find((item) => item.key === key);
  if (!template) redirect("/tasks");

  const typeTag = await ensureTag(TagType.TASK_TYPE, "椤圭洰");
  await getPrisma().task.createMany({
    data: template!.items.map((item) => ({
      projectId: projectId || null,
      title: `【${template!.name}】${item.title}`,
      dueDate: new Date(baseDate.getTime() + item.offset * 86400000),
      typeTagId: typeTag?.id,
      status: TaskStatus.NOT_STARTED,
    })),
  });

  revalidatePath("/tasks");
  revalidatePath("/");
  revalidatePath("/today");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  redirect(`/tasks?created=workflow-${template!.items.length}`);
}

// 鈹€鈹€ 鍛ㄨ鍒掓椂闂村潡 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

export async function createScheduleBlockAction(formData: FormData) {
  requireDatabase("/today");
  const title = getString(formData, "title");
  const dateStr = getString(formData, "date"); // 绌?= 姣忓ぉ渚嬭
  const start = getString(formData, "start"); // HH:mm
  const end = getString(formData, "end");
  if (!title || !start || !end) {
    redirect("/today?error=missing-required");
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
      date: dateStr ? parseDateKey(dateStr) : null,
      startMin,
      endMin,
      kind: dateStr ? "work" : "routine",
      location: getString(formData, "location") || null,
      participants: getString(formData, "participants") || null,
      note: getString(formData, "note") || null,
      projectId: getString(formData, "projectId") || null,
    },
  });
  revalidatePath("/today");
  redirect("/today?created=block");
}

// 鐐瑰嚮鏃堕棿鍧?鈫?缂栬緫鍏ㄩ儴瀛楁锛堜富棰?鏃ユ湡/鏃堕棿/鍦扮偣/鍙備笌浜?鎴戠殑浠诲姟/椤圭洰锛?
export async function updateScheduleBlockAction(formData: FormData) {
  requireDatabase("/today");
  const id = getString(formData, "id");
  const title = getString(formData, "title");
  const dateStr = getString(formData, "date");
  const start = getString(formData, "start");
  const end = getString(formData, "end");
  if (!id || !title || !start || !end) {
    redirect("/today?error=missing-required");
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
      date: dateStr ? parseDateKey(dateStr) : null,
      startMin,
      endMin,
      location: getString(formData, "location") || null,
      participants: getString(formData, "participants") || null,
      note: getString(formData, "note") || null,
      projectId: getString(formData, "projectId") || null,
    },
  });
  revalidatePath("/today");
  redirect("/today?created=block");
}

/** 鎷栧姩鍚庤惤搴擄細鎹㈠ぉ/鏀规椂闂淬€俤ateStr 绌轰覆 = 淇濇寔渚嬭 */
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
      // 渚嬭鍧楁嫋鍔ㄥ彧鏀规椂闂翠笉鏀规棩鏈燂紱鏈夋棩鏈熺殑鍧楀彲浠ユ崲澶?
      date: block.date ? parseDateKey(dateStr) : null,
      startMin: Math.max(0, Math.min(startMin, 1425)),
      endMin: Math.max(startMin + 15, Math.min(endMin, 1440)),
    },
  });
  revalidatePath("/today");
}

export async function deleteScheduleBlockAction(blockId: string) {
  if (!isDatabaseConfigured()) return;
  await getPrisma()
    .scheduleBlock.delete({ where: { id: blockId } })
    .catch(() => {});
  revalidatePath("/today");
}

// 鈹€鈹€ 璐㈠姟璁板綍锛氬伐璧?/ 鍨粯 / 鎶ラ攢 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

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

/** 鍨粯 鈫?鎶ラ攢鍒拌处锛堜竴閿洖娆撅級 */
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

// 鈹€鈹€ 缂栬緫鍘嗗彶鏁版嵁锛氭垚闀挎。妗?/ 鑱旂郴浜?/ 鎺ュ緟 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

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
  revalidatePath("/today");
  revalidatePath("/tasks");
  redirect("/contacts?created=contact");
}

export async function deleteContactAction(formData: FormData) {
  requireDatabase("/contacts");
  const id = getString(formData, "id");
  if (id) {
    // 鏈夊紩鐢ㄦ椂 onDelete: Restrict 浼氭姤閿欙紝catch 鎺夌粰鍑烘彁绀?
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
  redirect("/projects?tab=reception&created=reception");
}

export async function deleteReceptionFormAction(formData: FormData) {
  requireDatabase("/receptions");
  const id = getString(formData, "id");
  if (id) {
    await getPrisma().reception.delete({ where: { id } }).catch(() => {});
  }
  revalidatePath("/receptions");
  revalidatePath("/calendar");
  redirect("/projects?tab=reception");
}

// 鈹€鈹€ AI 鎻愮ず璇嶆ā鏉匡紙瀛?TextTemplate 琛級鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

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

// 鈹€鈹€ 鐧诲綍 / 閫€鍑?鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

export async function loginAction(formData: FormData) {
  const expected = await getEffectivePassword();
  // 娌¤瀵嗙爜锛氫笉鍚敤淇濇姢锛岀洿鎺ヨ繘
  if (!expected) {
    redirect("/");
  }

  const password = getString(formData, "password");
  if (password !== expected) {
    redirect("/login?error=bad-password");
  }

  const store = await cookies();
  // cookie 閲屽瓨瀵嗙爜鍝堝笇鑰岄潪鏄庢枃锛涙敼瀵嗙爜鍚庢墍鏈夋棫 cookie 绔嬪嵆澶辨晥
  store.set(AUTH_COOKIE, passwordCookieValue(expected), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect("/");
}

// 鈹€鈹€ 杩愯鏃堕厤缃細鐧诲綍瀵嗙爜 / AI Key 瀛樻暟鎹簱锛屽厤鏀?.env 鈹€鈹€鈹€鈹€鈹€

export async function saveAppPasswordAction(formData: FormData) {
  requireDatabase("/settings");
  const password = getString(formData, "password");
  await setDbSetting(SETTING_KEYS.password, password);

  // 鏀瑰瘑鐮佸悗褰撳墠浼氳瘽涔熻閲嶆柊鐧诲綍锛堥櫎闈炴竻绌轰簡瀵嗙爜锛?
  const store = await cookies();
  if (password) {
    store.set(AUTH_COOKIE, passwordCookieValue(password), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
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

// 鈹€鈹€ 椤圭洰闃舵鍦ㄧ嚎缂栬緫锛堣鍒掓棩鏈?/ 鐘舵€侊級鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

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
      action: "闃舵缂栬緫",
      message: `阶段「${stage.name}」已更新计划时间/状态。`,
    },
  });

  revalidatePath("/");
  revalidatePath("/today");
  revalidatePath("/tasks");
  revalidatePath(`/projects/${stage.projectId}`);
  redirect(`/projects/${stage.projectId}?updated=stage`);
}

const TRAINING_PHASES = [
  "璇剧▼澶х翰",
  "鏍哥畻鎴愭湰",
  "鎶ヤ环",
  "鍚堝悓绛剧讲 / 鎷涙爣閲囪喘",
  "绛瑰",
] as const;

function optionalNumber(formData: FormData, key: string) {
  const value = getString(formData, key);
  if (!value) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function optionalInteger(formData: FormData, key: string) {
  const number = optionalNumber(formData, key);
  return number === null ? null : Math.max(0, Math.round(number));
}

export async function updateTrainingProfileAction(formData: FormData) {
  requireDatabase("/projects");
  const projectId = getString(formData, "projectId");
  if (!projectId) redirect("/projects");

  const requestedPhase = getString(formData, "currentPhase");
  const selectedPhase = TRAINING_PHASES.includes(
    requestedPhase as (typeof TRAINING_PHASES)[number],
  )
    ? requestedPhase
    : "璇剧▼澶х翰";
  const text = (key: string) => getString(formData, key) || null;
  const prisma = getPrisma();
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { status: true },
  });
  if (!project) redirect("/projects");

  const data = {
    currentPhase: selectedPhase,
    clientContactName: text("clientContactName"),
    clientContactInfo: text("clientContactInfo"),
    topicSource: text("topicSource"),
    topicCount: optionalInteger(formData, "topicCount"),
    participantCount: optionalInteger(formData, "participantCount"),
    totalDays: optionalNumber(formData, "totalDays"),
    dailyHours: optionalNumber(formData, "dailyHours"),
    location: text("location"),
    budget: optionalNumber(formData, "budget"),
    currency: getString(formData, "currency") || "CNY",
    costOwnership: text("costOwnership"),
    internalCostNote: text("internalCostNote"),
    quoteRound: optionalInteger(formData, "quoteRound") || 1,
    internalContractStatus: text("internalContractStatus"),
    clientContractStatus: text("clientContractStatus"),
    depositNote: text("depositNote"),
    prepaymentPercent: optionalNumber(formData, "prepaymentPercent"),
    paymentMilestones: text("paymentMilestones"),
    reportingStatus: text("reportingStatus"),
    postponed: project.status === ProjectStatus.PAUSED,
  };

  await prisma.trainingProfile.upsert({
    where: { projectId },
    create: { projectId, ...data },
    update: data,
  });
  await syncTrainingChecklistTasks(projectId);
  await prisma.timelineEvent.create({
    data: {
      projectId,
      entityType: "TrainingProfile",
      entityId: projectId,
      action: "培训台账更新",
      message: `培训项目字段已更新，当前阶段为「${selectedPhase}」。`,
    },
  });

  revalidatePath("/");
  revalidatePath("/today");
  revalidatePath("/projects");
  revalidatePath("/tasks");
  revalidatePath("/projects/" + projectId);
  redirect("/projects/" + projectId + "?updated=training");
}

export async function toggleTrainingChecklistAction(formData: FormData) {
  requireDatabase("/projects");
  const itemId = getString(formData, "itemId");
  const done = getString(formData, "done") === "true";
  const returnTo = getString(formData, "returnTo");
  const filter = getString(formData, "filter");
  if (!itemId) redirect("/projects");

  const item = await getPrisma().trainingChecklistItem.update({
    where: { id: itemId },
    data: { done },
    select: { trainingProfile: { select: { projectId: true } } },
  });
  const projectId = item.trainingProfile.projectId;
  await syncTrainingChecklistTasks(projectId);
  revalidatePath("/");
  revalidatePath("/today");
  revalidatePath("/tasks");
  revalidatePath("/projects/" + projectId);
  if (returnTo === "tasks") {
    redirect("/tasks?filter=" + (filter || "open") + "&updated=training-checklist");
  }
  redirect("/projects/" + projectId + "?updated=training-checklist");
}

// 设置：标签 / 文件类型 / 角色 / 阶段模板 增删改
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

// 鈹€鈹€ 浼氳绾锛氭柊寤烘祦绋?/ 鏂板涓€杞?/ 瀹氱鍏ュ簱 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

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

  // 瀹氱锛氱敓鎴愪竴鏉℃枃浠跺簱璁板綍骞舵妸绾鏍囪涓哄凡瀹氱
  const fileType = await ensureFileType("浼氳绾");
  const file = await getPrisma().projectFile.create({
    data: {
      projectId: review!.projectId,
      stageId: review!.stageId,
      name: `${review!.title}锛堝畾绋匡級`,
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
      action: "绾瀹氱鍏ュ簱",
      message: `会议纪要「${review!.title}」已定稿并存入文件库。`,
    },
  });

  revalidatePath("/meeting-reviews");
  revalidatePath(`/projects/${review!.projectId}`);
  redirect("/meeting-reviews?created=finalized");
}

// 鈹€鈹€ 娴姩 AI 灏忓姪鎵嬶細鎶婂彛杩扮殑涓€澶╂壒閲忚惤搴?鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

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
  "成果亮点": GrowthCategory.ACHIEVEMENT,
  "技能积累": GrowthCategory.SKILL,
  "复盘教训": GrowthCategory.LESSON,
  "证书培训": GrowthCategory.CERTIFICATE,
  "人脉资源": GrowthCategory.NETWORK,
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
    s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? parseDateKey(s) : null;

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
        if (!projectId) continue; // 闂蹇呴』鎸傞」鐩?
        await prisma.feedbackQuestion.create({
          data: {
            projectId,
            question: title,
            source: item.source || "鐢叉柟",
            note: item.detail || null,
          },
        });
      } else if (item.type === "knowledge") {
        await prisma.knowledgeNote.create({
          data: {
            topic: item.category || "鍏朵粬",
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
            status: TaskStatus.NOT_STARTED,
          },
        });
      }
      created += 1;
    } catch {
      // 鍗曟潯澶辫触涓嶅奖鍝嶅叾浠?
    }
  }

  revalidatePath("/");
  revalidatePath("/today");
  revalidatePath("/tasks");
  revalidatePath("/tasks");
  revalidatePath("/growth");
  revalidatePath("/knowledge");
  revalidatePath("/meeting-reviews");
  return { created };
}

// 鈹€鈹€ 鎴愰暱妗ｆ锛氫负璺虫Ы/鑱屼笟鍙戝睍绉疮绱犳潗 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

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

export async function createResumePointAction(formData: FormData) {
  requireDatabase("/growth");

  const title = getString(formData, "title");
  const chinese = getString(formData, "chinese");
  const english = getString(formData, "english");
  if (!title || !chinese || !english) {
    redirect("/growth?error=missing-resume-point");
  }

  await getPrisma().resumePoint.create({
    data: {
      title,
      chinese,
      english,
      sourceNote: getString(formData, "sourceNote") || null,
      projectId: getString(formData, "projectId") || null,
    },
  });

  revalidatePath("/growth");
  redirect("/growth?resumePoint=saved");
}

export async function updateResumePointAction(formData: FormData) {
  requireDatabase("/growth");

  const id = getString(formData, "id");
  const title = getString(formData, "title");
  const chinese = getString(formData, "chinese");
  const english = getString(formData, "english");
  if (!id || !title || !chinese || !english) {
    redirect("/growth?error=missing-resume-point");
  }

  await getPrisma().resumePoint.update({
    where: { id },
    data: {
      title,
      chinese,
      english,
      sourceNote: getString(formData, "sourceNote") || null,
      projectId: getString(formData, "projectId") || null,
    },
  });

  revalidatePath("/growth");
  redirect("/growth?resumePoint=saved");
}

export async function deleteResumePointAction(formData: FormData) {
  requireDatabase("/growth");

  const id = getString(formData, "id");
  if (id) {
    await getPrisma().resumePoint.delete({ where: { id } }).catch(() => {});
  }

  revalidatePath("/growth");
}
// 鈹€鈹€ 鏁版嵁瀵煎叆锛堟仮澶嶈仈绯讳汉 / 璧勬枡搴撹繖绫荤嫭绔嬭褰曪級鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

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
        category: r.category || "鍏朵粬",
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
