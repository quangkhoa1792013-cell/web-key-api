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
echo %C%       HE THONG DEPLOY "INTELLIGENT FORCE" v9.0           %W%
echo %C%==========================================================%W%
echo.

:: --- BUOC 1: KIEM TRA GITHUB (ROOT) ---
echo %Y%[*] 1. DANG QUET THAY DOI TAI GITHUB (ROOT)...%W%
git add -A

:: Kiểm tra xem có gì để commit không
git diff --cached --exit-code >nul
if %ERRORLEVEL% EQU 0 (
    echo %G%[THONG BAO] Khong co thay doi nao moi tai Root/Frontend.%W%
    set "STAT_GH=%G%KHONG DOI%W%"
) else (
    echo %C%--- CHI TIET CAC FILE THAY DOI: ---%W%
    git diff --stat --cached --ignore-submodules
    echo.
    echo %Y%[*] Dang FORCE PUSH len GitHub...%W%
    git commit -m "Supreme Update: %date% %time%" --quiet
    git push origin main --force
    if %ERRORLEVEL% EQU 0 (set "STAT_GH=%G%THANH CONG%W%") else (set "STAT_GH=%R%LOI PUSH%W%")
)

echo.
echo %C%----------------------------------------------------------%W%
echo.

:: --- BUOC 2: KIEM TRA BACKEND (HUGGING FACE) ---
echo %B%[*] 2. DANG QUET MAT TRAN BACKEND (HUGGING FACE)...%W%
cd backend

:: Dọn rác
if exist "__pycache__" rd /s /q "__pycache__"

git add -A
git diff --cached --exit-code >nul
if %ERRORLEVEL% EQU 0 (
    echo %G%[THONG BAO] Chien tuyen Backend van on dinh (Khong co thay doi).%W%
    set "STAT_HF=%G%KHONG DOI%W%"
) else (
    echo %C%--- CHI TIET NOI DUNG BACKEND MOI: ---%W%
    git diff --stat --cached
    echo.
    echo %P%[*] Dang FORCE PUSH len Hugging Face...%W%
    git commit -m "Backend Force Deploy: %date% %time%" --quiet
    git push hf main --force
    if %ERRORLEVEL% EQU 0 (set "STAT_HF=%G%THANH CONG%W%") else (set "STAT_HF=%R%LOI PUSH%W%")
)

cd ..

:: --- KET THUC: BANG TONG KET ---
set "END_TIME=%time%"
echo.
echo.
echo %C%==========================================================%W%
echo %C%           BANG TONG KET CHIEN DICH DEPLOY                %W%
echo %C%==========================================================%W%
echo.
echo  [+] Thoi gian bat dau:  %START_TIME%
echo  [+] Thoi gian ket thuc: %END_TIME%
echo.
echo  [+] Trang thai GitHub:  %STAT_GH%
echo  [+] Trang thai Backend: %STAT_HF%
echo.
echo  [>] Cloudflare Pages:   %Y%Hóng GitHub để build...%W%
echo.
echo %C%==========================================================%W%
echo.
pause