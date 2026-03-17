@echo off
setlocal enabledelayedexpansion

:: Dinh nghia ma mau ANSI
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
echo %C%            HE THONG DEPLOY TU DONG v2.0                  %W%
echo %C%==========================================================%W%

:: --- BUOC 1: GITHUB ---
echo %Y%[*] DANG PUSH TOAN BO DU AN LEN GITHUB (ROOT)...%W%
git add .
git commit -m "Update project: Optimized deployment flow"
git push origin main --force
if %ERRORLEVEL% EQU 0 (echo %G%[OK] GitHub da cap nhat!%W%) else (echo %R%[ERR] GitHub loi!%W%)

echo.
:: --- BUOC 2: BACKEND ---
echo %B%[*] DI CHUYEN VAO THU MUC BACKEND...%W%
cd backend

:: --- BUOC 3: KIEM TRA GIT ---
if not exist .git (
    echo %P%[*] Chua co Git repository tai day, dang khoi tao...%W%
    git init
    git branch -M main
    git remote add hf https://huggingface.co/spaces/khoablabla/backend
) else (
    echo %G%[OK] Git Repository backend da san sang.%W%
)

echo.
:: --- BUOC 4: HUGGING FACE ---
echo %P%[*] DANG PUSH RIENG BACKEND LEN HUGGING FACE...%W%
git add .
git commit -m "Deploy backend: Home route and port 7860"
git push hf main --force
if %ERRORLEVEL% EQU 0 (echo %G%[OK] Hugging Face da len den!%W%) else (echo %R%[ERR] Hugging Face loi!%W%)

:: --- BUOC 5: KET THUC ---
cd ..
echo.
echo %C%==========================================================%W%
echo %G%             HOAN THANH DEPLOYMENT THAN TOC!              %W%
echo %C%==========================================================%W%
echo %W%[*] GitHub: %B%https://github.com/quangkhoa1792013-cell/web-key-api%W%
echo %W%[*] HF    : %P%https://huggingface.co/spaces/khoablabla/backend%W%
echo %C%==========================================================%W%
