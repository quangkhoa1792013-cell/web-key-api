@echo off
setlocal
echo ==========================================
echo     BAT DAU PUSH TONG LUC (ROOT SYNC)
echo ==========================================

:: Đảm bảo đang đứng ở thư mục gốc (roblox)
cd /d "%~dp0"

echo [1/4] Dang don dep rac tai Frontend...
if exist "frontend\package-lock.json" del /f /q "frontend\package-lock.json"
if exist "frontend\.pnpm-debug.log" del /f /q "frontend\.pnpm-debug.log"

echo [2/4] Dang quet toan bo thu muc goc (Root Add)...
:: Quan trọng: Phải add từ gốc để lấy file netlify.toml
git add .

echo [3/4] Dang Commit toan bo du an...
git commit -m "Final Sync: Full project structure (Frontend + Backend + Config)"

echo [4/4] Dang PUSH len GitHub (Netlify)...
:: Force push để dọn dẹp mọi xung đột cũ trên GitHub
git push origin main --force

echo ------------------------------------------
echo Dang PUSH sang Hugging Face (Backend)...
:: Đẩy code sang Space của Hugging Face
git push hf main --force

echo ==========================================
echo    DA XONG! HAY KIEM TRA NETLIFY & HF
echo ==========================================
pause