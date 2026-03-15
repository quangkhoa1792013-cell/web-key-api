# Database Connection Debug Guide

## 🔍 **Kiểm tra từng điểm bạn nêu:**

### **1. File neon_service_signature.py - Kết nối psycopg2**

```python
# ✅ Đang dùng psycopg2-binary
import psycopg2

# ✅ Biến DATABASE_URL parse từ .env
NEON_DB_URL = os.environ.get('DATABASE_URL', 'default_url')

# ✅ sslmode=require được đảm bảo
if 'sslmode=' not in db_url:
    db_url += '?sslmode=require'

# ✅ Kết nối với SSL
self.conn = psycopg2.connect(db_url)
```

### **2. File .env - Định dạng chuỗi kết nối**

```bash
# Định dạng đúng:
DATABASE_URL=postgresql://[user]:[password]@[host]/neondb?sslmode=require

# Ví dụ thực tế (che mật khẩu):
DATABASE_URL=postgresql://neondb_owner:npg_abc123@ep-patient-pond-a1virzy2-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

### **3. Log lỗi Terminal - Common Errors**

```bash
# 1. Password authentication failed
psycopg2.OperationalError: FATAL: password authentication failed for user "neondb_owner"
# → Sai mật khẩu

# 2. SSL certificate error
SSL error: certificate verify failed
# → Thiếu cấu hình SSL

# 3. Table does not exist
psycopg2.errors.UndefinedTable: relation "user_sessions" does not exist
# → Chưa chạy SQL schema

# 4. Connection timeout
psycopg2.OperationalError: connection to server timed out
# → Firewall hoặc network issue
```

### **4. neon_schema.sql - Kiểm tra cấu trúc bảng**

```sql
-- Cấu trúc bảng user_sessions phải khớp với INSERT:
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,        -- ✅ VARCHAR cho key
    service VARCHAR(50),                    -- ✅ VARCHAR cho service
    status VARCHAR(20) DEFAULT 'PENDING',   -- ✅ VARCHAR cho status
    ip_address INET,                        -- ✅ INET cho IP
    expire_ts BIGINT NOT NULL,              -- ✅ BIGINT cho timestamp
    hwid VARCHAR(255),                     -- ✅ VARCHAR cho HWID
    cookies TEXT,                           -- ✅ TEXT cho cookies
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🛠️ **Debug Steps:**

### **Step 1: Test Connection**
```bash
python neon_service_debug.py
# Mở trình duyệt: http://localhost:5000/api/test-db
```

### **Step 2: Check Environment Variables**
```bash
# Windows
echo %DATABASE_URL%

# Linux/Mac
echo $DATABASE_URL
```

### **Step 3: Verify SSL Certificate**
```python
# Thêm vào connection string:
sslmode=require&sslcert=&sslkey=&sslrootcert=
```

### **Step 4: Install Required Libraries**
```bash
pip install psycopg2-binary Flask Flask-CORS python-dotenv requests
```

## 🚨 **Windows SSL Issue Fix:**

```python
# Thêm vào connection cho Windows:
import ssl
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

self.conn = psycopg2.connect(
    db_url,
    ssl_context=ssl_context
)
```

## 📋 **Quick Debug Checklist:**

- [ ] psycopg2-binary installed?
- [ ] DATABASE_URL set correctly?
- [ ] sslmode=require in connection string?
- [ ] user_sessions table exists?
- [ ] Column types match INSERT query?
- [ ] Firewall allows Neon connection?
- [ ] PythonAnywhere environment variables set?

## 🔧 **Enhanced Debug File:**

Đã tạo `neon_service_debug.py` với:
- ✅ Detailed logging
- ✅ SSL configuration check
- ✅ Database test endpoint
- ✅ Table structure validation
- ✅ Error type detection

**Chạy file debug này để tìm ra vấn đề chính xác!** 🎯
