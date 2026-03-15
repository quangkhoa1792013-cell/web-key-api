# CORS Fix - PythonAnywhere Configuration

## 🔧 **Đã sửa lỗi CORS trong neon_service.py:**

```python
# Cấu hình CORS cho phép frontend localhost:5173
CORS(app, 
     origins=['http://localhost:5173', 'https://khoablabla.pythonanywhere.com'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'],
     supports_credentials=True)
```

## 🚀 **Cần restart backend trên PythonAnywhere:**

### **Step 1: Upload file mới**
```bash
# Upload neon_service.py đã sửa lên PythonAnywhere
```

### **Step 2: Restart web app**
1. Vào PythonAnywhere dashboard
2. Go to "Web" tab
3. Click "Reload" button cho web app

### **Step 3: Check logs**
```bash
# PythonAnywhere > Web > Logs
# Tìm message: [NEON] ✅ Kết nối thành công!
```

## 🔍 **Test lại:**

### **Frontend (localhost:5173):**
- Refresh browser
- Check key status badges
- Try click service → Start button
- Should work without CORS errors

### **Backend logs should show:**
```
[NEON] ✅ Kết nối thành công!
[NEON] ✅ Tables initialized successfully
[NEON] ✅ Database test passed - Ready to serve!
```

## 🛠️ **Nếu vẫn lỗi CORS:**

### **Option 1: Thêm wildcard (development only)**
```python
CORS(app, origins="*")  # Chỉ cho development
```

### **Option 2: PythonAnywhere WSGI config**
```python
# Trong /var/www/username_pythonanywhere_com_wsgi.py
from flask_cors import CORS
CORS(app)
```

### **Option 3: Environment variable**
```python
import os
ALLOWED_ORIGINS = os.environ.get('ALLOWED_ORIGINS', 'http://localhost:5173').split(',')
CORS(app, origins=ALLOWED_ORIGINS)
```

## 📋 **Quick Checklist:**

- [ ] Upload neon_service.py đã sửa CORS
- [ ] Restart web app trên PythonAnywhere
- [ ] Check logs cho connection success
- [ ] Test frontend từ localhost:5173
- [ ] Verify API calls work without CORS errors

**Upload và restart backend để test lại!** 🚀
