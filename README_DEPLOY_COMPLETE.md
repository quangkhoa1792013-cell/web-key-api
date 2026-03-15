# PythonAnywhere Deployment Guide - HOÀN CHỈNH

## 📋 Files cần upload lên PythonAnywhere

### 🗂️ Backend Files (Upload vào `/home/khoablabla/web-key-api/backend/`)

1. **neon_service.py** (File chính - ĐÃ SỬA XONG)
   - ✅ Full Flask app với tất cả routes
   - ✅ SSL fix cho PythonAnywhere
   - ✅ Logging chi tiết vào error_log.txt
   - ✅ PythonAnywhere compatible

2. **requirements_neon.txt** (Dependencies)
   ```
   psycopg2-binary
   flask
   flask-cors
   python-dotenv
   requests
   ```

### 🌐 WSGI Configuration

File: `/var/www/khoablabla_pythonanywhere_com_wsgi.py`

```python
import sys
import os

# Set DATABASE_URL
os.environ['DATABASE_URL'] = 'postgresql://neondb_owner:npg_yXhAo4sZaKb5@ep-patient-pond-a1virzy2-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'

# add your project directory to the sys.path
project_home = '/home/khoablabla/web-key-api/backend'
if project_home not in sys.path:
    sys.path = [project_home] + sys.path

# import flask app but need to call it "application" for WSGI to work
from neon_service import app as application  # noqa
```

## 🚀 Steps triển khai

### 1. Upload Files
```bash
# Copy files từ local lên PythonAnywhere
cp neon_service.py /home/khoablabla/web-key-api/backend/
cp requirements_neon.txt /home/khoablabla/web-key-api/backend/
```

### 2. Install Dependencies
```bash
cd /home/khoablabla/web-key-api/backend/
pip install --user -r requirements_neon.txt
```

### 3. Update WSGI Configuration
- Mở file: `/var/www/khoablabla_pythonanywhere_com_wsgi.py`
- Copy nội dung từ trên vào file
- Save file

### 4. Reload Web App
- Vào PythonAnywhere Dashboard → Web tab
- Click "Reload" button

## 🔍 Available API Endpoints

| Endpoint | Method | Description |
|----------|---------|-------------|
| `/api/test-db` | GET | Test database connection |
| `/api/check-key-status` | GET | Check if service has active keys |
| `/api/mark-session` | POST | Mark session before navigation |
| `/api/check-session-mark` | POST | Validate session ID |
| `/api/update-session-time` | POST | Update session with time selection |
| `/api/check-service-keys` | GET | Check service keys count |
| `/api/health` | GET | Health check |

## 📱 Frontend Files (ĐÃ SỬA XONG)

### ✅ ServiceSelectionPage.jsx
- ✅ Trạng thái Key display: "● Đã có Key" / "○ Chưa có Key"
- ✅ Nút "Xác nhận: Bắt đầu tạo Key cho [Tên dịch vụ]"
- ✅ API call `/api/mark-session` trước khi chuyển trang
- ✅ Loading states và error handling

### ✅ TimeSelectionPage.jsx
- ✅ Session validation với `/api/check-session-mark`
- ✅ Time selection options
- ✅ API call `/api/update-session-time`
- ✅ Proper error handling và redirects

## 🎯 Success Indicators

### Backend ✅
- Database connection successful
- Tables created successfully
- All API endpoints responding
- No import errors

### Frontend ✅
- Key status displays correctly
- Start button appears after service selection
- Session marking works before navigation
- Time selection updates session
- No console errors

## 🧪 Testing Flow

1. **Test Service Selection**
   - Visit: `https://khoablabla.pythonanywhere.com`
   - Check key status for each service
   - Click service → Click "Bắt đầu"
   - Should navigate to `/lootlab-{randomId}`

2. **Test Time Selection**
   - Should validate session with `/api/check-session-mark`
   - Select time → Should update with `/api/update-session-time`
   - Navigate to `/lootlab-{randomId}/{hours}h`

3. **Test API Endpoints**
   ```bash
   # Test database connection
   curl https://khoablabla.pythonanywhere.com/api/test-db
   
   # Test key status
   curl https://khoablabla.pythonanywhere.com/api/check-key-status?service=lootlab
   
   # Test session marking
   curl -X POST https://khoablabla.pythonanywhere.com/api/mark-session \
     -H "Content-Type: application/json" \
     -d '{"serviceId":"lootlab","randomId":"test123"}'
   ```

## 🔧 Environment Variables

### Local Development
```bash
VITE_API_BASE_URL=http://localhost:5000
```

### Production (PythonAnywhere)
```bash
VITE_API_BASE_URL=https://khoablabla.pythonanywhere.com
```

## 📞 Debugging

### Check Error Logs
```bash
# PythonAnywhere error log
tail -20 /var/log/khoablabla.pythonanywhere.com.error.log

# Application error log
cat /home/khoablabla/web-key-api/backend/error_log.txt
```

### Common Issues & Solutions

1. **ModuleNotFoundError**: 
   - Fix: `pip install --user flask-cors psycopg2-binary`

2. **DATABASE_URL not found**: 
   - Fix: Set trong WSGI file

3. **SSL Connection Error**: 
   - Fix: `sslmode=require` đã có trong code

4. **Import Error**: 
   - Fix: Check file paths trong WSGI

---

## ✅ **TẤT CẢ ĐÃ SỬA XONG!**

**Backend**: Đầy đủ routes, SSL fix, logging, PythonAnywhere compatible
**Frontend**: Trạng thái key, nút Start, session validation, time selection
**Deploy**: Sẵn sàng cho PythonAnywhere

**Chỉ cần upload và reload là xong!** 🚀
