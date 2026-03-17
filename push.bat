@echo off
echo ==========================================
echo           DANG PUSH THANG 2 MAT TRAN
echo ==========================================

:: 1. Commit nhanh
git add .
set /p msg="Ghi chu: "
if "%msg%"=="" set msg="push"
git commit -m "%msg%"

:: 2. Push ca du an len GitHub
echo [1/2] GITHUB...
git push origin hugging-face-deploy --force

:: 3. Push "ruột" folder backend lên Hugging Face
echo [2/2] HUGGING FACE (BACKEND)...
git subtree push --prefix backend hf main

echo ==========================================
echo                 XONG!
echo ==========================================
pause