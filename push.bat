@echo off
setlocal enabledelayedexpansion

:: Định nghĩa mã màu ANSI cho "chiến trường"
set "ESC="
set "G=%ESC%[92m"
set "Y=%ESC%[93m"
set "B=%ESC%[94m"
set "P=%ESC%[95m"
set "C=%ESC%[96m"
set "R=%ESC%[91m"
set "W=%ESC%[0m"

set "START_TIME=%time%"
cls
echo %C%==========================================================%W%
echo %C%       HE THONG TONG DEPLOY v10.0 (MASTER-MAIN FIX)       %W%
echo %C%==========================================================%W%
echo.

:: --- BUOC 1: GITHUB (ROOT) ---
echo %Y%[*] 1. QUET CHIEN TRUONG GITHUB (FRONTEND)...%W%
git add -A

:: Kiểm tra thay đổi
set "HAS_CHANGE_GH="
for /f "tokens=*" %%a in ('git diff --cached --stat --ignore-submodules') do set "HAS_CHANGE_GH=YES"

if not defined HAS_CHANGE_GH (
    echo %G%[THONG BAO] Mat tran GitHub khong co bien dong.%W%
    set "STAT_GH=%G%KHONG DOI%W%"
    goto :BACKEND_SECTION
)

echo %C%--- CAC FILE BI TRUY QUET: ---%W%
git diff --stat --cached --ignore-submodules
echo.
echo %Y%[*] Tien hanh dong bo nhanh MAIN len GitHub...%W%
git branch -M main
git commit -m "Update v10.0: Frontend" --quiet
git push origin main --force
set "STAT_GH=%G%THANH CONG%W%"

:BACKEND_SECTION
echo.
echo %C%----------------------------------------------------------%W%
echo.

:: --- BUOC 2: BACKEND (HUGGING FACE) ---
echo %B%[*] 2. QUET MAT TRAN BACKEND (HUGGING FACE)...%W%
cd backend

:: Kiểm tra nếu chưa có Git trong thư mục backend thì khởi tạo ngay
if not exist ".git" (
    echo %R%[ canh bao ] Chua co Git trong Backend. Dang thiet lap lai...%W%
    git init --quiet
    git remote add hf https://huggingface.co/spaces/khoablabla/backend
)

:: Don dep rac
if exist "__pycache__" rd /s /q "__pycache__" >nul 2>&1

git add -A
set "HAS_CHANGE_HF="
for /f "tokens=*" %%a in ('git diff --cached --stat') do set "HAS_CHANGE_HF=YES"

if not defined HAS_CHANGE_HF (
    echo %G%[THONG BAO] Backend van dang trong tam kiem soat.%W%
    set "STAT_HF=%G%KHONG DOI%W%"
    goto :FINISH
)

echo %C%--- NOI DUNG BACKEND THAY DOI: ---%W%
git diff --stat --cached
echo.
echo %P%[*] Tien hanh EP NHANH MAIN len Hugging Face...%W%
:: Buoc quan trong nhat: Ep Git hieu day la nhanh main
git branch -M main
git commit -m "Update v10.0: Backend" --quiet
git push hf main --force
set "STAT_HF=%G%THANH CONG%W%"

:FINISH
cd ..

:: --- KET THUC: BANG THONG KE ---
set "END_TIME=%time%"
echo.
echo.
echo %C%==========================================================%W%
echo %C%           BANG TONG KET CHIEN DICH v10.0                 %W%
echo %C%==========================================================%W%
echo.
echo   [+] Bat dau:   %START_TIME%
echo   [+] Ket thuc:  %END_TIME%
echo.
echo   [+] GitHub (Root):  %STAT_GH%
echo   [+] HF (Backend):   %STAT_HF%
echo.
echo   [^>] Cloudflare:    %Y%Auto-Sync Running%W%
echo   [^>] Port Target:   %P%7860%W%
echo.
echo %C%==========================================================%W%
echo.
