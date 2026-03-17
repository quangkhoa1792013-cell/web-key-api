@echo off
:: 1. Chuan bi quan luong
git add .
set /p msg="Nhap ghi chu: "
if "%msg%"=="" set msg="push"
git commit -m "%msg%"

:: 2. Push tong len GitHub
echo [*] Dang push GitHub...
git push origin main --force

:: 3. Push thang folder backend len Hugging Face
echo [*] Dang push Hugging Face...
git push backend hf main

echo ==========================================
echo             DA PUSH XONG!
echo ==========================================
pause