# 🎨 Hướng Dẫn Thiết Lập Logo cho EzyFix App

## ✅ ĐÃ CẤU HÌNH

### 1. **Tên App**
- ✅ Tên hiển thị: **"EzyFix"**
- ✅ Package name: `com.ezyfix.app`
- ✅ Scheme: `EzyFix`

### 2. **App Icon (Biểu tượng trên màn hình chờ)**
- ✅ Sử dụng: `./assets/logononame.png`
- ✅ Adaptive icon: `./assets/logononame.png` với nền trắng
- ✅ **Icon sẽ KHÔNG còn bị trắng bóc nữa!**

### 3. **Notification Icon**
- ✅ Sử dụng: `./assets/logononame.png`
- ✅ Màu accent: `#FF6B35` (cam EzyFix)

---

## 📋 YÊU CẦU VỀ LOGO

### **Logo Hiện Tại: `logononame.png`**
- ✅ Đã có trong `assets/logononame.png`
- ✅ Đã cấu hình cho app icon
- ✅ Đã cấu hình cho notification icon

### **Kích Thước Khuyến Nghị:**

#### **App Icon:**
- **1024x1024 px** (khuyến nghị cho iOS & Android)
- Format: PNG với nền trong suốt hoặc trắng
- Logo đã OK: `logononame.png`

#### **Notification Icon (Tối ưu - TÙY CHỌN):**
Để notification icon hiển thị đẹp nhất trên Android status bar, bạn NÊN tạo thêm một icon đơn sắc:

1. **Tạo file mới**: `assets/notification-icon.png`
2. **Yêu cầu**:
   - Kích thước: **96x96 px** (hoặc 192x192 px)
   - **PHẢI là ảnh trắng trên nền trong suốt** (silhouette)
   - Chỉ có logo outline, không có màu sắc
   - Format: PNG 32-bit với alpha channel

3. **Cách tạo** (sử dụng Photoshop/Figma/Canva):
   - Mở `logononame.png`
   - Chuyển thành đen trắng
   - Đổi phần logo thành màu trắng (#FFFFFF)
   - Xóa nền hoàn toàn (transparent)
   - Xuất file PNG

4. **Sau khi tạo xong**, cập nhật `app.json`:
```json
"android": {
  "notification": {
    "icon": "./assets/notification-icon.png",  // Icon đơn sắc
    "color": "#FF6B35"  // Màu nền cho icon
  }
}
```

---

## 🚀 BUILD APK

### **Lệnh Build:**
```bash
# Build APK preview (test)
eas build -p android --profile preview

# Build APK production (phát hành)
eas build -p android --profile production
```

### **Kiểm Tra Sau Khi Build:**
1. ✅ Tên app hiển thị: **"EzyFix"** (không phải "EzyFixMobile")
2. ✅ Icon trên màn hình chờ: Logo EzyFix đầy màu sắc (không còn trắng)
3. ✅ Icon trong notification: 
   - Nếu dùng `logononame.png`: Logo màu cam trong notification
   - Nếu tạo `notification-icon.png`: Icon trắng trên nền cam

---

## 🔧 TỐI ƯU THÊM (TÙY CHỌN)

### **Splash Screen (Màn hình chờ khởi động):**
Bạn có thể cập nhật splash screen để sử dụng logo mới:

```json
"splash": {
  "image": "./assets/logononame.png",  // Thay đổi từ splash.png
  "resizeMode": "contain",
  "backgroundColor": "#ffffff"
}
```

Hoặc tạo splash screen riêng với kích thước **1242x2436 px** cho đẹp hơn.

---

## 📱 KẾT QUẢ MONG ĐỢI

### **Trước khi cấu hình:**
- ❌ Tên app: "EzyFixMobile"
- ❌ Icon màn hình chờ: Trắng bóc
- ❌ Notification: Không có logo

### **Sau khi cấu hình:**
- ✅ Tên app: **"EzyFix"**
- ✅ Icon màn hình chờ: **Logo EzyFix đầy đủ màu sắc**
- ✅ Notification: **Logo EzyFix** (hoặc icon đơn sắc nếu bạn tạo thêm)

---

## 🎯 CHECKLIST

- [x] Đổi tên app thành "EzyFix"
- [x] Cập nhật app icon thành `logononame.png`
- [x] Cập nhật adaptive icon cho Android
- [x] Thêm notification icon
- [ ] (TÙY CHỌN) Tạo notification icon đơn sắc cho đẹp hơn
- [ ] (TÙY CHỌN) Cập nhật splash screen

---

## 📞 LƯU Ý

1. **Icon đơn sắc cho notification** KHÔNG BẮT BUỘC nhưng khuyến nghị để:
   - Hiển thị đẹp hơn trên status bar Android
   - Tuân thủ Material Design Guidelines
   - Tăng tính chuyên nghiệp

2. **Build lại APK** sau khi thay đổi logo:
   - Chạy `eas build -p android --profile preview`
   - Hoặc `eas build -p android --profile production`

3. **Test notification** sau khi cài APK mới:
   - Tạo đơn hàng mới
   - Kiểm tra notification có hiển thị logo đúng không

---

## 🎨 FILE ASSETS HIỆN TẠI

```
assets/
  ├── logononame.png          ✅ Đang dùng cho app icon & notification
  ├── Logo.png                (Có thể không cần)
  ├── icon.png                (Không dùng nữa)
  ├── adaptive-icon.png       (Không dùng nữa)
  ├── splash.png              (Có thể thay bằng logononame.png)
  └── notification-icon.png   ⚠️ CẦN TẠO (tùy chọn, cho đẹp hơn)
```

---

**Tóm lại:** Đã cấu hình xong! Bạn chỉ cần build lại APK là logo sẽ xuất hiện đúng. Nếu muốn notification đẹp hơn, hãy tạo thêm icon đơn sắc như hướng dẫn ở trên! 🚀
