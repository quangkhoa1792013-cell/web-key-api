@echo off
:: --- BUOC 1: PUSH TOAN BO LEN GITHUB (ROOT) ---
echo [*] Dang push toan bo len GitHub...
git add .
git commit -m "push root"
git push origin main --force

:: --- BUOC 2: CHUI VAO BACKEND VA PUSH (HF) ---
echo [*] Dang di vao folder backend...
cd backend

:: Kiem tra neu chua co Git thi khoi tao nhanh
if not exist .git (
    git init
    git remote add hf https://huggingface.co/spaces/khoablabla/backend --force
)

echo [*] Dang push rieng Backend len Hugging Face...
git add .
git commit -m "fix conflict and push"
:: Them --force o cuoi de xoa sach cai loi tren HF
git push hf main --force

echo ==========================================
echo           DA HOAN THANH 2 BUOC!
echo ==========================================
