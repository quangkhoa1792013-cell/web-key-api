@echo off
git add .
git commit -m "push"

echo [*] Push GitHub...
git push origin main --force

echo [*] Push Hugging Face...
:: Lenh nay ep nhanh main hien tai vao nhanh main cua HF
git push hf main --force
