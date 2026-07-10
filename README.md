# 项目跟踪看板

面向技术合作中间商的个人工作台：项目全生命周期（商机 → 报价 → 方案 → 纪要 → 合同 → 交付 → 验收 → 售后）+ 出差接待 + 个人杂事 + 职业成长档案，一站管理。

## 技术栈

- Next.js App Router + TypeScript
- Tailwind CSS v4
- Prisma ORM
- Vercel Postgres 或 Supabase Postgres
- 单人使用场景，预留 `APP_PASSWORD` 简单密码保护

## 本地运行

**不会命令行？** 双击项目文件夹里的 `start.bat` 即可（自动装依赖 + 启动 + 打开浏览器）。
连好 Supabase 后建表/同步表结构：双击 `db-init.bat`。

等价的手动命令：

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

## 数据库

复制 `.env.example` 为 `.env`，填入 Supabase 的 `DATABASE_URL` 和 `DIRECT_URL`。部署到 Vercel 时，在 Project Settings 的 Environment Variables 中配置同名变量。

```bash
npm.cmd run prisma:generate
npm.cmd run prisma:validate
npm.cmd exec prisma db push
```

详细步骤见 [docs/SUPABASE_VERCEL_GUIDE.md](docs/SUPABASE_VERCEL_GUIDE.md)。

## 部署清单（GitHub + Vercel + Supabase）

1. 在 [supabase.com](https://supabase.com) 创建免费项目，拿到 `DATABASE_URL`（连接池地址）和 `DIRECT_URL`（直连地址），填进本地 `.env`。
2. 本地执行一次建表：

```bash
npm.cmd run prisma:generate
npm.cmd exec prisma db push
```

3. 提交并推送到 GitHub：

```bash
git add .
git commit -m "Project tracker"
git push
```

4. 在 [vercel.com](https://vercel.com) 用 GitHub 登录 → Import 该仓库。
5. 在 Vercel 的 Environment Variables 里配置：`DATABASE_URL`、`DIRECT_URL`、`APP_PASSWORD`（登录密码，务必改掉默认值）；用 AI 助手再加 `DEEPSEEK_API_KEY`；要传文件本体再加 Supabase Storage 三个变量。
6. 构建命令保持默认 `npm run build`，Deploy 即可。
7. 以后每次改了 `prisma/schema.prisma`，先本地 `prisma db push` 再推代码。

## 当前版本说明

当前版本已经支持 Supabase/Postgres 数据库优先读取；未配置数据库时自动显示 `src/lib/default-data.ts` 中的演示数据。连接 Supabase 后可录入真实数据。

已可用功能：

- **工作台**（`/`）：项目进展一览（当前阶段 + 进度 + 逾期提示）、未来 14 天日程、逾期与杂事提醒、全生命周期甘特图
- 联系人、项目、任务录入（自动按阶段模板生成阶段），任务可直接改状态/删除
- **个人杂事**：任务可以不挂项目（报销、入职手续等），同样出现在工作台和日历
- **成长档案**（`/growth`）：记录成果亮点、技能、复盘、证书、人脉，为写简历/跳槽积累素材
- **月历视图**（`/calendar`）：Outlook 风格月历方格，任务截止 + 出差/接待/展会同屏，跨天安排连续显示
- **出差 / 接待 / 展会**（`/receptions`）：三种类型分开管理，字段随类型区分（出差记目的地与拜访对象，接待记来访嘉宾）
- **文件库**：两种方式——「贴链接」随时可用；配好 Supabase Storage 后可「上传文件本体」

文件上传需要额外的 `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、`SUPABASE_STORAGE_BUCKET` 环境变量，详见 [docs/SUPABASE_VERCEL_GUIDE.md](docs/SUPABASE_VERCEL_GUIDE.md) 第 10 步。只贴链接则无需配置。
