@echo off
chcp 65001 >nul
title HandPlay - Trò chơi Điều khiển Cử chỉ Bằng Tay
echo ========================================================
echo   HANDPLAY (Tiếng Việt) - Điều khiển Cử chỉ Bằng Tay
echo ========================================================
echo Đang khởi động trò chơi...
if exist "%~dp0..\HandPlay-App\HandPlay.exe" (
    start "" "%~dp0..\HandPlay-App\HandPlay.exe"
) else (
    npm start
)
exit

