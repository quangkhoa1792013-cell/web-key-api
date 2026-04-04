# 🕵️ BÁO CÁO CỦA CHUYÊN GIA DEBUG (DEBUGGER REPORT)

**Ngày báo cáo:** 04/04/2026
**Trạng thái hệ thống:** ❌ CRITICAL FAILURE (Không thể kết nối Frontend-Backend)
**Mục tiêu cho Claude:** Đồng bộ hóa API, sửa lỗi sập server và thay thế logic "giả" bằng dữ liệu "thật".

---

## 🛑 1. LỖI CHÍ MẠNG TẠI BACKEND (flask_app.py)

### 1.1. Lỗi cú pháp & Import
- **Lỗi:** Thiếu `from flask import redirect`.
- **Vị trí:** Dòng 22.
- **Hậu quả:** Server sập khi chạy đến các hàm `handle_service_redirect` hoặc `validate_key_access` (Dòng 1121, 1124, 1131, 1222).

### 1.2. Trùng lặp Route (Route Collision)
- **Lỗi:** Route `/api/mark-session` được định nghĩa 2 lần.
    - Lần 1: Dòng 586 (hàm `mark_session`).
    - Lần 2: Dòng 1241 (hàm `mark_session_start`).
- **Yêu cầu:** Claude hãy hợp nhất hoặc xóa bỏ sự trùng lặp này, đảm bảo logic lưu session vào database là duy nhất.

### 1.3. Thiếu Endpoint cho Roblox
- **Lỗi:** Script `roblox_script.lua` đang gọi `/api/validate-key` và `/api/heartbeat` nhưng Backend chưa có.
- **Yêu cầu:** Viết thêm 2 endpoint này để nhận `key` và `hwid`, kiểm tra trong bảng `user_sessions` và trả về trạng thái `success: true`.

### 1.4. Logic "Giả" (Mock Logic)
- **Vị trí:** Hàm `check_status` (Dòng 959).
- **Lỗi:** Hiện đang trả về `status: completed` sau 0.5s một cách giả tạo.
- **Yêu cầu:** Sửa lại để truy vấn database, kiểm tra cột `process_completed` của session tương ứng.

---

## 🔗 2. BẤT ĐỒNG BỘ API (keyApi.js)

### 2.1. Sai đường dẫn (Path Mismatch)
- **Lỗi:** Frontend đang gọi `/key/request`, `/key/verify`, `/auth/session`... trong khi Backend dùng `/api/mark-session`, `/api/verify-session`, v.v.
- **Yêu cầu:** Sửa lại `keyApi.js` để khớp 100% với các route trong `flask_app.py`. Tiền tố phải là `/api/`.

### 2.2. Lỗi IP ảo (Fake IP)
- **Vị trí:** `keyApi.js` (Dòng 42) và `AuthContext.jsx` (Dòng 145).
- **Lỗi:** Tự tạo IP `192.168.1.x` khi không lấy được IP thật.
- **Hậu quả:** Backend sẽ nhận sai IP, dẫn đến lỗi `HWID_MISMATCH` hoặc `SESSION_SHARING_DETECTED`.
- **Yêu cầu:** Luôn sử dụng IP từ `api.ipify.org` hoặc để Backend tự lấy qua `X-Forwarded-For`.

---

## 🎨 3. CẢI THIỆN FRONTEND (UI/UX & Logic)

### 3.1. Loại bỏ Fake Progress
- **Vị trí:** `GetKeyPage.jsx` và `DynamicPage.jsx`.
- **Lỗi:** Sử dụng `setInterval` để tăng `%` thanh tiến trình.
- **Yêu cầu:** Chuyển sang cơ chế **Polling**. Cứ mỗi 3-5 giây, Frontend gọi API `/api/check-status` để lấy trạng thái thực tế từ Backend. Chỉ khi Backend báo `completed`, mới cho phép sang trang nhận Key.

### 3.2. Đồng bộ hóa Session & HWID
- **Vị trí:** `AuthContext.jsx`.
- **Lỗi:** Tự tạo `sessionId` ngẫu nhiên ở Client (`SESS-...`).
- **Yêu cầu:** `sessionId` phải được Backend cấp phát khi người dùng bắt đầu tiến trình (qua API `/api/mark-session`) để đảm bảo session được lưu trong Database.

### 3.3. Hiệu ứng Giao diện (Claude's Specialty)
- **Background:** Nâng cấp lên Deep Midnight/Neon Tím rực rỡ.
- **Card:** Thêm hiệu ứng Glassmorphism với viền phát sáng (Glow border).
- **Transition:** Thêm hiệu ứng mượt mà khi chuyển giữa các View trong `DynamicPage`.

---

## 🛠️ 4. ROBLOX SCRIPT (roblox_script.lua)

- **Lỗi:** `Config.API_URL` có thể sai hoặc thiếu `/api`.
- **Yêu cầu:** Đảm bảo script gọi đúng endpoint mới sẽ được Claude viết ở Backend.

---

**Ghi chú cho Claude:** Bạn là người thực thi. Hãy ưu tiên sửa lỗi Backend để server chạy được, sau đó sửa `keyApi.js` để kết nối, và cuối cùng là làm đẹp giao diện. Chúc may mắn!
