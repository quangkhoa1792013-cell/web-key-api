@echo off
setlocal
title GitHub Auto-Push
echo [1/3] Dang gom file...
git add .

:: Lay thoi gian hien tai lam commit message
set msg=Update_%date%_%time%
echo [2/3] Dang commit: %msg%
git commit -m "%msg%"

echo [3/3] Dang push len GitHub...
git push origin main

echo.
echo === XONG! ===