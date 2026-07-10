@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ==========================================
echo   灌入初始数据（你的项目/联系人/任务等）
echo   （前提：已双击过 db-init.bat 建好表）
echo ==========================================
echo   安全提示：如果数据库里已经有项目，本脚本会
echo   自动跳过、不会覆盖你后来录入的内容。
echo ==========================================
where node >nul 2>nul
if errorlevel 1 (
  echo [!] 未检测到 Node.js，请先到 https://nodejs.org 安装。
  pause
  exit /b 1
)
if not exist node_modules (
  echo [0/1] 正在安装依赖...
  call npm install
)
echo [1/1] 正在灌入数据...
call npx tsx prisma/seed.ts
echo.
echo 完成。回到浏览器刷新即可看到数据。
pause
