@echo off
chcp 65001 >nul
title 产品网站 - 管理后台
cd /d "%~dp0"

echo ================================
echo   正在启动管理后台...
echo   请保持本窗口打开，不要关闭
echo   浏览器将自动打开登录页
echo ================================
echo.

REM 检查是否已有服务器在运行（用 curl 探测本机 3000 端口）
curl -s -o nul -w "%%{http_code}" http://localhost:3000/ 2>nul | findstr /r "^200$" >nul 2>nul
if not errorlevel 1 (
    echo 服务器已在运行，直接打开管理后台...
    start http://localhost:3000/admin.html
    goto end
)

echo 首次启动，正在开启服务器...
start "product-catalog-server" /min cmd /c "node server.js"
timeout /t 3 /nobreak >nul
start http://localhost:3000/admin.html

:end
echo.
echo 管理后台地址（如未自动打开，请手动输入浏览器）：
echo   http://localhost:3000/admin.html
echo.
echo 登录密码：123456    高级设置密码：666666
echo.
pause
