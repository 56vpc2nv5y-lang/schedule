@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ================================
echo   项目跟踪看板 - 本地启动
echo ================================
where node >nul 2>nul
if errorlevel 1 (
  echo [!] 未检测到 Node.js，请先到 https://nodejs.org 下载安装（LTS 版本，一路下一步）。
  pause
  exit /b 1
)
if not exist node_modules (
  echo [1/2] 第一次运行，正在安装依赖（几分钟，只需一次）...
  call npm install
)
echo [2/2] 启动中... 稍后会自动打开浏览器 http://localhost:3000
start "" http://localhost:3000
call npm run dev
pause
