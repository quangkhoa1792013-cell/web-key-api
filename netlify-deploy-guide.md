# Netlify Deployment Guide

## 🚀 Chuẩn bị Frontend cho Netlify

### ✅ Đã hoàn tất:
1. **API Base URL**: Đã cập nhật sang `https://khoablabla-backend.hf.space`
2. **Fallback URLs**: Đã thay thế localhost:5000 → Hugging Face
3. **_redirects**: Đã proxy API sang Hugging Face
4. **Environment**: VITE_API_BASE_URL = https://khoablabla-backend.hf.space

### 📋 Files cần thiết cho Netlify:

#### **1. public/_redirects** (✅ Đã có)
```
# Netlify Redirects - Fix 404 when F5
# Handle React Router routes

# API routes - proxy to Hugging Face
/api/*  https://khoablabla-backend.hf.space/:splat  200

# React Router routes - serve index.html
/*    /index.html   200
```

#### **2. netlify.toml** (Cần tạo)
```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  VITE_API_BASE_URL = "https://khoablabla-backend.hf.space"

[[redirects]]
  from = "/api/*"
  to = "https://khoablabla-backend.hf.space/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### **3. package.json build scripts** (Kiểm tra)
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 🎯 Các bước deploy:

#### **Step 1: Build Frontend**
```bash
cd frontend
npm install
npm run build
```

#### **Step 2: Deploy lên Netlify**
1. Đăng nhập Netlify
2. Kéo thả folder `dist` vào Netlify
3. Hoặc dùng Git: Connect GitHub repository

#### **Step 3: Cấu hình Environment**
- Trong Netlify dashboard:
  - Site settings → Build & deploy → Environment
  - Thêm: `VITE_API_BASE_URL = https://khoablabla-backend.hf.space`

### 🔧 Kiểm tra sau deploy:

1. **API Calls**: Mở browser dev tools → Network
2. **React Router**: F5 trên các trang không nên 404
3. **CORS**: Backend phải cho phép domain Netlify

### 📱 Domain mẫu:
- **Backend**: https://khoablabla-backend.hf.space
- **Frontend**: https://khoablabla.netlify.app
- **API Test**: https://khoablabla.netlify.app/api/test-db

### ⚠️ Lưu ý:
- Backend CORS đã cấu hình cho `*.netlify.app`
- Frontend dùng VITE_API_BASE_URL từ environment
- _redirects đảm bảo API calls không bị CORS
- Port 7860 cho Hugging Face, port 3000/5173 cho local

### 🚀 Ready for Netlify!
Frontend đã sẵn sàng deploy lên Netlify với backend Hugging Face.
