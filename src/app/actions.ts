"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ContactRole, FileType, ProjectContactSide, Tag, TagType } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { isDatabaseConfigured } from "@/lib/db-status";
import {
  contactRoles,
  defaultStageTemplate,
  fileTypes,
  regions,
  taskTypes,
} from "@/lib/default-data";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getDate(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value ? new Date(`${value}T00:00:00`) : undefined;
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

  const projectId = getString(formData, "projectId");
  const title = getString(formData, "title");
  const typeName = getString(formData, "type");
  const assigneeId = getString(formData, "assigneeId");
  const dueDate = getDate(formData, "dueDate");

  if (!projectId || !title) {
    redirect("/tasks?error=missing-required");
  }

  const typeTag = await ensureTag(TagType.TASK_TYPE, typeName || "商务沟通");

  await getPrisma().task.create({
    data: {
      projectId,
      title,
      dueDate,
      typeTagId: typeTag?.id,
      assigneeId: assigneeId || undefined,
    },
  });

  await getPrisma().timelineEvent.create({
    data: {
      projectId,
      entityType: "Task",
      action: "任务创建",
      message: `新增任务「${title}」。`,
    },
  });

  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath(`/projects/${projectId}`);
  redirect("/tasks?created=task");
}
