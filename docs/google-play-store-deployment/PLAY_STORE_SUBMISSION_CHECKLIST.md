# 📱 Google Play Store Submission Checklist

Checklist đầy đủ để submit app lên Google Play Store.

---

## ✅ PRE-SUBMISSION CHECKLIST

### 📄 1. App Information
- [ ] App name: **EzyFix - App trên tay, thợ tới ngay**
- [ ] Package name: `site.ezyfix.app` (không thể thay đổi sau khi publish)
- [ ] Version: `1.0.0`
- [ ] Version code: `1`
- [ ] Default language: **Vietnamese (vi-VN)**

### 🎨 2. Store Listing Assets
- [ ] **App Icon** (512x512 PNG) - ✅ assets/logononame.png
- [ ] **Feature Graphic** (1024x500 JPG/PNG) - ❌ Cần tạo
- [ ] **Phone Screenshots** (2-8 images, 1080x1920) - ❌ Cần chụp
  - [ ] Home screen
  - [ ] Booking flow
  - [ ] Quotes comparison
  - [ ] Order tracking
  - [ ] Payment
  - [ ] Reviews
  - [ ] Technician dashboard
  - [ ] Technician orders
- [ ] **Promo video** (YouTube URL) - ⚪ Optional

### ✍️ 3. Store Listing Text
- [ ] **Short description** (80 chars max)
  ```
  Kết nối nhanh với thợ sửa chữa điện nước chuyên nghiệp tại Việt Nam
  ```
- [ ] **Full description** (4000 chars max) - ✅ Xem GOOGLE_PLAY_STORE_LISTING.md
- [ ] **Release notes** (500 chars) - ✅ Xem RELEASE_NOTES.md

### 🔒 4. Privacy & Legal
- [ ] **Privacy Policy URL** - ❌ Cần host online
  - Option 1: GitHub Pages (free)
  - Option 2: Website công ty
  - Option 3: Google Docs (public)
- [ ] **Terms of Service URL** - ⚪ Optional but recommended
- [ ] **Target age group**: Everyone (hoặc 12+)
- [ ] **Content rating questionnaire** completed

### 👤 5. Demo Accounts (Nếu cần login)
- [ ] **Customer account** created
  ```
  Email: demo.customer@ezyfix.com
  Password: DemoCustomer@2024
  ```
- [ ] **Technician account** created
  ```
  Email: demo.technician@ezyfix.com
  Password: DemoTech@2024
  ```
- [ ] **Instructions for reviewers** written - ✅ Xem DEMO_ACCOUNTS.md

### 🏗️ 6. Build Files
- [ ] **AAB file** built via EAS
  ```bash
  eas build --platform android --profile production
  ```
- [ ] **Signed with upload key** (EAS tự động)
- [ ] **Version code incremented** (nếu update)

### 📱 7. App Testing
- [ ] Tested on physical Android device (not just emulator)
- [ ] Tested all major flows:
  - [ ] Registration/Login
  - [ ] Booking service
  - [ ] Quote acceptance
  - [ ] Order tracking
  - [ ] Payment (test mode)
  - [ ] Reviews
  - [ ] Chat
- [ ] No crashes or ANRs
- [ ] No memory leaks
- [ ] Performance tested (fast loading, smooth animations)
- [ ] Offline behavior graceful (shows error messages)

### 🔔 8. Permissions & Features
- [ ] All permissions declared in app.json:
  - [ ] ACCESS_FINE_LOCATION (GPS)
  - [ ] ACCESS_COARSE_LOCATION (GPS)
  - [ ] CAMERA (Photo upload)
  - [ ] READ_MEDIA_IMAGES (Gallery)
  - [ ] POST_NOTIFICATIONS (Push notifications)
- [ ] Permission rationales clear to users
- [ ] No unnecessary permissions

### 💳 9. Payment Integration
- [ ] PayOS integration working
- [ ] Test mode enabled for demo accounts
- [ ] No hardcoded credentials
- [ ] Secure HTTPS endpoints

### 🌐 10. Localization
- [ ] Vietnamese (vi-VN) - Primary
- [ ] English (en-US) - Optional
- [ ] Error messages in Vietnamese
- [ ] No hardcoded strings

---

## 🚀 SUBMISSION STEPS

### Step 1: Google Play Console Setup
1. [ ] Go to https://play.google.com/console
2. [ ] Login with Google account
3. [ ] Pay $25 one-time developer fee
4. [ ] Complete developer profile
5. [ ] Verify email

### Step 2: Create App
1. [ ] Click **"Create app"**
2. [ ] Fill in app details:
   - [ ] App name: **EzyFix**
   - [ ] Default language: Vietnamese
   - [ ] App or game: **App**
   - [ ] Free or paid: **Free**
3. [ ] Accept declarations
4. [ ] Click **"Create app"**

### Step 3: Store Listing
1. [ ] Navigate to **Store presence > Main store listing**
2. [ ] Upload **App icon** (512x512)
3. [ ] Upload **Feature graphic** (1024x500)
4. [ ] Upload **Screenshots** (2-8 images)
5. [ ] Enter **Short description** (80 chars)
6. [ ] Enter **Full description** (4000 chars)
7. [ ] Select **App category**: Productivity
8. [ ] Enter **Contact email**: support@ezyfix.com
9. [ ] Save draft

### Step 4: Privacy Policy
1. [ ] Host Privacy Policy online ✅ **DONE**
   
   **Website URL:** https://ezyfix.site/privacy-policy
   
   **Note:** Upload nội dung từ PRIVACY_POLICY.md lên website tại path /privacy-policy
   - Có thể dùng HTML hoặc Markdown
   - Đảm bảo public và accessible

2. [ ] In Play Console: **App content > Privacy policy**
3. [ ] Paste Privacy Policy URL: **https://ezyfix.site/privacy-policy**
4. [ ] Save

### Step 5: App Access
1. [ ] Navigate to **App content > App access**
2. [ ] Select: **All or some functionality is restricted**
3. [ ] Add instructions:
   ```
   Demo Customer Account:
   Email: demo.customer@ezyfix.com
   Password: DemoCustomer@2024
   
   Demo Technician Account:
   Email: demo.technician@ezyfix.com
   Password: DemoTech@2024
   ```
4. [ ] Save

### Step 6: Ads & Target Audience
1. [ ] **Ads declaration**:
   - [ ] Select: No, my app does not contain ads
2. [ ] **Target audience**:
   - [ ] Age group: 12+ (or Everyone)
3. [ ] **News app**: No
4. [ ] Save

### Step 7: Content Rating
1. [ ] Navigate to **App content > Content rating**
2. [ ] Click **Start questionnaire**
3. [ ] Fill form:
   - [ ] Email address
   - [ ] Category: Utility, productivity, communication, or other
   - [ ] Answer questions about:
     - Violence: No
     - Sexual content: No
     - Language: No
     - Controlled substances: No
     - User interaction: Yes (chat, user-generated content)
     - Shares user location: Yes
4. [ ] Submit
5. [ ] Receive rating: **Everyone** or **12+**
6. [ ] Apply rating

### Step 8: Data Safety
1. [ ] Navigate to **App content > Data safety**
2. [ ] Click **Start**
3. [ ] Answer questions:
   
   **Does your app collect or share user data?**
   - [ ] Yes

   **Data types collected:**
   - [ ] **Personal info**: Name, email, phone, address
   - [ ] **Location**: Approximate location, Precise location
   - [ ] **Photos and videos**: Photos (if user uploads)
   - [ ] **App activity**: App interactions, In-app search history
   - [ ] **Device or other IDs**: Device or other IDs

   **Is data encrypted in transit?**
   - [ ] Yes

   **Can users request data deletion?**
   - [ ] Yes (via app settings or email)

4. [ ] Save

### Step 9: Government Apps
1. [ ] Navigate to **App content > Government apps**
2. [ ] Select: **Not a government app**
3. [ ] Save

### Step 10: Financial Features
1. [ ] Navigate to **App content > Financial features**
2. [ ] Select: **My app doesn't facilitate financial transactions**
   - (Hoặc Yes nếu PayOS được coi là in-app payment)
3. [ ] Save

### Step 11: Production Release
1. [ ] Navigate to **Release > Production**
2. [ ] Click **Create new release**
3. [ ] Upload **AAB file**:
   - Download from EAS Build
   - Or build locally: `eas build --platform android --profile production`
4. [ ] Fill **Release name**: `1.0.0 (1)`
5. [ ] Fill **Release notes**:
   ```
   🎉 Phiên bản đầu tiên của EzyFix
   
   ✨ Tính năng chính:
   • Đặt lịch sửa chữa điện nước
   • Tìm thợ gần nhất trong bán kính 10km
   • Nhận báo giá từ nhiều thợ
   • Theo dõi đơn hàng realtime
   • Thanh toán online qua PayOS
   • Đánh giá dịch vụ
   
   📱 Hỗ trợ Android 6.0+
   🇻🇳 Giao diện tiếng Việt
   
   Cảm ơn bạn đã sử dụng EzyFix!
   ```
6. [ ] Review release
7. [ ] Save

### Step 12: Countries/Regions
1. [ ] Navigate to **Release > Production > Countries/regions**
2. [ ] Select countries:
   - [ ] **Vietnam** (primary)
   - [ ] Optional: Cambodia, Laos, Thailand
3. [ ] Save

### Step 13: Pricing
1. [ ] Navigate to **Pricing and distribution**
2. [ ] Select: **Free**
3. [ ] Confirm: App contains ads: **No**
4. [ ] Confirm: In-app purchases: **No** (hoặc Yes)
5. [ ] Content guidelines: Check all boxes
6. [ ] US export laws: Check box
7. [ ] Save

### Step 14: App Integrity
1. [ ] Navigate to **App integrity**
2. [ ] Upload **App signing key** (if not using EAS)
   - EAS handles this automatically
3. [ ] Verify signing configuration

### Step 15: Pre-Launch Report
1. [ ] Wait for Google to run automated tests
2. [ ] Review pre-launch report:
   - [ ] No crashes
   - [ ] No security issues
   - [ ] No policy violations
3. [ ] Fix any issues if found

### Step 16: Final Review & Submit
1. [ ] Review **Dashboard** for any incomplete items
2. [ ] Ensure all sections have green checkmarks
3. [ ] Click **"Send X changes for review"**
4. [ ] Confirm submission
5. [ ] Wait for review (typically 1-3 days)

---

## ⏳ AFTER SUBMISSION

### During Review (1-3 days)
- [ ] Monitor email for update from Google
- [ ] Check Play Console dashboard daily
- [ ] Be ready to respond to reviewer questions

### If Approved ✅
- [ ] App goes live automatically
- [ ] Test download from Play Store
- [ ] Share Play Store link:
  ```
  https://play.google.com/store/apps/details?id=site.ezyfix.app
  ```
- [ ] Promote on social media
- [ ] Monitor reviews and ratings
- [ ] Set up crash reporting (Firebase Crashlytics)
- [ ] Monitor analytics

### If Rejected ❌
- [ ] Read rejection reason carefully
- [ ] Fix issues mentioned
- [ ] Update app if needed (rebuild AAB)
- [ ] Update store listing if needed
- [ ] Resubmit
- [ ] Add explanation in appeal (if applicable)

---

## 🔄 UPDATES & MAINTENANCE

### For Updates
1. [ ] Increment version code (2, 3, 4...)
2. [ ] Update version name (1.0.1, 1.1.0...)
3. [ ] Build new AAB
4. [ ] Create new release in Production track
5. [ ] Upload new AAB
6. [ ] Write release notes for changes
7. [ ] Submit for review

### Regular Maintenance
- [ ] Monitor crash reports weekly
- [ ] Respond to user reviews
- [ ] Update screenshots when UI changes
- [ ] Keep Privacy Policy up to date
- [ ] Monitor app performance metrics
- [ ] Check for Google Play policy updates

---

## 🚨 COMMON ISSUES & SOLUTIONS

### Issue 1: Signature Mismatch
**Solution:** Ensure using same keystore for all builds
```bash
# EAS handles this automatically
# Check: eas credentials
```

### Issue 2: Missing Permissions Rationale
**Solution:** Add permission explanations in app.json
```json
{
  "android": {
    "permissions": [...],
    "config": {
      "googleMaps": {
        "apiKey": "..."
      }
    }
  }
}
```

### Issue 3: Privacy Policy Rejected
**Solution:** Ensure policy covers:
- What data is collected
- How data is used
- Who data is shared with
- How users can delete data

### Issue 4: Pre-launch Report Failures
**Solution:**
- Test on multiple Android versions (6.0+)
- Test on different screen sizes
- Handle offline scenarios
- Add proper error handling

### Issue 5: App Crashes on Start
**Solution:**
- Check Firebase/API keys are not hardcoded
- Ensure all dependencies are production-ready
- Test clean install (not just update)

---

## 📊 SUCCESS METRICS

### Track after launch:
- [ ] Install count
- [ ] Active users (DAU/MAU)
- [ ] Retention rate
- [ ] Crash-free sessions rate
- [ ] Average rating
- [ ] Review sentiment
- [ ] Conversion rate (installs → bookings)

### Goals for first month:
- [ ] 1,000+ installs
- [ ] 4.0+ average rating
- [ ] <0.5% crash rate
- [ ] 100+ active bookings

---

## 📞 SUPPORT CONTACTS

### Google Play Support
- Help Center: https://support.google.com/googleplay/android-developer
- Community: https://support.google.com/googleplay/android-developer/community

### Internal Team
- Development: dev@ezyfix.com
- Support: support@ezyfix.com
- Marketing: marketing@ezyfix.com

---

## 📚 RESOURCES

### Official Docs
- [Launch Checklist](https://developer.android.com/distribute/best-practices/launch/launch-checklist)
- [Asset Guidelines](https://support.google.com/googleplay/android-developer/answer/9866151)
- [Content Policies](https://support.google.com/googleplay/android-developer/answer/9877032)

### Tools
- [Google Play Console](https://play.google.com/console)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [App Icon Generator](https://icon.kitchen/)
- [Screenshot Tool](https://mockuphone.com)

---

**Last updated**: November 22, 2025  
**Version**: 1.0.0  
**Status**: Ready for submission

✅ = Completed  
❌ = Not started  
⚪ = Optional  
🔄 = In progress
