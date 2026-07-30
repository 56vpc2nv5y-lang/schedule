import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const statements = [
  `ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'NOT_STARTED'`,
  `ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'SELF_CHECK'`,
  `ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'LEADER_REVIEW'`,
  `ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'WAITING_EXTERNAL'`,
  `ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'READY_TO_SEND'`,
  `ALTER TYPE "QuestionStatus" ADD VALUE IF NOT EXISTS 'ORGANIZING'`,
  `ALTER TYPE "QuestionStatus" ADD VALUE IF NOT EXISTS 'TO_SUPPLIER'`,
  `ALTER TYPE "QuestionStatus" ADD VALUE IF NOT EXISTS 'WAITING_SUPPLIER'`,
  `ALTER TYPE "QuestionStatus" ADD VALUE IF NOT EXISTS 'EDITING_REVIEW'`,
  `ALTER TYPE "QuestionStatus" ADD VALUE IF NOT EXISTS 'LEADER_REVIEW'`,
  `ALTER TYPE "QuestionStatus" ADD VALUE IF NOT EXISTS 'TRANSLATION'`,
  `ALTER TYPE "QuestionStatus" ADD VALUE IF NOT EXISTS 'TO_CLIENT'`,
  `ALTER TYPE "QuestionStatus" ADD VALUE IF NOT EXISTS 'SENT_CLIENT'`,
  `ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "waitingOn" TEXT`,
  `ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "sendChannel" TEXT`,
  `ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "originalStatusNote" TEXT`,
  `ALTER TABLE "Task" ALTER COLUMN "status" SET DEFAULT 'NOT_STARTED'::"TaskStatus"`,
  `ALTER TABLE "FeedbackQuestion" ADD COLUMN IF NOT EXISTS "background" TEXT`,
  `ALTER TABLE "FeedbackQuestion" ADD COLUMN IF NOT EXISTS "supplierQuestion" TEXT`,
  `ALTER TABLE "FeedbackQuestion" ADD COLUMN IF NOT EXISTS "supplierReply" TEXT`,
  `ALTER TABLE "FeedbackQuestion" ADD COLUMN IF NOT EXISTS "sunnyJudgment" TEXT`,
  `ALTER TABLE "FeedbackQuestion" ADD COLUMN IF NOT EXISTS "followUpLog" TEXT`,
  `ALTER TABLE "FeedbackQuestion" ADD COLUMN IF NOT EXISTS "finalReplyZh" TEXT`,
  `ALTER TABLE "FeedbackQuestion" ADD COLUMN IF NOT EXISTS "finalReplyEn" TEXT`,
  `ALTER TABLE "FeedbackQuestion" ADD COLUMN IF NOT EXISTS "internalNote" TEXT`,
  `ALTER TABLE "FeedbackQuestion" ADD COLUMN IF NOT EXISTS "ownerContactId" TEXT`,
  `ALTER TABLE "FeedbackQuestion" ADD COLUMN IF NOT EXISTS "dueAt" TIMESTAMP(3)`,
  `ALTER TABLE "FeedbackQuestion" ADD COLUMN IF NOT EXISTS "questionAt" TIMESTAMP(3)`,
  `ALTER TABLE "FeedbackQuestion" ADD COLUMN IF NOT EXISTS "plannedSupplierSendAt" TIMESTAMP(3)`,
  `ALTER TABLE "FeedbackQuestion" ADD COLUMN IF NOT EXISTS "supplierSentAt" TIMESTAMP(3)`,
  `ALTER TABLE "FeedbackQuestion" ADD COLUMN IF NOT EXISTS "expectedReplyAt" TIMESTAMP(3)`,
  `ALTER TABLE "FeedbackQuestion" ADD COLUMN IF NOT EXISTS "actualReplyAt" TIMESTAMP(3)`,
  `ALTER TABLE "FeedbackQuestion" ADD COLUMN IF NOT EXISTS "leaderReviewedAt" TIMESTAMP(3)`,
  `ALTER TABLE "FeedbackQuestion" ADD COLUMN IF NOT EXISTS "translatedAt" TIMESTAMP(3)`,
  `ALTER TABLE "FeedbackQuestion" ADD COLUMN IF NOT EXISTS "clientSentAt" TIMESTAMP(3)`,
  `ALTER TABLE "FeedbackQuestion" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3)`,
  `ALTER TABLE "FeedbackQuestion" ADD COLUMN IF NOT EXISTS "sendChannel" TEXT`,
  `ALTER TABLE "FeedbackQuestion" ALTER COLUMN "status" SET DEFAULT 'ORGANIZING'::"QuestionStatus"`,
  `CREATE INDEX IF NOT EXISTS "FeedbackQuestion_archivedAt_idx" ON "FeedbackQuestion"("archivedAt")`,
];

async function main() {
  for (const statement of statements) await prisma.$executeRawUnsafe(statement);
  await prisma.$executeRawUnsafe(`UPDATE "Task" SET "originalStatusNote" = COALESCE("originalStatusNote", '旧状态：TODO') WHERE "status" = 'TODO'::"TaskStatus"`);
  await prisma.$executeRawUnsafe(`UPDATE "Task" SET "status" = 'NOT_STARTED'::"TaskStatus" WHERE "status" = 'TODO'::"TaskStatus"`);
  await prisma.$executeRawUnsafe(`UPDATE "Task" SET "waitingOn" = COALESCE("waitingOn", '其他'), "status" = 'WAITING_EXTERNAL'::"TaskStatus" WHERE "status" = 'WAITING'::"TaskStatus"`);
  await prisma.$executeRawUnsafe(`UPDATE "Task" SET "originalStatusNote" = COALESCE("originalStatusNote", '旧状态：OVERDUE（逾期由截止日期计算）'), "status" = 'NOT_STARTED'::"TaskStatus" WHERE "status" = 'OVERDUE'::"TaskStatus"`);
  await prisma.$executeRawUnsafe(`UPDATE "FeedbackQuestion" SET "status" = CASE "status" WHEN 'OPEN'::"QuestionStatus" THEN 'ORGANIZING'::"QuestionStatus" WHEN 'SENT'::"QuestionStatus" THEN 'WAITING_SUPPLIER'::"QuestionStatus" WHEN 'ANSWERED'::"QuestionStatus" THEN 'EDITING_REVIEW'::"QuestionStatus" WHEN 'UNCLEAR'::"QuestionStatus" THEN 'WAITING_SUPPLIER'::"QuestionStatus" WHEN 'NEED_MEETING'::"QuestionStatus" THEN 'LEADER_REVIEW'::"QuestionStatus" WHEN 'CONFIRMED'::"QuestionStatus" THEN 'SENT_CLIENT'::"QuestionStatus" ELSE "status" END`);
  await prisma.$executeRawUnsafe(`UPDATE "FeedbackQuestion" SET "clientSentAt" = COALESCE("clientSentAt", "updatedAt"), "archivedAt" = COALESCE("archivedAt", "updatedAt") WHERE "status" = 'SENT_CLIENT'::"QuestionStatus"`);
  console.log("workflow-v3 migration applied");
}

main().finally(() => prisma.$disconnect());