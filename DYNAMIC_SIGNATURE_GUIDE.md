# Dynamic Signature System - Deployment Guide

## 🎯 **Luồng hoạt động chính xác**

### Bước 1: Khởi tạo - Đúc ID
```
URL: 123.com
Action: Chọn Lootlab
Result: 123.com/lootlab-8kL96Hj
```
- Backend tạo session trong Neon
- Frontend navigate đến dynamic URL

### Bước 2: Chữ ký thời gian - Cố định
```
URL: 123.com/lootlab-8kL96Hj
Action: Chọn gói 2h
Result: 123.com/lootlab-8kL96Hj/2h
```
- Backend cập nhật session với time signature
- URL cố định cho toàn bộ quá trình vượt link
- F5 vẫn giữ nguyên URL

### Bước 3: Lột xác - Đúc Key mới
```
URL: 123.com/lootlab-8kL96Hj/2h
Action: Hoàn thành vượt link
Result: 123.com/key?lootlab=abcXYZ123
```
- Backend "đúc" key mới hoàn toàn ngẫu nhiên
- Session bị xóa để tránh reuse
- Key được lưu trong Neon

### Bước 4: Tự hủy
```
URL: 123.com/key?lootlab=abcXYZ123
Action: Key hết hạn 2h
Result: 123.com/expired
```
- Frontend kiểm tra mỗi giây
- `window.location.replace('/expired')` chặn back button
- Xóa sạch localStorage + sessionStorage

## 📁 **Files đã tạo**

### Frontend Components:
- `ServiceSelectionPage_Signature.jsx` - Trang chọn dịch vụ với key status
- `TimeSelectionPage_Signature.jsx` - Trang chọn thời gian với session check
- `KeyDisplayPage_Signature.jsx` - Trang hiển thị key với tự hủy real-time
- `App.jsx` - Routing cho dynamic signature system
- `public/_redirects` - Netlify SPA support

### Backend:
- `neon_service_signature.py` - Full signature system backend

## 🚀 **Deploy Steps**

### 1. Update Frontend Components:
```bash
# Replace existing components
mv ServiceSelectionPage_Signature.jsx ServiceSelectionPage.jsx
mv TimeSelectionPage_Signature.jsx TimeSelectionPage.jsx
mv KeyDisplayPage_Signature.jsx KeyDisplayPage.jsx
```

### 2. Update Backend:
```bash
# Replace backend service
mv neon_service_signature.py neon_service.py
```

### 3. Deploy Neon Database:
```bash
# Apply schema
psql $DATABASE_URL -f neon_schema.sql
```

### 4. Deploy to Netlify:
- Upload frontend với `_redirects`
- Set environment variable `VITE_API_BASE_URL`

### 5. Deploy Backend (PythonAnywhere):
- Set `DATABASE_URL` environment variable
- Run `neon_service.py`

## 🔧 **Technical Implementation**

### A. Routing Structure:
```jsx
// Dynamic routes with signature
/:serviceId-:randomId          // Time selection
/:serviceId-:randomId/:time   // Link skip
/key                          // Key display (useSearchParams)
```

### B. Backend Functions:
```python
# Session management
POST /api/create-session      # Create session with random ID
POST /api/check-session       # Validate session
POST /api/update-session-time # Add time signature

# Key forging
POST /api/finalize-key        # Forge new key from session
POST /api/validate-key        # Validate key for script
POST /api/heartbeat           # Script heartbeat

# Service management
GET  /api/check-service-keys  # Check service key status
POST /api/cleanup            # Clean expired keys
```

### C. Real-time Self-Destruction:
```javascript
// Check every second
useEffect(() => {
  const check = () => {
    if (currentTime > expire_ts) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/expired'); // No back button
    }
  };
  const interval = setInterval(check, 1000);
  return () => clearInterval(interval);
}, [keys]);
```

## 🎯 **Multi-Service Support**

Mỗi dịch vụ là một đường riêng biệt:
- `123.com/lootlab-8kL96Hj/2h` → `/key?lootlab=abcXYZ123`
- `123.com/worklink-9mN7pQr/4h` → `/key?worklink=defUVW456`
- `123.com/linkvertise-2xY8zWx/8h` → `/key?linkvertise=ghiSTU789`

Mỗi đường có nhiều nhánh thời gian key khác nhau.

## 🔒 **Security Features**

1. **Session Isolation**: Mỗi session có unique ID
2. **Time Signature**: URL cố định với chữ ký thời gian
3. **Key Forging**: Key mới hoàn toàn ngẫu nhiên
4. **HWID Binding**: Key chỉ hoạt động trên 1 device
5. **Self-Destruction**: Tự động xóa khi hết hạn
6. **No Back Button**: `window.location.replace()` chặn quay lại

## 📊 **Database Schema**

```sql
user_sessions table:
- key (session_key or forged_key)
- service (service_name or service_name_time)
- expire_ts (expiration timestamp)
- hwid (device binding)
- ip_address (user IP)
- cookies (browser info)
```

**Hệ thống "Đúc Key" với "Chữ ký thời gian" hoàn toàn sẵn sàng!** 🚀
