-- ============================================================
-- 数据库表 / 字段中文注释（表注 DDL）
--
-- 用法：先用 `prisma db push` 建好表，再把本文件全文粘贴到
--       Supabase → SQL Editor 运行一次。之后 Supabase 表格编辑器
--       里每张表、每个字段都会显示中文说明。
--
-- 说明：表名 / 字段名区分大小写，必须带双引号（Prisma 默认 PascalCase / camelCase）。
--       schema 改动后，如新增了表或字段，回来补一条 COMMENT 即可。
-- ============================================================

-- ── 项目 ───────────────────────────────────────────────
COMMENT ON TABLE  "Project"                     IS '项目：一个技术合作项目的主表';
COMMENT ON COLUMN "Project"."nameZh"            IS '项目中文名';
COMMENT ON COLUMN "Project"."nameEn"            IS '项目英文名（选填）';
COMMENT ON COLUMN "Project"."clientName"        IS '甲方名称（境外客户）';
COMMENT ON COLUMN "Project"."status"            IS '状态：ACTIVE进行中/PAUSED暂停/COMPLETED完成/ARCHIVED归档';
COMMENT ON COLUMN "Project"."plannedStart"      IS '计划开始日期';
COMMENT ON COLUMN "Project"."plannedEnd"        IS '计划结束日期';
COMMENT ON COLUMN "Project"."regionTagId"       IS '地区标签，引用 Tag 表';
COMMENT ON COLUMN "Project"."projectTypeTagId"  IS '项目类型标签，引用 Tag 表';
COMMENT ON COLUMN "Project"."stageTemplateId"   IS '生成阶段所用的模板，引用 StageTemplate';
COMMENT ON COLUMN "Project"."note"              IS '备注';

-- ── 联系人（唯一数据源）────────────────────────────────
COMMENT ON TABLE  "Contact"                     IS '联系人库：所有“人”的唯一数据源，别处只引用其 id';
COMMENT ON COLUMN "Contact"."name"              IS '姓名';
COMMENT ON COLUMN "Contact"."organization"      IS '单位（公司/高校/机构）';
COMMENT ON COLUMN "Contact"."title"             IS '职位';
COMMENT ON COLUMN "Contact"."email"             IS '邮箱';
COMMENT ON COLUMN "Contact"."wechat"            IS '微信号';
COMMENT ON COLUMN "Contact"."regionTagId"       IS '所属地区标签，引用 Tag 表';
COMMENT ON COLUMN "Contact"."note"              IS '备注';

COMMENT ON TABLE  "ContactRole"                 IS '联系人角色字典：甲方对接人/供应商对接人/我方团队/来访嘉宾等';
COMMENT ON TABLE  "ContactRoleMap"              IS '联系人-角色 多对多关联（一个联系人可有多个角色）';
COMMENT ON TABLE  "TeamMemberProfile"           IS '我方团队成员档案：标记哪些联系人属于本方团队';

-- ── 项目团队与对接人 ──────────────────────────────────
COMMENT ON TABLE  "ProjectContact"              IS '项目-联系人关联：某项目里我方/甲方/供应商各方的对接人';
COMMENT ON COLUMN "ProjectContact"."side"       IS '所属方：OUR_TEAM我方/CLIENT甲方/SUPPLIER供应商';
COMMENT ON COLUMN "ProjectContact"."isPrimary"  IS '是否主要对接人';

-- ── 阶段模板 ──────────────────────────────────────────
COMMENT ON TABLE  "StageTemplate"               IS '阶段模板：新建项目时一键生成阶段的蓝本';
COMMENT ON TABLE  "StageTemplateItem"           IS '阶段模板的单个阶段项（名称 + 排序）';
COMMENT ON COLUMN "StageTemplateItem"."sortOrder" IS '阶段顺序（从 1 开始）';

-- ── 项目阶段 ──────────────────────────────────────────
COMMENT ON TABLE  "ProjectStage"                IS '项目阶段：具体某项目按模板生成的阶段，可单独改期/改状态';
COMMENT ON COLUMN "ProjectStage"."sortOrder"    IS '阶段顺序';
COMMENT ON COLUMN "ProjectStage"."plannedStart" IS '计划开始日期（甘特图拖动会改这里）';
COMMENT ON COLUMN "ProjectStage"."plannedEnd"   IS '计划结束日期（甘特图拖动会改这里）';
COMMENT ON COLUMN "ProjectStage"."actualCompleted" IS '实际完成日期';
COMMENT ON COLUMN "ProjectStage"."status"       IS '状态：NOT_STARTED未开始/IN_PROGRESS进行中/COMPLETED完成/DELAYED延期';
COMMENT ON COLUMN "ProjectStage"."sourceTemplateItemId" IS '来源模板项，引用 StageTemplateItem';

COMMENT ON TABLE  "StageContact"                IS '阶段-联系人关联：某阶段涉及的对接人';

-- ── 任务 ──────────────────────────────────────────────
COMMENT ON TABLE  "Task"                        IS '任务/事项：挂在项目（可选阶段）下的待办';
COMMENT ON COLUMN "Task"."title"                IS '任务标题';
COMMENT ON COLUMN "Task"."typeTagId"            IS '任务类型标签，引用 Tag 表';
COMMENT ON COLUMN "Task"."status"               IS '状态：TODO待办/IN_PROGRESS进行中/WAITING等待/DONE完成/OVERDUE逾期';
COMMENT ON COLUMN "Task"."priority"             IS '优先级：LOW/MEDIUM/HIGH/URGENT';
COMMENT ON COLUMN "Task"."dueDate"              IS '截止日期（日历拖动会改这里）';
COMMENT ON COLUMN "Task"."assigneeId"           IS '负责人，引用 Contact 表';
COMMENT ON COLUMN "Task"."stageId"              IS '所属阶段，引用 ProjectStage（可空）';

COMMENT ON TABLE  "TaskContact"                 IS '任务-联系人关联：任务涉及的甲方/供应商对接人';
COMMENT ON COLUMN "TaskContact"."purpose"       IS '用途：CLIENT_CONTACT甲方/SUPPLIER_CONTACT供应商/INFORMED知会/VISITOR来访';

-- ── 文件库 ────────────────────────────────────────────
COMMENT ON TABLE  "ProjectFile"                 IS '项目文件库：会议纪要/PPT/合同/验收单等';
COMMENT ON COLUMN "ProjectFile"."name"          IS '文件名';
COMMENT ON COLUMN "ProjectFile"."fileTypeId"    IS '文件类型，引用 FileType 表';
COMMENT ON COLUMN "ProjectFile"."version"       IS '版本号（如 v1.0 / R2）';
COMMENT ON COLUMN "ProjectFile"."status"        IS '状态：DRAFT草稿/IN_REVIEW审阅/APPROVED定稿/ARCHIVED归档';
COMMENT ON COLUMN "ProjectFile"."url"           IS '文件链接（网盘链接或 Supabase Storage 上传后的地址）';
COMMENT ON COLUMN "ProjectFile"."stageId"       IS '关联阶段，引用 ProjectStage（可空）';

COMMENT ON TABLE  "FileType"                     IS '文件类型字典：会议纪要/PPT/合同/邀请函等';

-- ── 会议纪要循环校对 ──────────────────────────────────
COMMENT ON TABLE  "MeetingReview"               IS '会议纪要：多轮往返校对的主记录';
COMMENT ON COLUMN "MeetingReview"."status"      IS '状态：IN_PROGRESS进行中/FINALIZED定稿/ARCHIVED归档';
COMMENT ON COLUMN "MeetingReview"."finalFileId" IS '定稿后关联的文件，引用 ProjectFile';

COMMENT ON TABLE  "MeetingReviewRound"          IS '会议纪要的每一轮：发送方、接收方、反馈、状态';
COMMENT ON COLUMN "MeetingReviewRound"."roundNo"   IS '第几轮';
COMMENT ON COLUMN "MeetingReviewRound"."status"    IS '状态：PENDING待发/SENT已发/FEEDBACK_RECEIVED已反馈/FINALIZED定稿';

-- ── 出差 / 接待 / 展会 ────────────────────────────────
COMMENT ON TABLE  "Reception"                   IS '出差/接待/展会安排';
COMMENT ON COLUMN "Reception"."type"            IS '类型：BUSINESS_TRIP我方出差/VISIT接待来访/EXHIBITION_INVITE展会邀请';
COMMENT ON COLUMN "Reception"."title"           IS '标题';
COMMENT ON COLUMN "Reception"."location"        IS '地点/目的地';
COMMENT ON COLUMN "Reception"."purpose"         IS '事由/目的';
COMMENT ON COLUMN "Reception"."startAt"         IS '开始时间';
COMMENT ON COLUMN "Reception"."endAt"           IS '结束时间';
COMMENT ON COLUMN "Reception"."status"          IS '状态：PLANNED计划/CONFIRMED确认/DONE完成/CANCELLED取消';

COMMENT ON TABLE  "ReceptionVisitor"            IS '出差/接待涉及的人员，引用 Contact';

-- ── 资料库 ────────────────────────────────────────────
COMMENT ON TABLE  "Resource"                    IS '通用资料库：公司模板/报销/接待讲解词等，不挂具体项目';
COMMENT ON COLUMN "Resource"."name"             IS '资料名称';
COMMENT ON COLUMN "Resource"."category"         IS '分类：公司模板/报销/接待讲解/流程制度/对外资料/其他';
COMMENT ON COLUMN "Resource"."url"              IS '网盘/Drive 链接';
COMMENT ON COLUMN "Resource"."important"        IS '是否标为常用/重要（置顶显示）';
COMMENT ON COLUMN "Resource"."note"             IS '备注/用途说明';

-- ── 动态时间线与字典表 ────────────────────────────────
COMMENT ON TABLE  "TimelineEvent"               IS '项目动态时间线：状态变化、创建、改期等自动记录';
COMMENT ON COLUMN "TimelineEvent"."entityType"  IS '关联对象类型，如 Project/Task/ProjectStage';
COMMENT ON COLUMN "TimelineEvent"."action"      IS '动作名，如“阶段改期”“任务创建”';
COMMENT ON COLUMN "TimelineEvent"."message"     IS '展示给用户的中文描述';

COMMENT ON TABLE  "Tag"                          IS '标签字典：地区/项目类型/任务类型';
COMMENT ON COLUMN "Tag"."type"                   IS '标签种类：REGION地区/PROJECT_TYPE项目类型/TASK_TYPE任务类型';

COMMENT ON TABLE  "TextTemplate"                 IS '文本模板：邀请函/邮件等带变量占位符的模板';
COMMENT ON TABLE  "AppPreference"                IS '应用偏好设置（单例）：如中英显示方式';
