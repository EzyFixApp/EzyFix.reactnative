# 🎨 Google Play Store Assets Requirements

Hướng dẫn chi tiết về các tài nguyên hình ảnh cần chuẩn bị cho Google Play Store.

---

## 📋 Tổng quan Assets cần thiết

| Asset | Kích thước | Format | Số lượng | Bắt buộc |
|-------|-----------|--------|----------|----------|
| App Icon | 512x512 px | PNG (32-bit) | 1 | ✅ Bắt buộc |
| Feature Graphic | 1024x500 px | JPG hoặc PNG | 1 | ✅ Bắt buộc |
| Phone Screenshots | 1080x1920 px | JPG hoặc PNG | 2-8 | ✅ Bắt buộc |
| 7-inch Tablet Screenshots | 1024x600 px | JPG hoặc PNG | 0-8 | ⚪ Tùy chọn |
| 10-inch Tablet Screenshots | 1280x800 px | JPG hoặc PNG | 0-8 | ⚪ Tùy chọn |
| Promo Video | - | YouTube URL | 0-1 | ⚪ Tùy chọn |
| Promotional Graphic | 180x120 px | JPG hoặc PNG | 0-1 | ⚪ Tùy chọn |

---

## 1️⃣ App Icon (Biểu tượng ứng dụng)

### Thông số kỹ thuật
- **Kích thước**: 512x512 pixels
- **Format**: PNG (32-bit)
- **Dung lượng**: Tối đa 1MB
- **Nền**: Trong suốt hoặc có màu

### Yêu cầu thiết kế
- ✅ Logo rõ ràng, dễ nhận diện
- ✅ Không có chữ nhỏ (khó đọc trên icon nhỏ)
- ✅ Màu sắc nổi bật, tương phản cao
- ✅ Đơn giản, không quá phức tạp
- ❌ Không chứa ảnh người thật
- ❌ Không vi phạm bản quyền

### File hiện tại
```
✅ assets/logononame.png (đã có)
```

### Cách xuất từ Figma/Photoshop
```
Export Settings:
- Size: 512x512 px
- Format: PNG
- Bit depth: 32-bit
- Compression: None or Low
```

### Tools tạo icon online
- **Icon Kitchen**: https://icon.kitchen/
- **Figma**: https://figma.com
- **Canva**: https://canva.com

---

## 2️⃣ Feature Graphic (Banner nổi bật)

### Thông số kỹ thuật
- **Kích thước**: 1024x500 pixels
- **Format**: JPG hoặc PNG (24-bit)
- **Dung lượng**: Tối đa 1MB
- **Tỷ lệ**: 2.05:1

### Yêu cầu thiết kế
- ✅ Hiển thị rõ brand identity (logo, màu sắc)
- ✅ Thể hiện tính năng chính của app
- ✅ Text lớn, dễ đọc (nếu có)
- ✅ Hình ảnh chất lượng cao
- ❌ Không quá nhiều text
- ❌ Không có watermark

### Nội dung gợi ý

**Layout 1: Logo + Tagline + Mockup**
```
┌─────────────────────────────────────────┐
│  [Logo EzyFix]                          │
│                                         │
│  App trên tay - Thợ tới ngay          │
│                                         │
│  [Phone mockup showing app]            │
└─────────────────────────────────────────┘
```

**Layout 2: Feature Showcase**
```
┌─────────────────────────────────────────┐
│ [Icon 1]     [Icon 2]     [Icon 3]     │
│ Tìm thợ      Báo giá      Thanh toán  │
│ nhanh        minh bạch    an toàn     │
│                                         │
│        [Phone mockup]                  │
└─────────────────────────────────────────┘
```

### Template Figma/Photoshop
```
Layers:
1. Background (gradient hoặc solid color #609CEF)
2. Logo EzyFix (top left hoặc center)
3. Tagline "App trên tay, thợ tới ngay"
4. Phone mockup (hiển thị UI app)
5. Icons/Features (tùy chọn)
```

### Colors to use
- Primary: `#609CEF` (App blue)
- Secondary: `#4F8EF7` (Lighter blue)
- Accent: `#10B981` (Green)
- Background: White hoặc gradient

### Tools tạo Feature Graphic
- **Canva**: Template "App Banner"
- **Figma**: Community templates
- **Photoshop**: Canvas 1024x500px

---

## 3️⃣ Phone Screenshots (Ảnh chụp màn hình)

### Thông số kỹ thuật
- **Kích thước**: 1080x1920 pixels (9:16)
- **Format**: JPG hoặc PNG (24-bit)
- **Số lượng**: Tối thiểu 2, tối đa 8
- **Dung lượng**: Mỗi ảnh tối đa 8MB

### Kích thước phổ biến
- **16:9**: 1080x1920 px (recommended)
- **18:9**: 1080x2160 px
- **19:9**: 1080x2280 px
- **19.5:9**: 1080x2340 px

### Yêu cầu nội dung
- ✅ Hiển thị các tính năng chính
- ✅ UI thực tế của app (không fake)
- ✅ Text annotations giải thích (nếu cần)
- ✅ Thứ tự logic (theo user flow)
- ❌ Không blur hoặc pixelated
- ❌ Không chứa thông tin nhạy cảm

### Screenshots cần chụp cho EzyFix

#### 📱 For Customer Role (Khách hàng)

**Screenshot 1: Home Screen**
```
Màn hình: app/(tabs)/index.tsx
Nội dung:
- Hero banner với "Tìm thợ sửa chữa"
- Service categories (Điện, Nước, Điều hòa...)
- Active orders section
- Promotions

Annotation (tùy chọn):
"Tìm thợ gần nhất chỉ với vài chạm"
```

**Screenshot 2: Book Service**
```
Màn hình: app/customer/book-service.tsx
Nội dung:
- Service selection form
- Address input với map
- Description textarea
- Photo upload
- Date/time picker

Annotation:
"Đặt lịch nhanh chóng và dễ dàng"
```

**Screenshot 3: Quote Comparison**
```
Màn hình: app/customer/quote-notification.tsx
Nội dung:
- List of quotes from technicians
- Price comparison
- Technician ratings
- Accept/Decline buttons

Annotation:
"So sánh giá từ nhiều thợ"
```

**Screenshot 4: Order Tracking**
```
Màn hình: app/customer/order-tracking.tsx
Nội dung:
- Map showing technician location
- Order status timeline
- ETA display
- Chat button

Annotation:
"Theo dõi thợ realtime trên bản đồ"
```

**Screenshot 5: Payment**
```
Màn hình: app/customer/payment.tsx
Nội dung:
- Payment summary
- PayOS integration
- Secure payment badge

Annotation:
"Thanh toán an toàn qua PayOS"
```

**Screenshot 6: Review**
```
Màn hình: ReviewModal hoặc completed order
Nội dung:
- Star rating
- Review text
- Photo upload
- Submit button

Annotation:
"Đánh giá dịch vụ sau khi hoàn thành"
```

#### 👷 For Technician Role (Thợ sửa chữa)

**Screenshot 7: Technician Dashboard**
```
Màn hình: app/technician/dashboard.tsx
Nội dung:
- Profile card with rating
- Today's stats
- Active orders
- Earnings summary

Annotation:
"Dashboard quản lý công việc"
```

**Screenshot 8: Available Orders**
```
Màn hình: app/technician/orders.tsx
Nội dung:
- List of nearby orders
- Distance indicator
- Service details
- Accept button

Annotation:
"Nhận đơn gần nhất tự động"
```

### Cách chụp screenshots

#### Method 1: Emulator/Simulator (Recommended)
```bash
# Android Studio Emulator
1. Run app: npm start -> a (Android)
2. Open emulator
3. Navigate to screen
4. Press Ctrl+S (Windows) or Cmd+S (Mac)
5. Screenshot saved to Desktop

# iOS Simulator
1. Run: npm start -> i (iOS)
2. Navigate to screen
3. Cmd+S to save screenshot
```

#### Method 2: Real Device
```bash
# Android
1. Enable Developer Options
2. Enable "USB Debugging"
3. Connect via ADB
4. Run: adb shell screencap -p /sdcard/screenshot.png

# iOS
1. Connect device
2. Open Xcode > Devices and Simulators
3. Select device > Take Screenshot
```

#### Method 3: Expo Go (Easiest)
```bash
1. Run: npm start
2. Scan QR code with Expo Go
3. Navigate to screen
4. Take screenshot using device buttons:
   - Android: Power + Volume Down
   - iOS: Power + Volume Up
```

### Post-processing screenshots

**Tools:**
- **Figma**: Add device frame + annotations
- **Photoshop**: Resize, add text
- **Screenshot Studio**: Auto device frames
- **Mockup Generator**: https://mockuphone.com

**Template Frame:**
```
┌─────────────────────┐
│   [Status Bar]      │
│                     │
│   [App Content]     │
│                     │
│                     │
│                     │
│   [Bottom Nav]      │
└─────────────────────┘
```

**Optional Annotations:**
- Add arrow pointing to key feature
- Add text box explaining feature
- Use app colors (#609CEF, #10B981)
- Keep text short (5-8 words max)

---

## 4️⃣ Promo Video (Video quảng cáo)

### Thông số kỹ thuật
- **Platform**: YouTube (unlisted hoặc public)
- **Duration**: 30 seconds to 2 minutes
- **Resolution**: 1080p (1920x1080) minimum
- **Aspect Ratio**: 16:9 hoặc 9:16 (vertical)
- **Format**: MP4, MOV, AVI

### Nội dung gợi ý

**Script (30 giây):**
```
[0-5s] Logo animation + "EzyFix"
[5-10s] Problem: "Máy lạnh hỏng? Đường ống tắc?"
[10-20s] Solution: Quick demo của app (đặt lịch, nhận báo giá, theo dõi)
[20-25s] Features: "Nhanh - Rẻ - An toàn"
[25-30s] CTA: "Tải ngay EzyFix" + logo
```

**Recording Options:**
- Screen recording + voiceover
- Motion graphics (After Effects)
- Live action + screen recording
- Simple slideshow với music

### Tools tạo video
- **CapCut**: Mobile video editor
- **iMovie**: Mac video editor
- **DaVinci Resolve**: Professional (free)
- **Canva Video**: Online editor

### Upload to YouTube
```
1. Create YouTube channel for EzyFix
2. Upload video
3. Set to "Unlisted"
4. Copy YouTube URL
5. Paste in Play Console
```

---

## 5️⃣ Promotional Graphic (Ảnh quảng cáo)

### Thông số kỹ thuật
- **Kích thước**: 180x120 pixels
- **Format**: JPG hoặc PNG (24-bit)
- **Dung lượng**: Tối đa 1MB
- **Tỷ lệ**: 3:2

### Nội dung
- Simplified version của Feature Graphic
- Logo + app name
- Icon hoặc simplified mockup

---

## 📂 File Structure (Đề xuất)

```
docs/
└── play-store-assets/
    ├── README.md (this file)
    ├── icon/
    │   └── icon-512x512.png ✅
    ├── feature-graphic/
    │   ├── feature-graphic-1024x500.png
    │   └── feature-graphic-1024x500.psd (source)
    ├── screenshots/
    │   ├── phone/
    │   │   ├── 01-home.png
    │   │   ├── 02-book-service.png
    │   │   ├── 03-quotes.png
    │   │   ├── 04-tracking.png
    │   │   ├── 05-payment.png
    │   │   ├── 06-review.png
    │   │   ├── 07-tech-dashboard.png
    │   │   └── 08-tech-orders.png
    │   └── tablet/ (optional)
    ├── video/
    │   └── promo-video.mp4
    └── promotional/
        └── promo-graphic-180x120.png
```

---

## 🎨 Design Guidelines

### Colors
```css
Primary: #609CEF (App Blue)
Secondary: #4F8EF7 (Light Blue)
Accent: #10B981 (Success Green)
Background: #F8FAFC (Light Gray)
Text: #1F2937 (Dark Gray)
```

### Typography
```
Heading: Inter Bold / SF Pro Display Bold
Body: Inter Regular / SF Pro Text
Size: 24-32px (headings), 14-16px (body)
```

### Logo Usage
- Always use high-res logo
- Maintain aspect ratio
- Minimum size: 48x48px on screenshots
- Clear space around logo: 16px minimum

---

## ✅ Quality Checklist

### Before uploading:
- [ ] All images are correct size
- [ ] No pixelation or blur
- [ ] Text is readable (if any)
- [ ] Colors match brand (#609CEF)
- [ ] No personal/sensitive info visible
- [ ] No placeholder content (Lorem ipsum)
- [ ] No broken UI elements
- [ ] Consistent device frames (if used)
- [ ] All images under size limit
- [ ] Images show actual app features

---

## 🚀 Quick Start Guide

### Step 1: Capture Screenshots
```bash
# Run app on emulator
npm start

# Navigate through app and capture:
# - Home screen
# - Book service flow
# - Quotes/tracking
# - Payment
# - Reviews
# - Technician dashboard
```

### Step 2: Create Feature Graphic
```
1. Open Canva or Figma
2. Create 1024x500px canvas
3. Add gradient background (#609CEF)
4. Add EzyFix logo
5. Add tagline "App trên tay, thợ tới ngay"
6. Add phone mockup with app screenshot
7. Export as PNG
```

### Step 3: Organize Files
```bash
# Create directory structure
mkdir -p docs/play-store-assets/{icon,feature-graphic,screenshots/phone}

# Move files
cp assets/logononame.png docs/play-store-assets/icon/icon-512x512.png
```

### Step 4: Upload to Play Console
```
1. Go to Play Console > Store Presence > Main Store Listing
2. Upload App Icon (512x512)
3. Upload Feature Graphic (1024x500)
4. Upload Screenshots (2-8 images)
5. Save draft
```

---

## 📚 Resources

### Templates
- **Figma**: https://www.figma.com/community/tag/app%20store
- **Canva**: https://www.canva.com/templates/s/app-store/
- **Sketch**: https://www.sketchappsources.com/tag/app-store.html

### Mockup Tools
- **Mockuphone**: https://mockuphone.com
- **Screely**: https://screely.com
- **Cleanmock**: https://cleanmock.com

### Screenshot Tools
- **Screenshot Studio**: https://www.screenshotstudio.co
- **AppLaunchpad**: https://theapplaunchpad.com
- **Previewed**: https://previewed.app

### Video Tools
- **CapCut**: Mobile app (iOS/Android)
- **Loom**: https://loom.com (screen recording)
- **Runway**: https://runwayml.com (AI video)

### Google Resources
- **Asset Guidelines**: https://support.google.com/googleplay/android-developer/answer/9866151
- **Design Best Practices**: https://developer.android.com/distribute/marketing-tools/device-art-generator

---

## ❓ FAQ

**Q: Bắt buộc phải có bao nhiêu screenshots?**  
A: Tối thiểu 2, khuyến nghị 4-8 để showcase đầy đủ tính năng.

**Q: Có thể dùng mockup thay vì screenshot thật?**  
A: Được, nhưng phải là UI thật của app, không fake features.

**Q: Screenshot có cần device frame không?**  
A: Không bắt buộc, nhưng professional hơn với frame.

**Q: Video có bắt buộc không?**  
A: Không, nhưng tăng conversion rate 20-30%.

**Q: Tôi có thể thay đổi assets sau khi submit không?**  
A: Có, bạn có thể update bất cứ lúc nào.

---

**Last updated**: November 22, 2025  
**Contact**: design@ezyfix.com
