---
title: Backend Web Key
emoji: 🐳
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
---

# Backend - KhoaDz Script Key

## 📁 Cấu trúc thư mục

```
backend/
├── flask_app.py          # 📦 File chính - Toàn bộ logic Backend
├── .env                  # 🔐 DATABASE_URL cho Neon
├── requirements.txt      # 📚 Dependencies
├── wsgi_template.py     # 🌐 WSGI config cho PythonAnywhere
└── old_versions/        # 📦 Các file cũ đã dọn dẹp
```

## 🚀 Files chính

### **flask_app.py**
- ✅ Toàn bộ logic Backend
- ✅ Routes: `/api/mark-session`, `/api/check-key-status`, `/api/check-session-mark`
- ✅ Kết nối Neon với SSL
- ✅ Auto-create tables
- ✅ Error logging

### **.env**
- ✅ Chứa DATABASE_URL
- ✅ Không commit vào Git

### **requirements.txt**
- ✅ Dependencies: flask, flask-cors, psycopg2-binary, python-dotenv, requests

### **wsgi_template.py**
- ✅ Cấu hình WSGI cho PythonAnywhere
- ✅ Copy vào `/var/www/..._wsgi.py`

## 🧹 Đã dọn dẹp

Các file cũ đã được chuyển vào `old_versions/`:
- neon_service.py
- neon_service_debug.py
- session_marking_routes.py
- session_marking_update.py
- telegram_logger.py
- db/, key/, service/ folders

## 🎯 Sử dụng

```bash
# Install dependencies
pip install -r requirements.txt

# Run local
python flask_app.py

# Deploy PythonAnywhere
# 1. Copy wsgi_template.py vào /var/www/..._wsgi.py
# 2. Reload web app
```
