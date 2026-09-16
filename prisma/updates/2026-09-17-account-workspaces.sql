-- 账号与工作区字段升级。
-- 在 Supabase SQL Editor 中执行一次；语句可重复执行，不会清空现有业务数据。

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

CREATE UNIQUE INDEX IF NOT EXISTS "Account_email_key" ON "Account"("email");

ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "accountId" TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "accountId" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "accountId" TEXT;
ALTER TABLE "Reception" ADD COLUMN IF NOT EXISTS "accountId" TEXT;
ALTER TABLE "TextTemplate" ADD COLUMN IF NOT EXISTS "accountId" TEXT;
ALTER TABLE "KnowledgeNote" ADD COLUMN IF NOT EXISTS "accountId" TEXT;
ALTER TABLE "ScheduleBlock" ADD COLUMN IF NOT EXISTS "accountId" TEXT;
ALTER TABLE "MoneyRecord" ADD COLUMN IF NOT EXISTS "accountId" TEXT;
ALTER TABLE "GrowthLog" ADD COLUMN IF NOT EXISTS "accountId" TEXT;
ALTER TABLE "ResumePoint" ADD COLUMN IF NOT EXISTS "accountId" TEXT;
ALTER TABLE "Resource" ADD COLUMN IF NOT EXISTS "accountId" TEXT;

ALTER TABLE "TrainingProfile" ALTER COLUMN "currentPhase" SET DEFAULT '课程大纲';
ALTER TABLE "FeedbackQuestion" ALTER COLUMN "source" SET DEFAULT '甲方';
ALTER TABLE "Resource" ALTER COLUMN "category" SET DEFAULT '其他';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Project_accountId_fkey') THEN
    ALTER TABLE "Project" ADD CONSTRAINT "Project_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Contact_accountId_fkey') THEN
    ALTER TABLE "Contact" ADD CONSTRAINT "Contact_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Task_accountId_fkey') THEN
    ALTER TABLE "Task" ADD CONSTRAINT "Task_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Reception_accountId_fkey') THEN
    ALTER TABLE "Reception" ADD CONSTRAINT "Reception_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TextTemplate_accountId_fkey') THEN
    ALTER TABLE "TextTemplate" ADD CONSTRAINT "TextTemplate_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'KnowledgeNote_accountId_fkey') THEN
    ALTER TABLE "KnowledgeNote" ADD CONSTRAINT "KnowledgeNote_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ScheduleBlock_accountId_fkey') THEN
    ALTER TABLE "ScheduleBlock" ADD CONSTRAINT "ScheduleBlock_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MoneyRecord_accountId_fkey') THEN
    ALTER TABLE "MoneyRecord" ADD CONSTRAINT "MoneyRecord_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GrowthLog_accountId_fkey') THEN
    ALTER TABLE "GrowthLog" ADD CONSTRAINT "GrowthLog_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ResumePoint_accountId_fkey') THEN
    ALTER TABLE "ResumePoint" ADD CONSTRAINT "ResumePoint_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Resource_accountId_fkey') THEN
    ALTER TABLE "Resource" ADD CONSTRAINT "Resource_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;
