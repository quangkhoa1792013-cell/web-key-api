@echo off
echo ==========================================
echo       DANG TONG LUC PUSH 2 MAT TRAN
echo ==========================================

:: 1. Chuan bi
git add .
set /p msg="Nhap ghi chu: "
if "%msg%"=="" set msg="update"
git commit -m "%msg%"

:: 2. Push toan bo len GitHub (Netlify)
echo [1/2] DANG PUSH GITHUB...
git push origin main --force

:: 3. Push rieng folder Backend len Hugging Face
echo [2/2] DANG PUSH HUGGING FACE (BACKEND)...
:: Xoa nhanh tam neu co
git branch -D temp-deploy >nul 2>&1
:: Tach va day
git subtree split --prefix backend -b temp-deploy
git push hf temp-deploy:main --force
:: Don dep
git branch -D temp-deploy

echo ==========================================
echo             HOAN THANH!
echo ==========================================
pause