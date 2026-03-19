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
echo %C%       HE THONG DEPLOY "SUPREME FORCE" v8.0 (MAX)         %W%
echo %C%==========================================================%W%

:: --- BUOC 1: GITHUB (ROOT/FRONTEND) ---
echo %Y%[*] 1. CONG PHA GITHUB (ROOT/FRONTEND)...%W%
git add -A
echo %C%--- CHI TIET THAY DOI (++++ ----): ---%W%
git diff --stat --cached --ignore-submodules
echo %C%----------------------------------------------%W%

git commit -m "Supreme Update: %date% %time%" --allow-empty
echo %Y%[*] Dang FORCE PUSH len GitHub...%W%
git push origin main --force
if %ERRORLEVEL% EQU 0 (set "STAT_GH=%G%THANH CONG%W%") else (set "STAT_GH=%R%THAT BAI%W%")

echo.
echo %C%----------------------------------------------------------%W%

:: --- BUOC 2: BACKEND (HUGGING FACE) ---
echo %B%[*] 2. DOC CHIEM MAT TRAN BACKEND...%W%
cd backend

:: Don dep rac truoc khi push
if exist "__pycache__" rd /s /q "__pycache__"

git add -A
echo %C%--- CHI TIET BACKEND (++++ ----): ---%W%
git diff --stat --cached
echo %C%----------------------------------------------%W%

git commit -m "Backend Force Deploy: %date% %time%" --allow-empty
echo %P%[*] Dang FORCE PUSH len Hugging Face...%W%
git push hf main --force
if %ERRORLEVEL% EQU 0 (set "STAT_HF=%G%THANH CONG%W%") else (set "STAT_HF=%R%THAT BAI%W%")

cd ..

:: --- KET THUC: BANG THONG KE ---
set "END_TIME=%time%"
echo.
echo %C%==========================================================%W%
echo %C%           BANG TONG KET CHIEN DICH DEPLOY                %W%
echo %C%==========================================================%W%
echo  - Thoi gian bat dau:  %START_TIME%
echo  - Thoi gian ket thuc: %END_TIME%
echo  - Trang thai GitHub:  %STAT_GH%
echo  - Trang thai Backend: %STAT_HF%
echo  - Cloudflare Pages:   %G%Dang tu dong "Bat song"%W%
echo %C%----------------------------------------------------------%W%
echo %Y%[LOI KHUYEAN]: Hay kiem tra Cloudflare Dashboard ngay!%W%
echo %C%==========================================================%W%
pause