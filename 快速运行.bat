@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ==========================================
echo   快速模式（预编译 + 生产运行，日常用更快）
echo ==========================================
echo   说明：本模式会先编译一次（1-2 分钟），之后
echo   切换页面几乎秒开，不再白屏。适合平时使用。
echo   注意：我给你更新代码后，需要再双击本文件重新
echo   编译一次；否则用不到新功能。
echo ==========================================
where node >nul 2>nul
if errorlevel 1 (
  echo [!] 未检测到 Node.js，请先到 https://nodejs.org 安装。
  pause
  exit /b 1
)
if not exist node_modules (
  echo [0/2] 第一次运行，正在安装依赖...
  call npm install
)
echo [1/2] 正在编译（第一次或更新后会久一点）...
call npm run build
if errorlevel 1 (
  echo [!] 编译失败，请把上面的红色报错发给我。
  pause
  exit /b 1
)
echo [2/2] 启动中... 稍后自动打开 http://localhost:3000
start "" http://localhost:3000
call npm run start
pause
