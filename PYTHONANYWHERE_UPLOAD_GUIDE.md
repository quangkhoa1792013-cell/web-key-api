# PythonAnywhere Upload Guide

## 📁 **Cách upload file neon_service.py lên PythonAnywhere:**

### **Method 1: Web Interface (Easiest)**

1. **Login PythonAnywhere**
   - Vào https://www.pythonanywhere.com/
   - Login với tài khoản của bạn

2. **Go to Files**
   - Click menu "Files" ở bên trái
   - Navigate đến folder backend:
   ```
   /home/your_username/mysite/backend/
   ```

3. **Upload file**
   - Click button "Upload files" ở góc trên phải
   - Chọn file `neon_service.py` từ máy của bạn
   - Click "Upload"

4. **Verify upload**
   - Check file đã tồn tại trong folder
   - Click vào file để xem nội dung

### **Method 2: Bash Console**

1. **Open Bash Console**
   - Menu "Consoles" → "Bash"
   - Wait for console to load

2. **Navigate to folder**
   ```bash
   cd /home/your_username/mysite/backend/
   ls -la  # Check current files
   ```

3. **Upload via wget (nếu file trên GitHub)**
   ```bash
   wget https://raw.githubusercontent.com/username/repo/main/backend/neon_service.py
   ```

4. **Or use nano to edit directly**
   ```bash
   nano neon_service.py
   # Paste content, Ctrl+O to save, Ctrl+X to exit
   ```

### **Method 3: Git (Nếu bạn dùng Git)**

1. **Push to GitHub**
   ```bash
   git add backend/neon_service.py
   git commit -m "Fix CORS configuration"
   git push
   ```

2. **Pull on PythonAnywhere**
   ```bash
   cd /home/your_username/mysite/
   git pull
   ```

## 🔄 **Sau khi upload:**

### **Restart Web App**
1. Menu "Web" ở bên trái
2. Click button "Reload" (🔄 icon)
3. Wait for reload complete

### **Check Logs**
1. Menu "Web" → "Logs"
2. Look for messages:
   ```
   [NEON] ✅ Kết nối thành công!
   [NEON] ✅ Tables initialized successfully
   ```

### **Test API**
1. Mở browser:
   ```
   https://khoablabla.pythonanywhere.com/api/test-db
   ```
2. Should return:
   ```json
   {
     "success": true,
     "message": "Database connection successful"
   }
   ```

## 📋 **Quick Checklist:**

- [ ] Login PythonAnywhere
- [ ] Go to Files → backend folder
- [ ] Upload neon_service.py
- [ ] Reload web app
- [ ] Check logs for success messages
- [ ] Test API endpoint
- [ ] Test frontend from localhost:5173

## 🚨 **Common Issues:**

### **Permission denied:**
```bash
chmod 644 neon_service.py
```

### **Wrong folder:**
```bash
# Check current directory
pwd
# Should be: /home/your_username/mysite/backend/
```

### **File not updating:**
- Clear browser cache
- Hard refresh: Ctrl+F5
- Check file timestamp

**Upload file và reload web app để fix CORS!** 🚀
