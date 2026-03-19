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
echo %C%       HE THONG DEPLOY "CHI TIET TOAN DIEN" v5.0          %W%
echo %C%==========================================================%W%

:: --- BUOC 1: GITHUB (ROOT) ---
echo %Y%[*] 1. DANG CAP NHAT GITHUB (ROOT)...%W%
git add -A
echo %C%--- Thong ke chi tiet file thay doi: ---%W%
git status --short
echo %C%----------------------------------------%W%

git commit -m "Full Update: %date% %time%" --allow-empty

echo.
echo %Y%[*] Dang day code len GitHub...%W%
git push origin main --force
if %ERRORLEVEL% EQU 0 (echo %G%[OK] GitHub hoan tat!%W%) else (echo %R%[ERR] GitHub loi!%W%)

echo.
echo %C%----------------------------------------------------------%W%

:: --- BUOC 2: BACKEND (HUGGING FACE) ---
echo %B%[*] 2. TIEN VAO MAT TRAN BACKEND...%W%
cd backend

:: Don dep rac Python
if exist "__pycache__" rd /s /q "__pycache__"

echo %P%[*] Dang gom hang Backend...%W%
git add -A
echo %C%--- Chi tiet file Backend: ---%W%
git status --short
echo %C%------------------------------%W%

git commit -m "Deploy Backend: %date% %time%" --allow-empty

echo.
echo %P%[*] Dang day code len Hugging Face...%W%
git push hf main --force

if %ERRORLEVEL% EQU 0 (echo %G%[OK] Hugging Face da ruc sang!%W%) else (echo %R%[ERR] Hugging Face loi!%W%)

:: --- KET THUC ---
cd ..
echo.
echo %C%==========================================================%W%
echo %G%      DA DEPLOY XONG - MOI THU DA DUOC DONG BO!           %W%
echo %C%==========================================================%W%
pause