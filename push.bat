@echo off
echo ==========================================
echo    BAT DAU PUSH FULL MAX (FORCE SYNC)
echo ==========================================

:: 1. Vao folder frontend de xu ly rieng
cd frontend

echo [1/3] Dang don dep file thua...
if exist package-lock.json del /f /q package-lock.json
if exist .pnpm-debug.log del /f /q .pnpm-debug.log

echo [2/3] Dang push Frontend len GitHub (FORCE)...
git add .
git commit -m "Update Frontend: Latest Vite + pnpm-lock (Clean)"
:: Dung --force de ghi de moi loi rejected nãy gio
git push origin main --force

echo [3/3] Dang nhay sang folder Backend...
cd ..

echo Dang push Backend len Hugging Face...
:: Backend thuong khong bi lech history nen push binh thuong
git add .
git commit -m "Update Backend: Hugging Face sync"
git push hf main

echo ==========================================
echo    DA XONG! NETLIFY SE TU DONG BUILD
echo ==========================================
pause