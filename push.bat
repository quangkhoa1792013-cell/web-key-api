@echo off
setlocal enabledelayedexpansion

:: Định nghĩa mã màu ANSI
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
echo %C%       HE THONG DEPLOY v9.4                               %W%
echo %C%==========================================================%W%
echo.

:: --- BUOC 1: GITHUB (ROOT) ---
echo %Y%[*] 1. QUET CHIEN TRUONG GITHUB (ROOT)...%W%
git add -A

:: Kiểm tra thay đổi bằng cách đếm số dòng diff
for /f "tokens=*" %%a in ('git diff --cached --stat --ignore-submodules') do set "HAS_CHANGE=YES"

if not defined HAS_CHANGE (
    echo %G%[THONG BAO] Mat tran GitHub khong co bien dong.%W%
    set "STAT_GH=%G%KHONG DOI%W%"
    goto :SKIP_GITHUB
)

echo %C%--- CAC FILE BI TRUY QUET: ---%W%
git diff --stat --cached --ignore-submodules
echo.
echo %Y%[*] Tien hanh FORCE PUSH len GitHub...%W%
git commit -m "Update" --quiet
git push origin main --force
set "STAT_GH=%G%THANH CONG%W%"

:SKIP_GITHUB
echo.
echo %C%----------------------------------------------------------%W%
echo.

:: --- BUOC 2: BACKEND (HUGGING FACE) ---
echo %B%[*] 2. QUET MAT TRAN BACKEND (HUGGING FACE)...%W%
cd backend

:: Don dep __pycache__
if exist "__pycache__" rd /s /q "__pycache__" >nul 2>&1

set "HAS_CHANGE_BACKEND="
git add -A
for /f "tokens=*" %%a in ('git diff --cached --stat') do set "HAS_CHANGE_BACKEND=YES"

if not defined HAS_CHANGE_BACKEND (
    echo %G%[THONG BAO] Backend van dang trong tam kiem soat.%W%
    set "STAT_HF=%G%KHONG DOI%W%"
    goto :SKIP_BACKEND
)

echo %C%--- NOI DUNG BACKEND THAY DOI: ---%W%
git diff --stat --cached
echo.
echo %P%[*] Tien hanh FORCE PUSH len Hugging Face...%W%
git commit -m "Backend Update" --quiet
git push hf main --force
set "STAT_HF=%G%THANH CONG%W%"

:SKIP_BACKEND
cd ..

:: --- KET THUC: BANG THONG KE ---
set "END_TIME=%time%"
echo.
echo.
echo %C%==========================================================%W%
echo %C%           BANG TONG KET CHIEN DICH DEPLOY                %W%
echo %C%==========================================================%W%
echo.
echo  [+] Bat dau:  %START_TIME%
echo  [+] Ket thuc: %END_TIME%
echo.
echo  [+] GitHub:   %STAT_GH%
echo  [+] Backend:  %STAT_HF%
echo.
echo  [^>] Cloudflare Pages: %Y%Auto-Sync Active%W%
echo.
echo %C%==========================================================%W%
echo.
