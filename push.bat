@echo off
:: --- BUOC 1: Push Repo Tong (Dung tai roblox\) ---
echo Dang push len GitHub...
git add .
git commit -m "Update tong hop"
git push origin main

:: --- BUOC 2: Nhay vao backend de push HF ---
:: Day chinh la cho ban can "Path" nay!
echo Dang nhay vao folder backend...
cd /d "%~dp0backend"

echo Dang push len Hugging Face...
git add .
git commit -m "Update rieng backend"
git push hf main --force

:: --- BUOC 3: Quay tro lai thu muc goc ---
cd ..
echo === DA XONG FULL MAX ===
