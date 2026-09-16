-- 空 Supabase 数据库完整初始化。
-- 仅在基础表（例如 "Project"）尚不存在时执行。
-- 由当前 prisma/schema.prisma 生成，不会插入或删除业务数据。

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "StageStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SELF_CHECK', 'LEADER_REVIEW', 'WAITING_EXTERNAL', 'READY_TO_SEND', 'DONE', 'TODO', 'WAITING', 'OVERDUE');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TaskSource" AS ENUM ('MANUAL', 'PROJECT_STAGE', 'TRAINING_CHECKLIST', 'RECEPTION_CHECKLIST', 'FEEDBACK_FOLLOW_UP');

-- CreateEnum
CREATE TYPE "ProjectContactSide" AS ENUM ('OUR_TEAM', 'CLIENT', 'SUPPLIER');

-- CreateEnum
CREATE TYPE "TaskContactPurpose" AS ENUM ('CLIENT_CONTACT', 'SUPPLIER_CONTACT', 'INFORMED', 'VISITOR');

-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MeetingReviewStatus" AS ENUM ('IN_PROGRESS', 'FINALIZED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReviewRoundStatus" AS ENUM ('PENDING', 'SENT', 'FEEDBACK_RECEIVED', 'FINALIZED');

-- CreateEnum
CREATE TYPE "ReceptionType" AS ENUM ('VISIT', 'EXHIBITION_INVITE', 'BUSINESS_TRIP');

-- CreateEnum
CREATE TYPE "ReceptionStatus" AS ENUM ('PLANNED', 'CONFIRMED', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TagType" AS ENUM ('REGION', 'PROJECT_TYPE', 'TASK_TYPE');

-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('INVITATION', 'EMAIL', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "DisplayMode" AS ENUM ('ZH', 'BILINGUAL');

-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('ORGANIZING', 'TO_SUPPLIER', 'WAITING_SUPPLIER', 'EDITING_REVIEW', 'LEADER_REVIEW', 'TRANSLATION', 'TO_CLIENT', 'SENT_CLIENT', 'OPEN', 'SENT', 'ANSWERED', 'UNCLEAR', 'NEED_MEETING', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "MoneyKind" AS ENUM ('SALARY', 'ADVANCE', 'REIMBURSED', 'OTHER');

-- CreateEnum
CREATE TYPE "GrowthCategory" AS ENUM ('ACHIEVEMENT', 'SKILL', 'LESSON', 'CERTIFICATE', 'NETWORK');

-- CreateTable
CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "accountId" TEXT,
    "id" TEXT NOT NULL,
    "nameZh" TEXT NOT NULL,
    "nameEn" TEXT,
    "clientName" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "plannedStart" TIMESTAMP(3),
    "plannedEnd" TIMESTAMP(3),
    "note" TEXT,
    "regionTagId" TEXT,
    "projectTypeTagId" TEXT,
    "stageTemplateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingProfile" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "currentPhase" TEXT NOT NULL DEFAULT '课程大纲',
    "clientContactName" TEXT,
    "clientContactInfo" TEXT,
    "topicSource" TEXT,
    "topicCount" INTEGER,
    "participantCount" INTEGER,
    "totalDays" DOUBLE PRECISION,
    "dailyHours" DOUBLE PRECISION,
    "location" TEXT,
    "budget" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "costOwnership" TEXT,
    "internalCostNote" TEXT,
    "quoteRound" INTEGER NOT NULL DEFAULT 1,
    "internalContractStatus" TEXT,
    "clientContractStatus" TEXT,
    "depositNote" TEXT,
    "prepaymentPercent" DOUBLE PRECISION,
    "paymentMilestones" TEXT,
    "reportingStatus" TEXT,
    "postponed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingChecklistItem" (
    "id" TEXT NOT NULL,
    "trainingProfileId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "accountId" TEXT,
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "title" TEXT,
    "email" TEXT,
    "wechat" TEXT,
    "note" TEXT,
    "regionTagId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ContactRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactRoleMap" (
    "contactId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "ContactRoleMap_pkey" PRIMARY KEY ("contactId","roleId")
);

-- CreateTable
CREATE TABLE "TeamMemberProfile" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "capacityNote" TEXT,

    CONSTRAINT "TeamMemberProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectContact" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "side" "ProjectContactSide" NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,

    CONSTRAINT "ProjectContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StageTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "projectTypeTagId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StageTemplateItem" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "description" TEXT,

    CONSTRAINT "StageTemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectStage" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sourceTemplateItemId" TEXT,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "plannedStart" TIMESTAMP(3),
    "plannedEnd" TIMESTAMP(3),
    "actualCompleted" TIMESTAMP(3),
    "status" "StageStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StageContact" (
    "stageId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "roleNote" TEXT,

    CONSTRAINT "StageContact_pkey" PRIMARY KEY ("stageId","contactId")
);

-- CreateTable
CREATE TABLE "Task" (
    "accountId" TEXT,
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "stageId" TEXT,
    "typeTagId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "waitingOn" TEXT,
    "sendChannel" TEXT,
    "originalStatusNote" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "source" "TaskSource" NOT NULL DEFAULT 'MANUAL',
    "sourceRefId" TEXT,
    "sourceLabel" TEXT,
    "dueDate" TIMESTAMP(3),
    "assigneeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskContact" (
    "taskId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "purpose" "TaskContactPurpose" NOT NULL,

    CONSTRAINT "TaskContact_pkey" PRIMARY KEY ("taskId","contactId","purpose")
);

-- CreateTable
CREATE TABLE "ProjectFile" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "stageId" TEXT,
    "fileTypeId" TEXT,
    "name" TEXT NOT NULL,
    "version" TEXT,
    "status" "FileStatus" NOT NULL DEFAULT 'DRAFT',
    "url" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingReview" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "stageId" TEXT,
    "title" TEXT NOT NULL,
    "status" "MeetingReviewStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "finalFileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingReviewRound" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "roundNo" INTEGER NOT NULL,
    "senderContactId" TEXT,
    "receiverContactId" TEXT,
    "sentAt" TIMESTAMP(3),
    "feedback" TEXT,
    "status" "ReviewRoundStatus" NOT NULL DEFAULT 'PENDING',
    "finalizedAt" TIMESTAMP(3),

    CONSTRAINT "MeetingReviewRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reception" (
    "accountId" TEXT,
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "type" "ReceptionType" NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT,
    "purpose" TEXT,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "status" "ReceptionStatus" NOT NULL DEFAULT 'PLANNED',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reception_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceptionChecklistItem" (
    "id" TEXT NOT NULL,
    "receptionId" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT,
    "dueDate" TEXT,
    "note" TEXT,
    "isMine" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReceptionChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceptionVisitor" (
    "receptionId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,

    CONSTRAINT "ReceptionVisitor_pkey" PRIMARY KEY ("receptionId","contactId")
);

-- CreateTable
CREATE TABLE "TimelineEvent" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "action" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "type" "TagType" NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FileType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TextTemplate" (
    "accountId" TEXT,
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TemplateType" NOT NULL,
    "content" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TextTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppPreference" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "displayMode" "DisplayMode" NOT NULL DEFAULT 'ZH',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeNote" (
    "accountId" TEXT,
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "url" TEXT,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackQuestion" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT '甲方',
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "note" TEXT,
    "followUpTaskId" TEXT,
    "status" "QuestionStatus" NOT NULL DEFAULT 'ORGANIZING',
    "background" TEXT,
    "supplierQuestion" TEXT,
    "supplierReply" TEXT,
    "sunnyJudgment" TEXT,
    "followUpLog" TEXT,
    "finalReplyZh" TEXT,
    "finalReplyEn" TEXT,
    "internalNote" TEXT,
    "ownerContactId" TEXT,
    "dueAt" TIMESTAMP(3),
    "questionAt" TIMESTAMP(3),
    "plannedSupplierSendAt" TIMESTAMP(3),
    "supplierSentAt" TIMESTAMP(3),
    "expectedReplyAt" TIMESTAMP(3),
    "actualReplyAt" TIMESTAMP(3),
    "leaderReviewedAt" TIMESTAMP(3),
    "translatedAt" TIMESTAMP(3),
    "clientSentAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "sendChannel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleBlock" (
    "accountId" TEXT,
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "startMin" INTEGER NOT NULL,
    "endMin" INTEGER NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'work',
    "location" TEXT,
    "participants" TEXT,
    "note" TEXT,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoneyRecord" (
    "accountId" TEXT,
    "id" TEXT NOT NULL,
    "kind" "MoneyKind" NOT NULL DEFAULT 'ADVANCE',
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "happenedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MoneyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrowthLog" (
    "accountId" TEXT,
    "id" TEXT NOT NULL,
    "category" "GrowthCategory" NOT NULL DEFAULT 'ACHIEVEMENT',
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "projectId" TEXT,
    "happenedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrowthLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumePoint" (
    "accountId" TEXT,
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "chinese" TEXT NOT NULL,
    "english" TEXT NOT NULL,
    "sourceNote" TEXT,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumePoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "accountId" TEXT,
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '其他',
    "url" TEXT,
    "note" TEXT,
    "important" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Account_email_key" ON "Account"("email");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_regionTagId_idx" ON "Project"("regionTagId");

-- CreateIndex
CREATE INDEX "Project_projectTypeTagId_idx" ON "Project"("projectTypeTagId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingProfile_projectId_key" ON "TrainingProfile"("projectId");

-- CreateIndex
CREATE INDEX "TrainingProfile_currentPhase_idx" ON "TrainingProfile"("currentPhase");

-- CreateIndex
CREATE INDEX "TrainingProfile_postponed_idx" ON "TrainingProfile"("postponed");

-- CreateIndex
CREATE INDEX "TrainingChecklistItem_trainingProfileId_section_sortOrder_idx" ON "TrainingChecklistItem"("trainingProfileId", "section", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingChecklistItem_trainingProfileId_section_label_key" ON "TrainingChecklistItem"("trainingProfileId", "section", "label");

-- CreateIndex
CREATE INDEX "Contact_regionTagId_idx" ON "Contact"("regionTagId");

-- CreateIndex
CREATE UNIQUE INDEX "ContactRole_name_key" ON "ContactRole"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMemberProfile_contactId_key" ON "TeamMemberProfile"("contactId");

-- CreateIndex
CREATE INDEX "ProjectContact_projectId_side_idx" ON "ProjectContact"("projectId", "side");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectContact_projectId_contactId_side_key" ON "ProjectContact"("projectId", "contactId", "side");

-- CreateIndex
CREATE UNIQUE INDEX "StageTemplateItem_templateId_sortOrder_key" ON "StageTemplateItem"("templateId", "sortOrder");

-- CreateIndex
CREATE INDEX "ProjectStage_projectId_status_idx" ON "ProjectStage"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectStage_projectId_sortOrder_key" ON "ProjectStage"("projectId", "sortOrder");

-- CreateIndex
CREATE INDEX "Task_projectId_status_idx" ON "Task"("projectId", "status");

-- CreateIndex
CREATE INDEX "Task_stageId_idx" ON "Task"("stageId");

-- CreateIndex
CREATE INDEX "Task_assigneeId_idx" ON "Task"("assigneeId");

-- CreateIndex
CREATE INDEX "Task_source_status_idx" ON "Task"("source", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Task_source_sourceRefId_key" ON "Task"("source", "sourceRefId");

-- CreateIndex
CREATE INDEX "ProjectFile_projectId_idx" ON "ProjectFile"("projectId");

-- CreateIndex
CREATE INDEX "ProjectFile_stageId_idx" ON "ProjectFile"("stageId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingReviewRound_reviewId_roundNo_key" ON "MeetingReviewRound"("reviewId", "roundNo");

-- CreateIndex
CREATE INDEX "ReceptionChecklistItem_receptionId_idx" ON "ReceptionChecklistItem"("receptionId");

-- CreateIndex
CREATE INDEX "TimelineEvent_projectId_createdAt_idx" ON "TimelineEvent"("projectId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_type_name_key" ON "Tag"("type", "name");

-- CreateIndex
CREATE UNIQUE INDEX "FileType_name_key" ON "FileType"("name");

-- CreateIndex
CREATE INDEX "KnowledgeNote_topic_idx" ON "KnowledgeNote"("topic");

-- CreateIndex
CREATE UNIQUE INDEX "FeedbackQuestion_followUpTaskId_key" ON "FeedbackQuestion"("followUpTaskId");

-- CreateIndex
CREATE INDEX "FeedbackQuestion_projectId_status_idx" ON "FeedbackQuestion"("projectId", "status");

-- CreateIndex
CREATE INDEX "FeedbackQuestion_archivedAt_idx" ON "FeedbackQuestion"("archivedAt");

-- CreateIndex
CREATE INDEX "ScheduleBlock_date_idx" ON "ScheduleBlock"("date");

-- CreateIndex
CREATE INDEX "MoneyRecord_kind_idx" ON "MoneyRecord"("kind");

-- CreateIndex
CREATE INDEX "GrowthLog_category_idx" ON "GrowthLog"("category");

-- CreateIndex
CREATE INDEX "ResumePoint_projectId_idx" ON "ResumePoint"("projectId");

-- CreateIndex
CREATE INDEX "ResumePoint_updatedAt_idx" ON "ResumePoint"("updatedAt");

-- CreateIndex
CREATE INDEX "Resource_category_idx" ON "Resource"("category");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_regionTagId_fkey" FOREIGN KEY ("regionTagId") REFERENCES "Tag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_projectTypeTagId_fkey" FOREIGN KEY ("projectTypeTagId") REFERENCES "Tag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_stageTemplateId_fkey" FOREIGN KEY ("stageTemplateId") REFERENCES "StageTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingProfile" ADD CONSTRAINT "TrainingProfile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingChecklistItem" ADD CONSTRAINT "TrainingChecklistItem_trainingProfileId_fkey" FOREIGN KEY ("trainingProfileId") REFERENCES "TrainingProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_regionTagId_fkey" FOREIGN KEY ("regionTagId") REFERENCES "Tag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactRoleMap" ADD CONSTRAINT "ContactRoleMap_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactRoleMap" ADD CONSTRAINT "ContactRoleMap_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "ContactRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMemberProfile" ADD CONSTRAINT "TeamMemberProfile_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectContact" ADD CONSTRAINT "ProjectContact_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectContact" ADD CONSTRAINT "ProjectContact_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageTemplate" ADD CONSTRAINT "StageTemplate_projectTypeTagId_fkey" FOREIGN KEY ("projectTypeTagId") REFERENCES "Tag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageTemplateItem" ADD CONSTRAINT "StageTemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "StageTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectStage" ADD CONSTRAINT "ProjectStage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectStage" ADD CONSTRAINT "ProjectStage_sourceTemplateItemId_fkey" FOREIGN KEY ("sourceTemplateItemId") REFERENCES "StageTemplateItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageContact" ADD CONSTRAINT "StageContact_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "ProjectStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageContact" ADD CONSTRAINT "StageContact_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "ProjectStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_typeTagId_fkey" FOREIGN KEY ("typeTagId") REFERENCES "Tag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskContact" ADD CONSTRAINT "TaskContact_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskContact" ADD CONSTRAINT "TaskContact_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectFile" ADD CONSTRAINT "ProjectFile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectFile" ADD CONSTRAINT "ProjectFile_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "ProjectStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectFile" ADD CONSTRAINT "ProjectFile_fileTypeId_fkey" FOREIGN KEY ("fileTypeId") REFERENCES "FileType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingReview" ADD CONSTRAINT "MeetingReview_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingReview" ADD CONSTRAINT "MeetingReview_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "ProjectStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingReview" ADD CONSTRAINT "MeetingReview_finalFileId_fkey" FOREIGN KEY ("finalFileId") REFERENCES "ProjectFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingReviewRound" ADD CONSTRAINT "MeetingReviewRound_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "MeetingReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingReviewRound" ADD CONSTRAINT "MeetingReviewRound_senderContactId_fkey" FOREIGN KEY ("senderContactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingReviewRound" ADD CONSTRAINT "MeetingReviewRound_receiverContactId_fkey" FOREIGN KEY ("receiverContactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reception" ADD CONSTRAINT "Reception_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reception" ADD CONSTRAINT "Reception_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceptionChecklistItem" ADD CONSTRAINT "ReceptionChecklistItem_receptionId_fkey" FOREIGN KEY ("receptionId") REFERENCES "Reception"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceptionVisitor" ADD CONSTRAINT "ReceptionVisitor_receptionId_fkey" FOREIGN KEY ("receptionId") REFERENCES "Reception"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceptionVisitor" ADD CONSTRAINT "ReceptionVisitor_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextTemplate" ADD CONSTRAINT "TextTemplate_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeNote" ADD CONSTRAINT "KnowledgeNote_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeNote" ADD CONSTRAINT "KnowledgeNote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackQuestion" ADD CONSTRAINT "FeedbackQuestion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackQuestion" ADD CONSTRAINT "FeedbackQuestion_followUpTaskId_fkey" FOREIGN KEY ("followUpTaskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleBlock" ADD CONSTRAINT "ScheduleBlock_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleBlock" ADD CONSTRAINT "ScheduleBlock_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyRecord" ADD CONSTRAINT "MoneyRecord_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrowthLog" ADD CONSTRAINT "GrowthLog_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrowthLog" ADD CONSTRAINT "GrowthLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumePoint" ADD CONSTRAINT "ResumePoint_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumePoint" ADD CONSTRAINT "ResumePoint_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
