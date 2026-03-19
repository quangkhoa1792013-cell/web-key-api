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
echo %C%       HE THONG DEPLOY "TOC CHIEN" v4.1 (CLEAN & PUSH)    %W%
echo %C%==========================================================%W%

:: --- BUOC 1: GITHUB (ROOT) ---
echo %Y%[*] 1. KIEM TRA THAY DOI GITHUB (ROOT)...%W%
:: Làm mới bộ nhớ đệm của Git để tránh tình trạng "không thấy thay đổi"
git rm -r --cached . >nul 2>&1
git add .
echo %C%--- Danh sach file moi nhat: ---%W%
git status --short

git commit -m "Auto Update: %date% %time%" --allow-empty

echo.
echo %Y%[*] Dang day len GitHub...%W%
:: Pull truoc de tranh loi rejected, sau do push ngay
git pull origin main --rebase >nul 2>&1
git push origin main --force
if %ERRORLEVEL% EQU 0 (echo %G%[OK] GitHub xong!%W%) else (echo %R%[ERR] GitHub kiet que!%W%)

echo.
echo %C%----------------------------------------------------------%W%

:: --- BUOC 2: BACKEND (HUGGING FACE) ---
echo %B%[*] 2. CAP NHAT MAT TRAN BACKEND...%W%
cd backend

:: Xóa cache Python để nhẹ repo
if exist "__pycache__" (
    echo %P%[*] Dang don dep rác __pycache__...%W%
    rd /s /q "__pycache__"
)

git rm -r --cached . >nul 2>&1
git add .
git commit -m "Backend Update: %date% %time%" --allow-empty

echo.
echo %P%[*] Dang cong pha Hugging Face...%W%
:: Force push de dam bao code tren HF luon giong het may local
git push hf main --force

if %ERRORLEVEL% EQU 0 (echo %G%[OK] Hugging Face da len den!%W%) else (echo %R%[ERR] Hugging Face loi!%W%)

:: --- KET THUC ---
cd ..
echo.
echo %C%==========================================================%W%
echo %G%          DONE! CODE DA DUOC QUET SACH VA DAY DI!         %W%
echo %C%==========================================================%W%