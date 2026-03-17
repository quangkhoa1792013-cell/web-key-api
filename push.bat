@echo off
:: 1. Ghi nhan thay doi
git add .
git commit -m "push"

:: 2. Push len GitHub Main
echo [*] Dang push GitHub MAIN...
git push origin main --force

:: 3. Push "ruot" backend len Hugging Face Main
echo [*] Dang push Hugging Face MAIN...
:: Dung lenh nay de dam bao Git biet dich den la dau
git subtree push --prefix backend https://huggingface.co/spaces/khoablabla/backend main

echo ==========================================
echo           DA PUSH XONG 2 MAT TRAN!
echo ==========================================
pause