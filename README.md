# 项目跟踪看板

面向技术合作中间商的项目控制台：覆盖商机、供应商沟通、报价、方案、会议纪要、合同、交付、验收、售后和归档。

## 技术栈

- Next.js App Router + TypeScript
- Tailwind CSS v4
- Prisma ORM
- Vercel Postgres 或 Supabase Postgres
- 单人使用场景，预留 `APP_PASSWORD` 简单密码保护

## 本地运行

```bash
npm.cmd install
npm.cmd run dev
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

## Git 与 Vercel 部署

1. 初始化 Git 并提交：

```bash
git init
git add .
git commit -m "Initial project tracker app"
```

2. 推送到 GitHub/GitLab。
3. 在 Vercel 导入该仓库。
4. 添加环境变量：`DATABASE_URL`、`APP_PASSWORD`。
5. 构建命令使用默认 `npm run build` 即可。

## 当前版本说明

当前版本已经支持 Supabase/Postgres 数据库优先读取；未配置数据库时自动显示 `src/lib/default-data.ts` 中的演示数据。连接 Supabase 后，可在联系人、项目、任务页面录入真实数据。
