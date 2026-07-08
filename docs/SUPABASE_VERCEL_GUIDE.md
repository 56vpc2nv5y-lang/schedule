# Supabase + Vercel 免费版部署手册

这份手册按“第一次做也能照着操作”的粒度写。你目前数据还少，完全可以先用免费版慢慢填，不需要一上来买数据库。

## 现在到底需不需要新建数据库？

如果只是看界面：不需要。直接运行 `npm.cmd run dev`，页面会显示演示数据。

如果你要真实保存联系人、项目、任务：需要。因为数据不能只放浏览器里，否则换电脑、清缓存、部署到 Vercel 后都不可靠。这个项目推荐用 Supabase 的免费 Postgres 数据库。

## 当前应用支持什么写入？

连接 Supabase 之后，你可以在看板里慢慢加：

- 联系人：`/contacts`
- 项目：`/projects`
- 任务：`/tasks`
- 默认配置初始化：`/settings`

新增项目时会自动按“标准技术合作项目模板”生成阶段。

## 第 1 步：创建 Supabase 免费项目

1. 打开 [Supabase](https://supabase.com)。
2. 注册或登录。
3. 新建 Organization，选择 Free plan。
4. 新建 Project。
5. 记住数据库密码，后面要用。如果忘了，可以在 Supabase 后台重置。

项目名可以写：

```txt
schedule-project-tracker
```

地区选离你常用位置近的即可，例如 Singapore / Tokyo / Hong Kong 附近可用区域。

## 第 2 步：创建 Prisma 专用数据库用户

进入 Supabase 项目后台：

1. 左侧打开 `SQL Editor`。
2. 新建 SQL 查询。
3. 打开本项目文件 [prisma/supabase-prisma-user.sql](../prisma/supabase-prisma-user.sql)。
4. 把里面的 `CHANGE_ME_TO_A_LONG_RANDOM_PASSWORD` 改成一个很长的密码。
5. 在 Supabase SQL Editor 里运行。

建议密码格式：

```txt
Prisma_2026_very_long_random_password_here
```

保存好这个密码，下面连接串要用。

## 第 3 步：复制 Supabase 连接串

进入 Supabase 项目：

1. 左侧打开 `Project Settings`。
2. 打开 `Database`。
3. 找到 `Connection string` 或 `Connection pooling`。
4. 你需要两条连接：

```env
DATABASE_URL=给应用运行时使用，建议 Transaction pooler，通常端口是 6543
DIRECT_URL=给 Prisma 建表/迁移使用，建议 Session pooler 或 Direct connection，通常端口是 5432
```

示例格式如下，实际要替换成你的项目 ref、地区、密码：

```env
DATABASE_URL="postgresql://prisma.PROJECT_REF:PASSWORD@REGION.pooler.supabase.com:6543/postgres?schema=public&pgbouncer=true"
DIRECT_URL="postgresql://prisma.PROJECT_REF:PASSWORD@REGION.pooler.supabase.com:5432/postgres?schema=public"
```

注意：

- 用户名建议用前面 SQL 创建的 `prisma.PROJECT_REF`。
- `PASSWORD` 是你给 prisma 用户设置的密码。
- 如果 Supabase 后台提供 `Prisma` 专用连接串，优先复制它。
- 不要把真实 `.env` 提交到 Git。

## 第 4 步：本地填写环境变量

在项目根目录 `D:\gsafety\schedule` 新建或编辑 `.env`：

```env
DATABASE_URL="你的 Supabase transaction pooler 连接串"
DIRECT_URL="你的 Supabase session/direct 连接串"
APP_PASSWORD="自己设置一个访问密码"
```

然后运行：

```powershell
npm.cmd run prisma:validate
npm.cmd run prisma:generate
npm.cmd exec prisma db push
```

`db push` 会把 Prisma schema 里的表结构创建到 Supabase 数据库里。

## 第 5 步：初始化默认配置

启动本地项目：

```powershell
npm.cmd run dev
```

打开：

```txt
http://localhost:3000/settings
```

点击：

```txt
初始化默认配置
```

这会写入：

- 默认 12 个阶段模板
- 地区标签
- 任务类型
- 联系人角色
- 文件类型

## 第 6 步：开始录入真实数据

建议顺序：

1. 先去 `/contacts` 新增联系人。
2. 再去 `/projects` 新建项目。
3. 最后去 `/tasks` 给项目加任务。

你不需要一次把所有历史数据补齐。每天推进项目时顺手填一点就好。

## 第 7 步：提交到 Git

如果还没绑定 GitHub，先在 GitHub 创建一个空仓库，例如：

```txt
schedule-project-tracker
```

本地运行：

```powershell
git add .
git commit -m "Initial project tracker app"
git branch -M main
git remote add origin https://github.com/YOUR_NAME/schedule-project-tracker.git
git push -u origin main
```

如果 `git remote add origin` 提示已经存在，运行：

```powershell
git remote set-url origin https://github.com/YOUR_NAME/schedule-project-tracker.git
git push -u origin main
```

## 第 8 步：Vercel 导入项目

1. 打开 [Vercel](https://vercel.com)。
2. 登录后选择 `Add New...`。
3. 选择 `Project`。
4. 导入你的 GitHub 仓库。
5. Framework Preset 选择 `Next.js`，一般会自动识别。
6. Build Command 保持：

```txt
npm run build
```

7. Install Command 保持：

```txt
npm install
```

8. 添加 Environment Variables：

```env
DATABASE_URL="你的 Supabase transaction pooler 连接串"
DIRECT_URL="你的 Supabase session/direct 连接串"
APP_PASSWORD="你自己的访问密码"
```

9. 点击 Deploy。

## 第 9 步：部署后检查

部署成功后打开 Vercel 给你的网址。

检查这些页面：

- `/`
- `/contacts`
- `/projects`
- `/tasks`
- `/settings`

如果新增数据不保存，优先检查：

1. Vercel 里有没有填 `DATABASE_URL` 和 `DIRECT_URL`。
2. 本地有没有运行过 `npm.cmd exec prisma db push`。
3. Supabase SQL Editor 里有没有创建 `prisma` 用户。
4. 连接串里的密码有没有 URL 编码问题。如果密码包含 `@`、`#`、`%` 等符号，建议改成只含字母、数字、下划线的长密码。

## 免费版注意事项

- Supabase 免费版适合你现在这种刚开始录入、数据很少的阶段。
- Vercel Hobby 免费版适合个人项目和小规模使用。
- 暂时不要购买任何付费 add-on。
- 如果以后数据量、访问量、团队协作变大，再考虑升级。

## 以后可以继续补的功能

当前已经能录入联系人、项目、任务。下一步可以继续做：

- 项目阶段编辑
- 文件库上传
- 会议纪要轮次新增/定稿入库
- 接待安排新增
- 简单密码登录真正生效
- 数据 JSON 导出/导入
