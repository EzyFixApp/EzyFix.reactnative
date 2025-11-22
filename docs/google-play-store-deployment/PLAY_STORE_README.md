# 📱 Google Play Store Launch Documentation

Tài liệu đầy đủ để chuẩn bị và submit app EzyFix lên Google Play Store.

---

## 📋 Tổng quan

Bộ tài liệu này bao gồm tất cả những gì bạn cần để đưa ứng dụng EzyFix lên Google Play Store, từ việc chuẩn bị assets, viết nội dung, đến quy trình submit và maintain.

---

## 📚 Danh sách tài liệu

### 1. [PLAY_STORE_SUBMISSION_CHECKLIST.md](./PLAY_STORE_SUBMISSION_CHECKLIST.md) ⭐ BẮT ĐẦU TẠI ĐÂY
**Checklist đầy đủ từng bước để submit app**

Nội dung:
- ✅ Pre-submission checklist (app info, assets, legal...)
- 🚀 16 bước chi tiết để submit
- ⏳ Quy trình sau khi submit
- 🔄 Cách update và maintain app
- 🚨 Common issues & solutions

**Dùng khi nào:** Bắt đầu đọc file này trước tiên để có overview toàn bộ quy trình.

---

### 2. [GOOGLE_PLAY_STORE_LISTING.md](./GOOGLE_PLAY_STORE_LISTING.md)
**Tất cả nội dung văn bản cho Store Listing**

Nội dung:
- 🏷️ App name và tagline
- ✍️ Short description (80 ký tự)
- 📄 Full description (4000 ký tự) - Ready to copy-paste
- 🏷️ Category, tags, keywords
- 📧 Contact email
- 🔒 Privacy Policy URL placeholder
- 📝 Release notes template

**Dùng khi nào:** Copy-paste trực tiếp vào Play Console phần "Main store listing"

---

### 3. [PRIVACY_POLICY.md](./PRIVACY_POLICY.md)
**Chính sách bảo mật (Vietnamese + English)**

Nội dung:
- 📋 Thông tin thu thập
- 🔐 Cách sử dụng và bảo mật
- 🤝 Chia sẻ với bên thứ ba
- 👤 Quyền của người dùng
- 📞 Liên hệ

**Dùng khi nào:** 
1. Host file này online (GitHub Pages, Google Docs, hoặc website)
2. Copy URL vào Play Console phần "Privacy Policy"

---

### 4. [ASSETS_REQUIREMENTS.md](./ASSETS_REQUIREMENTS.md)
**Hướng dẫn chi tiết về assets hình ảnh**

Nội dung:
- 🎨 App Icon (512x512)
- 🖼️ Feature Graphic (1024x500) - Template & guidelines
- 📱 Phone Screenshots (8 màn hình cần chụp)
- 🎥 Promo Video (optional)
- 🛠️ Tools và resources

**Dùng khi nào:** 
- Khi cần tạo Feature Graphic
- Khi chụp screenshots
- Tham khảo design guidelines

---

### 5. [DEMO_ACCOUNTS.md](./DEMO_ACCOUNTS.md)
**Thông tin tài khoản demo cho Google reviewers**

Nội dung:
- 👤 Customer demo account
- 🔧 Technician demo account
- 📝 Instructions for reviewers (English + Vietnamese)
- 🛠️ Setup guide cho dev team
- ✅ Testing checklist

**Dùng khi nào:**
1. Dev team: Tạo demo accounts trên backend
2. Play Console: Copy instructions vào phần "App access"

---

### 6. [RELEASE_NOTES.md](./RELEASE_NOTES.md)
**Template ghi chú phát hành cho mỗi version**

Nội dung:
- 📝 Version 1.0.0 (Initial release) - Ready to use
- 🔄 Templates cho updates sau (1.0.1, 1.1.0, 2.0.0...)
- 📋 Guidelines viết release notes
- 🔢 Version history tracking

**Dùng khi nào:**
- Copy release notes cho version 1.0.0 vào Play Console
- Update cho các version sau

---

## 🚀 Quick Start Guide

### 1️⃣ Chuẩn bị (1-2 ngày)

```bash
# 1. Đọc checklist
✅ Mở PLAY_STORE_SUBMISSION_CHECKLIST.md
✅ Đánh dấu những gì đã có, chưa có

# 2. Tạo demo accounts trên backend
✅ Xem DEMO_ACCOUNTS.md
✅ Tạo 2 accounts: customer & technician

# 3. Host Privacy Policy online ✅ DONE
✅ Website: https://ezyfix.site/privacy-policy
✅ Upload nội dung PRIVACY_POLICY.md lên website
✅ Verify URL accessible publicly
```

### 2️⃣ Tạo Assets (2-4 giờ)

```bash
# 1. Feature Graphic
✅ Mở ASSETS_REQUIREMENTS.md
✅ Follow template để tạo 1024x500 graphic
✅ Tool: Canva hoặc Figma

# 2. Screenshots
✅ Run app: npm start
✅ Chụp 8 màn hình theo hướng dẫn
✅ Optional: Add device frames với Mockuphone

# 3. Organize files
mkdir -p docs/play-store-assets
# Save all assets vào folder này
```

### 3️⃣ Build AAB (15-30 phút)

```bash
# 1. Đảm bảo eas.json đã cấu hình đúng (production builds AAB)
# ✅ Đã update trong lần trước

# 2. Build
eas login
eas build --platform android --profile production

# 3. Đợi build hoàn thành (15-20 phút)
# 4. Tải AAB file về
```

### 4️⃣ Submit to Play Console (1-2 giờ)

```bash
# Follow từng bước trong PLAY_STORE_SUBMISSION_CHECKLIST.md
# Steps 1-16

# Key steps:
✅ Create app on Play Console
✅ Upload assets
✅ Copy-paste descriptions từ GOOGLE_PLAY_STORE_LISTING.md
✅ Add Privacy Policy URL
✅ Add demo account instructions từ DEMO_ACCOUNTS.md
✅ Upload AAB
✅ Copy release notes từ RELEASE_NOTES.md
✅ Submit for review
```

### 5️⃣ Chờ Review (1-3 ngày)

```bash
# Google sẽ review app
# Check email và Play Console dashboard daily
# Nếu có vấn đề, Google sẽ gửi email
```

---

## 📂 File Structure

```
docs/
├── PLAY_STORE_README.md (this file) ⭐
├── PLAY_STORE_SUBMISSION_CHECKLIST.md
├── GOOGLE_PLAY_STORE_LISTING.md
├── PRIVACY_POLICY.md
├── ASSETS_REQUIREMENTS.md
├── DEMO_ACCOUNTS.md
├── RELEASE_NOTES.md
└── play-store-assets/ (create this)
    ├── icon/
    │   └── icon-512x512.png
    ├── feature-graphic/
    │   └── feature-graphic-1024x500.png
    ├── screenshots/
    │   └── phone/
    │       ├── 01-home.png
    │       ├── 02-book-service.png
    │       ├── 03-quotes.png
    │       ├── 04-tracking.png
    │       ├── 05-payment.png
    │       ├── 06-review.png
    │       ├── 07-tech-dashboard.png
    │       └── 08-tech-orders.png
    └── video/ (optional)
        └── promo-video.mp4
```

---

## ✅ Status Checklist

### 📱 App Ready
- [x] App tested on real device
- [x] No crashes
- [x] All features working
- [x] Version 1.0.0 ready

### 📄 Content Ready
- [x] App name: EzyFix ✅
- [x] Short description (80 chars) ✅
- [x] Full description (4000 chars) ✅
- [x] Release notes ✅

### 🎨 Assets
- [x] App icon (512x512) ✅ assets/logononame.png
- [ ] Feature graphic (1024x500) ❌ Cần tạo
- [ ] Screenshots (8 images) ❌ Cần chụp
- [ ] Promo video ⚪ Optional

### 🔒 Legal & Privacy
- [x] Privacy Policy written ✅ PRIVACY_POLICY.md
- [x] Privacy Policy hosted online ✅ https://ezyfix.site/privacy-policy
- [x] Demo accounts ready ✅ DEMO_ACCOUNTS.md
- [ ] Demo accounts created on backend ❌ Cần tạo

### 🏗️ Technical
- [x] eas.json configured for AAB ✅
- [ ] AAB file built ❌ Chưa build
- [x] Package name: site.ezyfix.app ✅

### 📝 Play Console
- [ ] Developer account created ($25) ❌
- [ ] App created on Play Console ❌
- [ ] Store listing filled ❌
- [ ] AAB uploaded ❌
- [ ] Submitted for review ❌

---

## 🎯 Priorities

### 🔥 Urgent (Cần làm trước)
1. **~~Host Privacy Policy online~~** ✅ DONE
   - URL: https://ezyfix.site/privacy-policy
   - Upload nội dung từ PRIVACY_POLICY.md
   
2. **Tạo Feature Graphic (1024x500)**
   - Dùng Canva với template
   - Hoặc thuê designer (Fiverr ~$10-30)

3. **Chụp Screenshots (8 ảnh)**
   - Run app trên emulator/device
   - Chụp 8 màn hình theo ASSETS_REQUIREMENTS.md

4. **Tạo demo accounts trên backend**
   - demo.customer@ezyfix.com
   - demo.technician@ezyfix.com

### ⚡ Important (Sau đó)
5. Build AAB file
6. Tạo Google Play Developer account ($25)
7. Submit lên Play Console

### 💡 Nice to have (Optional)
8. Promo video
9. English localization
10. Tablet screenshots

---

## 💰 Cost Breakdown

| Item | Cost | Note |
|------|------|------|
| Google Play Developer Account | $25 | One-time fee |
| Privacy Policy hosting | $0 | GitHub Pages (free) |
| Feature Graphic design | $0-30 | DIY (Canva) or Fiverr |
| Screenshots | $0 | DIY |
| Promo Video | $0-100 | Optional, DIY or hire |
| **Total** | **$25-155** | Minimum $25 |

---

## ⏱️ Time Estimate

| Task | Time | Who |
|------|------|-----|
| Read docs & planning | 1 hour | PM/Dev |
| Create demo accounts | 30 min | Dev |
| Host Privacy Policy | 15 min | Dev |
| Create Feature Graphic | 1-2 hours | Designer |
| Capture Screenshots | 1 hour | QA/Marketing |
| Build AAB | 30 min | Dev |
| Play Console setup | 1 hour | PM |
| Fill store listing | 1 hour | Marketing |
| Submit | 30 min | PM |
| **Total** | **~6-8 hours** | Team |
| Google Review | 1-3 days | Google |

---

## 📞 Support & Questions

### Internal Team
- **Dev questions**: dev@ezyfix.com
- **Marketing questions**: marketing@ezyfix.com
- **General**: support@ezyfix.com

### External Resources
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [React Native Docs](https://reactnative.dev/)

---

## 🔄 Next Steps After Launch

1. **Monitor performance**
   - Track installs, active users
   - Monitor crash reports (Firebase Crashlytics)
   - Read and respond to reviews

2. **Marketing**
   - Share Play Store link on social media
   - Create landing page
   - Run ads (Google Ads, Facebook Ads)

3. **Updates**
   - Plan version 1.0.1 bug fixes
   - Collect user feedback
   - Prioritize feature requests

4. **Expansion**
   - Add more cities (Hà Nội, Đà Nẵng)
   - Add iOS version
   - International markets

---

**🚀 Chúc may mắn với việc launch app!**

**Last updated**: November 22, 2025  
**Maintained by**: EzyFix Team  
**Version**: 1.0.0
