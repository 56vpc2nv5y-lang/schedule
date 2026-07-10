@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ==========================================
echo   数据库初始化 / 同步表结构
echo   （前提：.env 里已填好 Supabase 连接串）
echo ==========================================
where node >nul 2>nul
if errorlevel 1 (
  echo [!] 未检测到 Node.js，请先到 https://nodejs.org 安装。
  pause
  exit /b 1
)
if not exist node_modules (
  echo [0/2] 正在安装依赖...
  call npm install
)
echo [1/2] 生成数据库客户端...
call npx prisma generate
echo [2/2] 把表结构同步到数据库...
call npx prisma db push
echo.
echo 完成。以后每次改动了数据结构（或我告诉你需要时），再双击本文件一次即可。
pause
