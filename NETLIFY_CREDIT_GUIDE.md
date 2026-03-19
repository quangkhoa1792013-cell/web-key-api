# 📊 NETLIFY CREDIT & COST MANAGEMENT GUIDE

## 🎯 **Bảng tra cứu nhanh**

| Hành động | Tín chỉ | Chi phí | Ghi chú |
|-----------|---------|---------|----------|
| **Triển khai sản xuất (Deploy)** | 15 tín chỉ / lần | - | Ghi chú cho dự án của bạn |
| **Tính năng** | 1 tín chỉ / lần | - | - |
| **Chi phí tín dụng** | - | - | - |
| **Ghi chú cho dự án của bạn** | - | - | - |
| **Triển khai sản xuất (Deploy)** | 15 tín chỉ / lần | - | Mỗi lần Windsurf git push lên nhánh chính là bạn mất 15 điểm |

## 📡 **Băng thông (Bandwidth)**
- **10 tín chỉ / 1 GB**
- Khi bạn hoặc người dùng vào web tải giao diện React về

## 🌐 **Yêu cầu Web (Requests)**
- **3 tín chỉ / 10.000 yêu cầu**
- Bao gồm lượt xem trang, gọi API tới Backend, tải ảnh, CSS

## ⚡ **Điện toán (Compute)**
- **5 tín chỉ / 1 GB-giờ**
- Nếu bạn dùng Netlify Functions (Serverless) để làm Backend

## 📝 **Gửi biểu mẫu (Forms)**
- **1 tín chỉ / lần**
- Nếu bạn dùng tính năng Form của Netlify

---

## ❌ **Tại sao bạn bị trừ điểm dù "không làm gì nhiều"?**

Dựa vào tài liệu, có 2 nguyên nhân chính khiến "ví" Netlify của bạn cạn kiệt:

### 🚨 **1. Tần suất Deploy quá cao**
- **Tài liệu ghi rõ:** Triển khai sản xuất tiêu tốn 15 tín chỉ
- **Nếu trong quá trình code, bạn và Windsurf thực hiện 10 lần git push để sửa lỗi nhỏ, bạn đã mất ngay 150 điểm**

### 💡 **Lời khuyên:**
- **Hãy gom nhiều thay đổi vào 1 lần Commit/Push duy nhất**

### 🚫 **2. Hạn mức gói Miễn phí (Free)**
- **Bạn chỉ có 300 tín chỉ/tháng**
- **Với 300 điểm, bạn chỉ được phép Deploy tối đa 20 lần/tháng** (nếu không có lưu lượng truy cập)
- **Đây là con số rất ít đối với một người đang phát triển dự án và sửa lỗi liên tục**

---

## 🛡️ **Chiến thuật "Sinh tồn" cho dự án của bạn**

Để không bị rơi vào tình trạng "Site not available" (Trang web bị tạm dừng) khi hết 300 điểm, hãy bảo Windsurf áp dụng các quy tắc sau:

### 🔍 **1. Dùng "Preview Deploy" để test**
- **Tài liệu nói:** Triển khai bản xem trước tiêu tốn 0 điểm
- **Thay vì push thẳng vào nhánh main (Production), hãy tạo một nhánh phụ để test**
- **Netlify sẽ cho bạn một link preview miễn phí để kiểm tra giao diện mà không trừ 15 điểm nào**

### 🚫 **2. Chặn Bot rác**
- **Vì mỗi 10.000 request mất 3 điểm, nếu có bot quét linh tinh, bạn sẽ mất điểm oan**
- **Tuy nhiên, con số 10.000 khá lớn nên đây không phải là mối lo chính bằng việc Deploy**

### ⚡ **3. Hạn chế gọi API thừa**
- **Mỗi lần Frontend gọi /api/check-key là 1 request**
- **Hãy tối ưu để không gọi API liên tục** (ví dụ: thay vì 1 giây gọi 1 lần để check key, hãy tăng lên 30 giây hoặc chỉ check khi F5)

---

## 💳 **Cách xử lý khi hết điểm (Credit)**

### 🆓 **Gói Miễn phí (Free)**
- **Nếu hết 300 điểm, Netlify sẽ khóa cứng trang web của bạn cho đến chu kỳ tháng sau**
- **Bạn không có tùy chọn mua thêm trừ khi nâng cấp lên gói Cá nhân (Personal) giá 5$/tháng (được 1.000 điểm)**

### ⚠️ **Kiểm soát Tự động nạp tiền**
- **Nếu bạn nâng cấp, hãy cẩn thận với tính năng "Tự động sạc"**
- **Nó sẽ tự trừ tiền trong thẻ khi bạn hết điểm để giữ web hoạt động**

---

## 📋 **Tóm lại: "Kẻ thù" lớn nhất của bạn hiện tại**

### 🎯 **Kẻ thù:** Nút Push
- **Mỗi git push lên nhánh chính = -15 điểm**
- **10 lần push = -150 điểm**

### 💡 **Nhắc nhở Windsurf:**
- **"Chỉ push lên nhánh chính khi đã chắc chắn code chạy ngon ở máy local!"**

---

## 🚀 **Best Practices cho Netlify Free Plan**

### ✅ **Để tối ưu tín chỉ:**
1. **Gom commit:** Gom nhiều thay đổi vào 1 commit duy nhất
2. **Test local:** Đảm bảo code chạy ổn trước khi push
3. **Dùng preview:** Tạo branch test để kiểm tra trước khi deploy
4. **Tối ưu API:** Giảm số lần gọi API không cần thiết
5. **Monitor usage:** Theo dõi mức tiêu thụ hàng tháng

### 📊 **Cách tính toán:**
- **Deploy:** 15 tín chỉ × 20 lần = 300 tín chỉ/tháng
- **Request:** 10.000 requests × 3/10.000 = 3 tín chỉ × 100 = 300 tín chỉ/tháng
- **Total:** 300 + 300 = 600 tín chỉ/tháng (vượt gói Free)

### 🎯 **Mục tiêu:**
- **Giảm xuống dưới 300 tín chỉ/tháng**
- **Tăng thời gian giữa các lần deploy**
- **Tối ưu lượng request**

---

## 🔧 **Cấu hình đề xuất**

### 📝 **.github/workflows/deploy-netlify.yml**
```yaml
on:
  workflow_dispatch:  # Chỉ khi nào Admin ra lệnh 'Deploy' thì mới được build
  push:
    branches: [ main ]
    paths:
      - 'frontend/**'  # Chỉ build khi có thay đổi trong frontend
```

### 📋 **netlify.toml**
```toml
# Disable auto-deploy - Chỉ khi nào Admin ra lệnh 'Deploy' thì mới được build
[build.processing]
  skip_processing = false
  processing = "manual"  # Tắt auto-deploy
```

---

**📌 QUAN TRỌNG:** Hãy coi mỗi git push như một "khoản chi" 15 tín chỉ!
