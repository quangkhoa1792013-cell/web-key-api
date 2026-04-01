# URL Audit Report - Frontend Directory

**Ngày audit:** 01/04/2026  
**Phạm vi:** Toàn bộ thư mục `frontend/`  
**Mục đích:** Tìm kiếm URL, API endpoints và placeholders cần configuration

---

## 📊 Bảng Thống Kê URL

| File Name | Current URL | Intent | Action Required |
|-----------|--------------|---------|----------------|
| `index.html` | `https://api.example.com` | Preconnect đến API endpoint | **Cần thay bằng `VITE_API_BASE_URL`** |
| `index.html` | `https://fonts.googleapis.com` | Preconnect Google Fonts | Giữ nguyên (OK) |
| `index.html` | `https://fonts.gstatic.com` | Preconnect Google Fonts CDN | Giữ nguyên (OK) |
| `index.html` | `https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap` | Load Google Fonts | Giữ nguyên (OK) |
| `vite.config.js` | `http://127.0.0.1:7860` | Proxy target cho API development | **Cần thay bằng `VITE_API_PROXY_TARGET`** |
| `src/api/keyApi.js` | `import.meta.env.VITE_API_BASE_URL || '/api'` | Base URL cho API calls | Đã dùng env var (OK) |
| `js/key-system.js` | `http://127.0.0.1:5000` | API endpoint cho legacy system | **Cần thay bằng `VITE_LEGACY_API_URL`** |
| `legacy_assets/luarmor-key.html` | `https://cdn.tailwindcss.com` | Load Tailwind CSS CDN | Giữ nguyên (OK) |
| `legacy_assets/luarmor-key.html` | `https://fonts.googleapis.com/icon?family=Material+Icons` | Load Material Icons | Giữ nguyên (OK) |
| `legacy_assets/luarmor-key.html` | `https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap` | Load Google Fonts | Giữ nguyên (OK) |
| `legacy_assets/luarmor-key.html` | `http://127.0.0.1:5000/create-key` | API endpoint tạo key | **Cần thay bằng `VITE_CREATE_KEY_ENDPOINT`** |
| `legacy_assets/luarmor-key.html` | `https://cdn-icons-png.flaticon.com/512/6193/6193004.png` | Load icon image | Giữ nguyên (OK) |
| `legacy_assets/key-table.html` | `https://cdn.tailwindcss.com` | Load Tailwind CSS CDN | Giữ nguyên (OK) |
| `legacy_assets/key-table.html` | `https://fonts.googleapis.com/icon?family=Material+Icons` | Load Material Icons | Giữ nguyên (OK) |
| `legacy_assets/key-table.html` | `http://127.0.0.1:5000/create-key` | API endpoint tạo key | **Cần thay bằng `VITE_CREATE_KEY_ENDPOINT`** |
| `src/main.jsx` | `/sw.js` | Service Worker registration | Giữ nguyên (OK) |

---

## 🎭 Mock Data Detection

### Files có Mock Data cần thay thế:

| File Name | Mock Data Type | Line | Action Required |
|-----------|-----------------|-------|----------------|
| `src/pages/Result.jsx` | `mockResultData` object với `DEMO-KEY-1234-ABCD-EFGH` | 52-54 | **Đã đánh dấu TODO** |
| `src/pages/Result.jsx` | `setTimeout` simulation cho API calls | 81-89 | **Đã đánh dấu TODO** |
| `src/pages/Processing.jsx` | `setTimeout` simulation cho processing stages | 76 | **Đã đánh dấu TODO** |
| `src/App.jsx` | `setTimeout` simulation cho app initialization | 75 | **Đã đánh dấu TODO** |

### Chi tiết Mock Data:

#### 1. Result.jsx - Complete Mock Implementation
```javascript
// TODO: REPLACE WITH REAL API
const mockResultData = {
  success: true,
  key: keyData?.key || 'DEMO-KEY-1234-ABCD-EFGH', // Mock key
  status: 'active',
  // ... rest of mock data
}

// TODO: REPLACE WITH REAL API
// const result = await api.getResult(sessionId);
// Mock data simulation
// TODO: REPLACE WITH REAL API
setTimeout(() => {
  setResultData(mockResultData);
  setIsLoading(false);
}, 1000);
```

#### 2. Processing.jsx - Processing Simulation
```javascript
// TODO: REPLACE WITH REAL API PROCESSING
await new Promise(resolve => setTimeout(resolve, stage.duration));
```

#### 3. App.jsx - Initialization Simulation
```javascript
// TODO: REPLACE WITH REAL INITIALIZATION
await new Promise(resolve => setTimeout(resolve, 1500));
```

---

## 🚨 Các Vấn Đề Cần Khắc Phục

### 1. **API Example.com Placeholder**
- **File:** `index.html`
- **Vấn đề:** `https://api.example.com` là placeholder
- **Action:** Thay bằng `VITE_API_BASE_URL` environment variable
- **Mã đề xuất:**
```html
<link rel="preconnect" href="%VITE_API_BASE_URL%" />
```

### 2. **Hardcoded Development URLs**
- **Files:** `vite.config.js`, `js/key-system.js`, `legacy_assets/*.html`
- **Vấn đề:** Hardcoded `127.0.0.1` addresses
- **Action:** Sử dụng environment variables
- **Mã đề xuất:**
```javascript
// vite.config.js
target: process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:7860'

// Legacy files
this.apiUrl = import.meta.env.VITE_LEGACY_API_URL || 'http://127.0.0.1:5000'
```

### 3. **Inconsistent API Endpoints**
- **Files:** Legacy files sử dụng `/create-key`, React app sử dụng `/api`
- **Vấn đề:** Không nhất quán về endpoint structure
- **Action:** Chuẩn hóa tất cả endpoints qua environment variables

---

## ✅ Các URL Đã Đúng Chuẩn

### Google Fonts & CDNs
- Tất cả Google Fonts URLs đều hợp lệ
- CDN URLs (Tailwind, Icons) đều ổn định
- Không cần thay đổi

### Environment Variables Đã Sử Dụng
- `src/api/keyApi.js` đã dùng `VITE_API_BASE_URL` đúng cách
- Cần mở rộng cho các file khác

---

## 🔧 Environment Variables Đã Tạo

✅ **Đã tạo file `.env` trong thư mục `frontend/` với nội dung:**

```env
# API Configuration
VITE_API_BASE_URL=https://khoablabla-backend.hf.space
VITE_API_PROXY_TARGET=https://khoablabla-backend.hf.space
```

---

## ✅ **ĐÃ THỰC HIỆN CÁC THAY ĐỔI**

### 📝 **Environment Variables**
- ✅ **Tạo file `.env`** với URLs thật từ khoablabla-backend.hf.space

### 🌐 **URL Updates**
- ✅ **`index.html`**: Thay `https://api.example.com` → `https://khoablabla-backend.hf.space`
- ✅ **`vite.config.js`**: Thay hardcoded target → `process.env.VITE_API_PROXY_TARGET`

### 🎭 **Mock Data Replacement**
- ✅ **`Result.jsx`**: 
  - Xóa object `mockResultData`
  - Thay thế bằng API call: `await getKeyInfo({ sessionId })`
  - Thêm 300ms delay cho animation mượt
  
- ✅ **`Processing.jsx`**:
  - Thay `setTimeout` simulation bằng **real-time polling**
  - Endpoint: `/api/check-status` với 500ms intervals
  - Max 20 attempts (10s timeout)
  - Thêm 300ms delay cho animation mượt
  
- ✅ **`App.jsx`**:
  - Xóa 1.5s fake timeout
  - Thay bằng **session validation từ AuthContext**
  - Thêm 300ms delay cho animation mượt

### 🎨 **Animation Optimization**
- ✅ **Thêm 300ms delays** ở tất cả các API calls để đảm bảo animation mượt
- ✅ **Polling mechanism** với 500ms intervals cho real-time updates
- ✅ **Graceful timeout handling** với fallback logic

---
VITE_API_PROXY_TARGET=http://127.0.0.1:7860
VITE_LEGACY_API_URL=http://127.0.0.1:5000
VITE_CREATE_KEY_ENDPOINT=http://127.0.0.1:5000/create-key

# Development
VITE_DEV_MODE=true
```

---

## 📋 Action Items

1. **Cấp độ Ưu tiên Cao:**
   - [ ] Thay `https://api.example.com` trong `index.html`
   - [ ] Config `VITE_API_PROXY_TARGET` trong `vite.config.js`
   - [ ] Update legacy files với environment variables

2. **Cấp độ Ưu tiên Trung bình:**
   - [ ] Tạo `.env` file template
   - [ ] Document tất cả environment variables
   - [ ] Test với production URLs

3. **Cấp độ Ưu tiên Thấp:**
   - [ ] Review và optimize CDN URLs
   - [ ] Consider self-hosting fonts/icons
   - [ ] Add fallback URLs

---

## 📈 Tóm Tắt

- **Tổng số URL tìm thấy:** 16
- **URL cần thay đổi:** 5
- **URL đã đúng chuẩn:** 11
- **Environment variables cần thêm:** 4

**Trạng thái:** ⚠️ Cần action để production-ready
