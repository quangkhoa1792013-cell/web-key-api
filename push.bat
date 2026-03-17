@echo off
:: --- BUOC 1: PUSH TOAN BO DU AN LEN GITHUB (ROOT) ---
echo [*] Dang push toan bo du an len GitHub...
git add .
git commit -m "Update project - Backend route and port config"
git push origin main --force

:: --- BUOC 2: CHUYEN VAO BACKEND VA SETUP GIT ---
echo [*] Dang chuyen vao thu muc backend...
cd backend

:: Kiem tra neu chua co .git thi khoi tao
if not exist .git (
    echo [*] Khoi tao Git repository trong backend...
    git init
    git branch -M main
    git remote add hf https://huggingface.co/spaces/khoablabla/backend
    echo [*] Da them remote Hugging Face
) else (
    echo [*] Git repository da ton tai
)

:: --- BUOC 3: PUSH RIENG BACKEND LEN HUGGING FACE ---
echo [*] Dang push backend len Hugging Face...
git add .
git commit -m "Add home route and fix port 7860 for HF deployment"
git push hf main --force

:: --- QUAY LAI THU MUC GOC ---
cd ..

echo ==========================================
echo           HOAN THANH DEPLOYMENT!
echo ==========================================
echo [*] GitHub: https://github.com/quangkhoa1792013-cell/web-key-api
echo [*] Hugging Face: https://huggingface.co/spaces/khoablabla/backend
echo ==========================================
pause
