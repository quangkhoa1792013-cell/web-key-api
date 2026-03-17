@echo off
setlocal
echo ==========================================
echo    TIEN CONG: GITHUB -> HUGGING FACE
echo ==========================================

:: Luon dung o thu muc goc roblox
cd /d "%~dp0"

echo [1/4] Dang quet toan bo file du an...
git add .

echo [2/4] Dang Commit thay doi...
set /p msg="Nhap ghi chu cho dot push nay (hoac Enter de bo qua): "
if "%msg%"=="" set msg="Update full project: GitHub and HF sync"
git commit -m "%msg%"

echo [3/4] DANG PUSH LEN GITHUB (NETLIFY)...
:: Day len GitHub de Netlify tu build Frontend
git push origin main --force

echo ------------------------------------------
echo [4/4] DANG PUSH LEN HUGGING FACE (BACKEND)...
:: Day len Space de Hugging Face chay Backend
:: Luu y: Phai chay lenh 'git remote add hf <link>' truoc do nhu toi da huong dan
git push hf main --force

echo ==========================================
echo    HOAN THANH! KIEM TRA 2 MAT TRAN NGAY
echo ==========================================
pause