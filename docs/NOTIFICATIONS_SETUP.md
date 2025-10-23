# Push Notifications Setup Instructions

## 📦 Installation

### 1. Install Required Packages
```bash
npx expo install expo-notifications expo-device expo-constants
```

### 2. Configure app.json
Add the following to your `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#609CEF",
          "sounds": [
            "./assets/sounds/notification.wav"
          ]
        }
      ]
    ],
    "notification": {
      "icon": "./assets/images/notification-icon.png",
      "color": "#609CEF",
      "androidMode": "default",
      "androidCollapsedTitle": "EzyFix"
    }
  }
}
```

### 3. Android Configuration (android/app/src/main/AndroidManifest.xml)
If using bare workflow, add:

```xml
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
```

### 4. iOS Configuration (Info.plist)
Permissions are handled automatically by expo-notifications.

---

## 🔧 Development Setup

### 1. Test on Physical Device
Push notifications **DO NOT work on iOS Simulator** or Android Emulator.
You **MUST** test on a real device.

### 2. Expo Go Limitations (SDK 53+)
⚠️ **IMPORTANT:** Expo removed push notifications from Expo Go in SDK 53.

**What WORKS in Expo Go:**
- ✅ Local notifications (what we're using)
- ✅ Notification sounds
- ✅ Badge counts
- ✅ Notification taps → navigation

**What DOESN'T WORK in Expo Go:**
- ❌ Expo Push Token registration
- ❌ Remote push notifications from server

**Solution for testing:**
- Use local notifications (already implemented) ✅
- For remote push: Build development build or standalone app

### 3. Get Expo Push Token (Only in Development/Production Build)
Run the app and check console logs:
```
🔔 Notification service initialized with token: ExponentPushToken[xxxxx]
```

In Expo Go, you'll see:
```
📱 Running in Expo Go - Skipping push token registration. Local notifications will still work.
```

### 3. Test Notifications Manually
Use Expo Push Notification Tool: https://expo.dev/notifications

Or use curl:
```bash
curl -H "Content-Type: application/json" \
  -X POST https://exp.host/--/api/v2/push/send \
  -d '{
    "to": "ExponentPushToken[xxxxx]",
    "title": "💰 Báo giá mới từ thợ!",
    "body": "Thợ đã gửi báo giá dự kiến cho Sửa máy lạnh: 500,000 VNĐ",
    "sound": "default",
    "data": {
      "type": "new_quote",
      "quoteId": "offer-123",
      "serviceRequestId": "request-123"
    }
  }'
```

---

## 🎵 Custom Notification Sounds (Optional)

### 1. Add Sound Files
Create directory: `assets/sounds/`
Add files:
- `notification.wav` (for general notifications)
- `quote-new.wav` (for new quotes)
- `quote-accepted.wav` (for accepted quotes)

### 2. Configure in app.json
```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "sounds": [
            "./assets/sounds/notification.wav",
            "./assets/sounds/quote-new.wav",
            "./assets/sounds/quote-accepted.wav"
          ]
        }
      ]
    ]
  }
}
```

### 3. Use Custom Sound
In `notificationService.ts`:
```typescript
await Notifications.scheduleNotificationAsync({
  content: {
    sound: 'quote-new.wav', // Custom sound
    // ... other options
  },
  trigger: null,
});
```

---

## 🔔 Testing Flow

### Quick Test (Use Test Screen)
1. Navigate to `/test-notifications` in the app
2. Press test buttons to see notifications
3. Tap notifications to test navigation

### Full Flow Test (Customer Side - New Quote)
1. Login as customer
2. Wait for technician to submit quote
3. Notification appears: "💰 Báo giá mới từ thợ!"
4. Tap notification → Opens booking history
5. Click "Xem báo giá" button
6. Accept or reject quote

### Technician Side (Quote Accepted)
1. Login as technician
2. Wait for customer to accept quote
3. Notification appears: "✅ Báo giá được chấp nhận!"
4. Tap notification → Opens orders screen

### Technician Side (Quote Rejected)
1. Login as technician
2. Wait for customer to reject quote
3. Notification appears: "❌ Báo giá bị từ chối"
4. Tap notification → Opens orders screen

### Current Status
✅ **Working in Expo Go:**
- Local notifications with sound ✓
- Badge counts ✓
- Notification tap → navigation ✓
- Android channels ✓
- Vibration patterns ✓

⏳ **Requires Development Build:**
- Remote push from server (when backend integrated)
- Expo Push Token registration

---

## 🚀 Production Setup

### 1. Register for FCM (Android)
- Create Firebase project
- Add Android app
- Download `google-services.json`
- Add to `android/app/`

### 2. Register for APNs (iOS)
- Create Apple Developer account
- Generate push notification certificate
- Upload to Expo

### 3. Build with EAS
```bash
eas build --platform android --profile production
eas build --platform ios --profile production
```

### 4. Submit to Stores
```bash
eas submit --platform android
eas submit --platform ios
```

---

## 📝 Implementation Status

### ✅ Completed
- [x] NotificationService class with sound support
- [x] useNotifications hook
- [x] Integration in _layout.tsx
- [x] Customer notification on new quote
- [x] Technician notification on accept/reject
- [x] Auto-navigation when notification tapped
- [x] Badge count management
- [x] Android notification channels

### ⏳ Pending
- [ ] Install expo-notifications package (run command above)
- [ ] Configure app.json
- [ ] Test on physical device
- [ ] Add custom notification sounds
- [ ] Backend integration for push token storage
- [ ] Production FCM/APNs setup

---

## 🐛 Troubleshooting

### Notifications Not Showing
1. Check permissions: Settings → EzyFix → Notifications → Allow
2. Verify push token is obtained (check console logs)
3. Test on physical device (not simulator/emulator)
4. Check notification channel settings (Android)

### Sound Not Playing
1. Verify sound file exists in assets/sounds/
2. Check file format (WAV recommended for Android)
3. Ensure device is not in silent mode
4. Test with 'default' sound first

### Badge Not Updating
1. iOS: Check notification settings allow badges
2. Android: Badge support varies by launcher
3. Use `setBadgeCount()` manually if needed

---

## 📚 References
- Expo Notifications Docs: https://docs.expo.dev/versions/latest/sdk/notifications/
- Push Notification Tool: https://expo.dev/notifications
- FCM Setup: https://docs.expo.dev/push-notifications/fcm-credentials/
- APNs Setup: https://docs.expo.dev/push-notifications/push-notifications-setup/

---

**Created:** October 23, 2025
**Status:** Implementation Complete - Package Installation Required
