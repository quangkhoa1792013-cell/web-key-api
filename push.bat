@echo off
color 0A
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    🚀 DEPLOYMENT SCRIPT 🚀                    ║
echo ║                  GitHub + Hugging Face                        ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: --- BUOC 1: PUSH TOAN BO DU AN LEN GITHUB (ROOT) ---
echo [⚡] %time% - Dang push toan bo du an len GitHub...
git add .
git commit -m "Update project - Backend route and port config"
git push origin main --force
echo [✅] %time% - GitHub push completed!
echo.

:: --- BUOC 2: CHUYEN VAO BACKEND VA SETUP GIT ---
echo [📁] %time% - Dang chuyen vao thu muc backend...
cd backend

:: Kiem tra neu chua co .git thi khoi tao
if not exist .git (
    echo [🔧] %time% - Khoi tao Git repository trong backend...
    git init
    git branch -M main
    git remote add hf https://huggingface.co/spaces/khoablabla/backend
    echo [✅] %time% - Da them remote Hugging Face
) else (
    echo [ℹ️]  %time% - Git repository da ton tai
)

:: --- BUOC 3: PUSH RIENG BACKEND LEN HUGGING FACE ---
echo [🚀] %time% - Dang push backend len Hugging Face...
git add .
git commit -m "Add home route and fix port 7860 for HF deployment"
git push hf main --force
echo [✅] %time% - Hugging Face push completed!
echo.

:: --- QUAY LAI THU MUC GOC ---
cd ..

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    🎉 DEPLOYMENT SUCCESS! 🎉                   ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo [🌐] GitHub: https://github.com/quangkhoa1792013-cell/web-key-api
echo [🤖] Hugging Face: https://huggingface.co/spaces/khoablabla/backend
echo [⏰] Hoan thanh luc: %time%
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                     📊 THÔNG TIN DEPLOYMENT                    ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║ • Frontend: React + Vite + Tailwind                           ║
echo ║ • Backend: Flask + PostgreSQL (Neon)                         ║
echo ║ • Platform: GitHub + Netlify + Hugging Face                  ║
echo ║ • Port: 7860 (HF) / 5173 (Local)                             ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
pause
