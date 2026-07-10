# Supabase + Vercel 免费版部署手册

这份手册按“第一次做也能照着操作”的粒度写。你目前数据还少，完全可以先用免费版慢慢填，不需要一上来买数据库。

## 先分清三个名词：Supabase / Vercel / Firebase

一句话结论：**这个项目用 Supabase（存数据）+ Vercel（跑网站），不要用 Firebase。** 三者都有免费版，但分工不同：

| 名词 | 作用 | 这个项目用它吗 |
| --- | --- | --- |
| **Vercel** | 放网站、跑 Next.js 代码，给你一个公开网址 | ✅ 用来部署 |
| **Supabase** | 数据库（Postgres）+ 文件存储 | ✅ 存联系人/项目/任务/文件 |
| **Firebase** | 谷歌家的一套后端（数据库是文档型 Firestore） | ❌ 不用 |

为什么不用 Firebase：本项目的数据是**关系型**的（项目↔联系人↔任务互相用 ID 引用，Prisma + Postgres）。Supabase 本身就是 Postgres，天生匹配，改动最小。Firebase 的 Firestore 是文档型数据库，套进来要把整套数据层重写，对新手反而更难、更容易出错。两者免费额度都够你现在用，所以按“省事、匹配”选 Supabase。

整体流程就三大步：**① 建 Supabase 数据库 → ② 代码传到 GitHub → ③ Vercel 导入并填环境变量**。下面逐步来。

## 开始前先看这段（新手心态）

- 全程大约 **30–40 分钟**，第一次慢一点正常。
- 你**弄不坏**任何东西：Supabase / Vercel / GitHub 都能免费重来，删了重建即可。
- 你会不断遇到"复制一串很长的字符串，粘贴到另一个地方"——这就是配置的全部，别被吓到。
- 需要先注册 **3 个免费账号**（都可以用同一个邮箱/GitHub 登录，省事）：
  1. **GitHub** — <https://github.com> ，放代码
  2. **Supabase** — <https://supabase.com> ，放数据库
  3. **Vercel** — <https://vercel.com> ，放网站（注册时直接选 "Continue with GitHub" 最省事）
- 建议全程开着两个浏览器标签页：一个 Supabase 后台，一个本项目的 `.env` 文件。

### 几个词先认识一下（看不懂就先跳过）

| 词 | 大白话 |
| --- | --- |
| 环境变量 / Environment Variables | 一堆"名字=值"的配置，比如数据库地址、密码。放在 `.env` 文件和 Vercel 后台 |
| 连接串 / Connection String | 一长串 `postgresql://...`，是"数据库的地址+账号密码"打包在一起 |
| `.env` 文件 | 项目根目录里一个专门放密码的文件，**绝不能上传到 GitHub** |
| 部署 / Deploy | 把代码变成一个别人能打开的网址 |
| Push / 推送 | 把本地代码上传到 GitHub |

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

1. 打开 <https://supabase.com>，点右上角 **Sign in** / **Start your project**，用 GitHub 或邮箱登录。
2. 登录后进入 Dashboard，点绿色的 **New project**（如果让你先建 Organization，就建一个，名字随意，套餐选 **Free**）。
3. 填项目信息：
   - **Name（项目名）**：填 `schedule-project-tracker`
   - **Database Password（数据库密码）**：点 **Generate a password** 让它自动生成一串强密码，然后**马上复制存到记事本**。⚠️ 这个密码后面要用，且只显示这一次。
     - 建议只用字母数字下划线的长密码；如果里面有 `@ # % /` 等符号，后面拼连接串容易出错，可以点重新生成直到没有特殊符号。
   - **Region（地区）**：选离你近的，比如 **Southeast Asia (Singapore)** 或 **Northeast Asia (Tokyo)**。
   - **Plan**：**Free**。
4. 点 **Create new project**，然后等 1–2 分钟，它在给你开数据库（看到转圈是正常的）。
5. 进入项目主页后就绪。这一步你得到的**成果**是：一个空的云端数据库 + 一个你存好的数据库密码。

> 忘了密码怎么办？左侧 `Project Settings` → `Database` → `Reset database password` 可以重设。

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

## 第 3 步：复制两条连接串（最容易卡住，慢慢来）

这一步的目标：拿到两串 `postgresql://...`，一串给应用日常用，一串给建表用。

1. 在 Supabase 项目页面顶部，点 **Connect** 按钮（有的界面在右上角，写着 "Connect"）。
2. 弹窗里选 **ORMs** 这个标签页，Tool 选 **Prisma**（Supabase 会直接给你 Prisma 需要的两行）。
   - 如果没有 ORMs 标签，就选 **Connection string**，你会看到 `Transaction pooler`（端口 6543）和 `Session pooler`（端口 5432）两种。
3. 对应关系记牢：
   - **DATABASE_URL** ← 用 **Transaction pooler**（端口 **6543**，带 `pgbouncer=true`），应用平时读写用它。
   - **DIRECT_URL** ← 用 **Session pooler** 或 **Direct connection**（端口 **5432**），建表/迁移用它。
4. 复制出来的串里通常有一段 `[YOUR-PASSWORD]` 占位符，**把它替换成第 1 步你存的数据库密码**。

最终你会得到类似这样两行（你的会带上真实的项目编号、地区、密码）：

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:你的密码@REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.PROJECT_REF:你的密码@REGION.pooler.supabase.com:5432/postgres"
```

容易出错的地方（对照检查）：

- 两行**除了端口号（6543 / 5432）几乎一样**，别复制成一样的。
- 密码里如果有 `@`、`#`、`/`、`%` 等符号，会把连接串搞乱 → 回第 1 步重设一个只含字母数字下划线的密码最省心。
- 用户名部分（`postgres.xxxx` 或 `prisma.xxxx`）照 Supabase 给的复制，别自己改。
- `.env` 是放密码的文件，**永远不要上传到 GitHub**（本项目 `.gitignore` 已经帮你忽略了它）。

> 关于第 2 步的"Prisma 专用用户"：那是进阶做法，**新手可以先跳过**，直接用上面 Supabase 给的 `postgres.xxxx` 连接串就能跑通。等熟练了再回头做第 2 步收紧权限。

## 第 4 步：本地填写 `.env` 并建表

### 4.1 先把 `.env` 文件建好

项目根目录是 `D:\gsafety\schedule`。里面要有一个叫 `.env` 的文件（注意：**没有文件名，只有扩展名**，就是点开头的 `.env`）。

- 项目里已经有一个模板 `.env.example`。**最简单的办法**：复制它、改名为 `.env`。在 PowerShell 里运行：

```powershell
Copy-Item .env.example .env
```

- 然后用记事本或 VS Code 打开 `.env`，把第 3 步的两条连接串填进去。

填好后的 `.env` 大概长这样：

```env
DATABASE_URL="你第3步复制的 6543 那条"
DIRECT_URL="你第3步复制的 5432 那条"
APP_PASSWORD="自己起一个登录密码，比如 my-tracker-2026"

# 下面 3 个只有要「上传文件本体」时才需要，暂时可以先不管
SUPABASE_URL="https://你的PROJECT_REF.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="Supabase 后台 Project Settings → API 里的 service_role key"
SUPABASE_STORAGE_BUCKET="project-files"
```

### 4.2 建表（把数据库结构创建到 Supabase）

在项目目录里，依次运行下面三条命令（一条跑完再跑下一条）：

```powershell
npm.cmd run prisma:validate
npm.cmd run prisma:generate
npm.cmd exec prisma db push
```

- 第 1 条 `validate`：检查连接串写对没。看到 `The schema ... is valid` 就对了；报错通常是连接串复制错。
- 第 2 条 `generate`：生成代码，看到 `Generated Prisma Client` 即可。
- 第 3 条 `db push`：真正在 Supabase 里建表。看到 `Your database is now in sync` 就成功了。

想眼见为实：回 Supabase 后台，左侧 `Table Editor`，能看到 `Project`、`Contact`、`Task` 等一堆表，就说明建表成功了。

### （可选但推荐）给表加中文注释

`db push` 只建表，字段名都是英文。想在 Supabase 表格编辑器里看到中文说明：

1. 打开 Supabase → `SQL Editor`。
2. 打开本项目文件 [prisma/comments.sql](../prisma/comments.sql)，全文复制粘贴进去，运行一次。

之后每张表、每个关键字段都会显示中文注释。以后 schema 新增了表/字段，回来往 `comments.sql` 补一条 `COMMENT ON ...` 再跑一次即可。

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

### 不想用命令行？用 GitHub 网页版上传

你说过想“上传到 GitHub 网页版再操作”，也可以这样：

1. 在 GitHub 新建一个空仓库（**不要**勾选 Add README，保持空的）。
2. 仓库页面点 `uploading an existing file`。
3. 把项目文件夹里的内容拖进去。**注意：不要上传 `node_modules` 和 `.env`**（`.gitignore` 已经忽略它们；网页拖拽时手动别选这两个）。
4. 填一句提交说明，点 `Commit changes`。

> 提醒：`.env` 里有数据库密码，**绝对不要**传到 GitHub。真正的密钥只填在本地 `.env` 和 Vercel 的环境变量里。

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

8. 添加 Environment Variables（和本地 `.env` 一样的名字和值）：

```env
DATABASE_URL="你的 Supabase transaction pooler 连接串"
DIRECT_URL="你的 Supabase session/direct 连接串"
APP_PASSWORD="你自己的访问密码"
```

> 如果要用「上传文件」功能，再加上 `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、`SUPABASE_STORAGE_BUCKET` 三个（见下面第 10 步）。不加也能正常用其他功能。

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

## 第 10 步：开启「上传文件」功能（选做）

文件库有两种用法：

- **贴链接**（默认就能用）：文件放你自己的网盘/OneDrive/Google Drive，系统只记文件名 + 链接。不用配任何东西。
- **上传文件本体**（需要配置）：把 Word/PPT/PDF 直接传到 Supabase Storage。要配下面这步。

配置办法：

1. 进 Supabase 后台，左侧打开 `Storage`。
2. 点 `New bucket`，名字填 `project-files`。
3. **勾选 `Public bucket`**（这样上传后能直接打开链接），创建。
4. 左侧打开 `Project Settings` → `API`，复制两样：
   - `Project URL`（形如 `https://xxxx.supabase.co`）→ 填给 `SUPABASE_URL`
   - `service_role` 那一行的 key → 填给 `SUPABASE_SERVICE_ROLE_KEY`（这是管理员密钥，**只放服务器/Vercel，别泄露**）
5. 把这三个变量填进本地 `.env` 和 Vercel 环境变量：

```env
SUPABASE_URL="https://你的PROJECT_REF.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="刚复制的 service_role key"
SUPABASE_STORAGE_BUCKET="project-files"
```

6. 重新部署（Vercel 改了环境变量要点一次 Redeploy）。之后进任意项目详情页的「文件库」，就会出现「上传文件本体」表单。

没配之前，上传表单会提示“尚未配置”，你先用「贴链接」即可，不影响使用。

## 免费版注意事项

- Supabase 免费版适合你现在这种刚开始录入、数据很少的阶段（数据库 500MB、存储 1GB 够用很久）。
- Vercel Hobby 免费版适合个人项目和小规模使用。
- 暂时不要购买任何付费 add-on。
- 如果以后数据量、访问量、团队协作变大，再考虑升级。

## 已经能用的功能

连接数据库后，这些都能真正保存了：

- 联系人 / 项目 / 任务录入
- **出差 / 接待 / 展会安排**（`/receptions`，三种类型分开记录）
- **文件库**（贴链接随时可用；配好 Storage 后可上传文件本体）
- **月历视图**（`/calendar`，任务截止 + 出差/接待一屏看全）

## 已完成（连接数据库后即可使用）

- ✅ 项目阶段的计划日期 / 状态在线编辑（项目详情页每个阶段的「编辑计划 / 状态」）
- ✅ 会议纪要轮次新增 / 定稿入库（`/meeting-reviews`）
- ✅ 简单密码登录：设置了 `APP_PASSWORD` 就会启用；进站需输入密码，右上角可退出
- ✅ 设置页的标签 / 文件类型 / 角色 / 阶段模板 增删改
- ✅ 数据 JSON 导出（设置页，随时可用）/ 导入（恢复联系人、资料库记录）

> 登录说明：本地 `.env` 里 `APP_PASSWORD` 若留着占位值 `change-me-before-deploy` 或不填，则不启用密码保护（方便本地测试）。部署时在 Vercel 填一个真实密码即可开启保护。

## 以后还可以继续补的功能

- 阶段模板拖拽排序
- 会议纪要每轮的“已反馈”回填与附件
- 数据导入支持完整关系（目前导入覆盖联系人 / 资料库）
