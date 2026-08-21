@echo off
chcp 65001 >nul
title 产品网站 - 一键发布更新
cd /d "%~dp0"

echo ================================
echo   产品网站 - 一键发布更新
echo ================================
echo.
echo [1/3] 收集你的所有修改...
git add -A
if errorlevel 1 (
    echo 出错了：git add 失败，请检查是否安装了 Git
    pause
    exit /b 1
)

echo [2/3] 保存修改记录...
set /p msg=请输入本次更新说明（例如：新增5张图，直接回车用默认）: 
if "%msg%"=="" set msg=update
git commit -m "%msg%"
if errorlevel 1 (
    echo 没有检测到修改，或提交失败。如果确实改过图片，请先运行「启动管理后台.bat」检查。
    pause
    exit /b 1
)

echo [3/3] 发布到网上（约1-2分钟，请耐心等待）...
git push origin main
if errorlevel 1 (
    echo.
    echo 发布失败：可能是网络问题，请等 1 分钟再双击本文件重试。
    pause
    exit /b 1
)

echo.
echo ================================
echo   ✅ 发布成功！
echo   线上约 1 分钟后自动更新
echo   网址：https://dchc76c99k-lang.github.io/product-catalog/
echo ================================
echo.
pause
