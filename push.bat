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

cls
echo %C%==========================================================%W%
echo %C%          HE THONG DEPLOY CHI TIET v3.0 (VERBOSE)         %W%
echo %C%==========================================================%W%

:: --- BUOC 1: GITHUB ---
echo %Y%[*] 1. DANG CAP NHAT GITHUB (ROOT)...%W%
git add .
:: Hien thi chi tiet cac file thay doi truoc khi commit
echo %C%--- Thong ke thay doi: ---%W%
git diff --stat --cached
echo %C%--------------------------%W%
git commit -m "Update project: %date% %time%"
echo.
echo %Y%[*] Dang day code len GitHub...%W%
git push origin main --force --verbose
if %ERRORLEVEL% EQU 0 (echo %G%[OK] GitHub hoan tat!%W%) else (echo %R%[ERR] GitHub loi!%W%)

echo.
echo %C%----------------------------------------------------------%W%
:: --- BUOC 2: BACKEND ---
echo %B%[*] 2. TIEN VAO MAT TRAN BACKEND...%W%
cd backend

:: Kiem tra Git
if not exist .git (
    echo %P%[*] Khoi tao Git moi cho Backend...%W%
    git init
    git branch -M main
    git remote add hf https://huggingface.co/spaces/khoablabla/backend
)

echo %P%[*] Dang gom hang Backend...%W%
git add .
echo %C%--- Chi tiet file Backend: ---%W%
git diff --stat --cached
git commit -m "Deploy Backend: %date% %time%"
echo.
echo %P%[*] Dang day code len Hugging Face...%W%
:: Dung --verbose de hien thi qua trinh truyen du lieu chi tiet
git push hf main --force --verbose

if %ERRORLEVEL% EQU 0 (echo %G%[OK] Hugging Face da ruc sang!%W%) else (echo %R%[ERR] Hugging Face loi!%W%)

:: --- KET THUC ---
cd ..
echo.
echo %C%==========================================================%W%
echo %G%           DA DEPLOY XONG VOI CHI TIET DAY DU!           %W%
echo %C%==========================================================%W%
