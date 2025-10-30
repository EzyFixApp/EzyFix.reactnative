# 🔗 Payment Redirect URLs - Quick Setup Guide

## TL;DR - Thông tin quan trọng cho Backend Team

---

## ✅ Success Redirect URL (Thanh toán thành công)

### Option 1: Deep Link (Recommended)
```
ezyfix://payment/success
```

### Option 2: Web URL (Alternative)
```
https://payment.ezyfix.com/success
```

### Option 3: Any URL containing these patterns (Current Detection)
- URL chứa `/payment/success`
- URL chứa `status=success`

**Example URLs that work:**
```
✅ https://payos.vn/payment/success?orderId=123
✅ https://example.com/return?status=success
✅ ezyfix://payment/success?orderId=123&appointmentId=abc
```

---

## ❌ Cancel/Failure Redirect URL (Thanh toán thất bại/hủy)

### Option 1: Backend Current URL ✅ (RECOMMENDED - WORKING)
```
http://ezyfix.site/payment/failed
```
**Status**: ✅ App đã được update để support URL này

### Option 2: Alternative URLs (Also Supported)
```
http://ezyfix.site/payment/cancel
ezyfix://payment/cancel
ezyfix://payment/failed
https://payment.ezyfix.com/cancel
https://payment.ezyfix.com/failed
```

### Option 3: Any URL containing these patterns (Current Detection)
- URL chứa `/payment/cancel`
- URL chứa `/payment/failed` ✅ **NEW**
- URL chứa `status=cancel`
- URL chứa `status=failed` ✅ **NEW**

**Example URLs that work:**
```
✅ http://ezyfix.site/payment/failed?orderId=123 (Backend current URL)
✅ https://payos.vn/payment/cancel?orderId=123
✅ https://example.com/return?status=cancel
✅ https://example.com/return?status=failed
✅ ezyfix://payment/cancel?orderId=123&appointmentId=abc
✅ ezyfix://payment/failed?orderId=123&appointmentId=abc
```

---

## 📋 Backend Setup Checklist

### 1. PayOS Checkout API Configuration

#### ✅ Current Backend Configuration (WORKING)
```json
{
  "SuccessRedirectUrl": "http://ezyfix.site/payment/success",
  "FailureRedirectUrl": "http://ezyfix.site/payment/failed"
}
```
**Status**: ✅ App đã được update để support configuration này!

#### Alternative Configurations (Also Supported)
Deep Link URLs:
```json
{
  "returnUrl": "ezyfix://payment/success",
  "cancelUrl": "ezyfix://payment/failed"
}
```

Web URLs:
```json
{
  "returnUrl": "https://payment.ezyfix.com/success",
  "cancelUrl": "https://payment.ezyfix.com/failed"
}
```

### 2. PayOS Webhook Handler (REQUIRED)
⚠️ **QUAN TRỌNG**: Redirect URL chỉ là visual feedback. Real confirmation phải qua webhook!

Webhook endpoint của backend (ví dụ):
```
POST https://api.ezyfix.com/webhooks/payos
```

**Workflow:**
1. ✅ PayOS gọi webhook khi payment success
2. ✅ Backend verify payment với PayOS API
3. ✅ Backend update appointment status → COMPLETED
4. ✅ Backend broadcast SignalR `PaymentUpdated` event
5. ✅ App nhận event và update UI

### 3. SignalR Event Broadcasting (REQUIRED)
```typescript
// Backend phải broadcast event này sau khi xác nhận payment
hub.Clients.All.SendAsync("PaymentUpdated", new {
    appointmentId = "abc-123",
    orderId = "ORDER_12345",
    amount = 500000,
    status = "COMPLETED",
    timestamp = DateTime.UtcNow
});
```

---

## 🎬 Complete Flow Diagram

```
[Customer App]
    ↓ POST /payment/payos/checkout
[Backend API]
    ↓ Create order with returnUrl & cancelUrl
[PayOS Gateway]
    ↓ User pays
[PayOS] → Redirect to returnUrl → [Customer App WebView]
    ↓ App detects URL pattern → Close WebView
[PayOS] → Webhook → [Backend API]
    ↓ Verify payment → Update DB → Broadcast SignalR
[SignalR Hub] → PaymentUpdated event → [Customer App + Technician App]
    ↓ Show success → Reload data → Display COMPLETED status
```

---

## 🧪 Testing Recommendations

### Development URLs:
```
Success: http://localhost:3000/payment/success?orderId=TEST123
Failed:  http://localhost:3000/payment/failed?orderId=TEST123
```

### Staging/Production URLs (Current Backend Setup):
```
Success: http://ezyfix.site/payment/success?orderId={ORDER_ID}
Failed:  http://ezyfix.site/payment/failed?orderId={ORDER_ID}
```

### Alternative Production URLs (Deep Links):
```
Success: ezyfix://payment/success
Failed:  ezyfix://payment/failed
```

---

## ⚠️ IMPORTANT NOTES

### 1. URL Detection is Flexible ✅ UPDATED
App **không yêu cầu exact URL**. Bất kỳ URL nào chứa pattern sau đều OK:
- **Success**: `/payment/success` hoặc `status=success`
- **Failed/Cancel**: `/payment/failed` hoặc `/payment/cancel` hoặc `status=failed` hoặc `status=cancel`

Backend có thể dùng bất kỳ domain/path nào, miễn là chứa pattern trên.

**✅ Backend current URLs hoàn toàn compatible:**
- `http://ezyfix.site/payment/success` → Chứa `/payment/success` → ✅ WORK
- `http://ezyfix.site/payment/failed` → Chứa `/payment/failed` → ✅ WORK

### 2. SignalR is Source of Truth
- URL redirect chỉ để close WebView và show "Processing..." message
- **Real confirmation** phải qua SignalR `PaymentUpdated` event
- Backend MUST broadcast event sau khi verify payment qua webhook

### 3. Deep Link Support
Nếu muốn dùng deep link `ezyfix://`, cần:
- iOS: Add to Associated Domains
- Android: Add intent filter to AndroidManifest.xml
- Đã được config trong `app.json` (ready to use)

---

## 📞 Questions?

Contact frontend team nếu:
- Cần thay đổi URL pattern detection
- Deep link không hoạt động
- SignalR event payload cần adjust
- Cần thêm query parameters trong redirect URL

---

## 📄 Full Documentation

Xem chi tiết tại: [`PAYMENT_REDIRECT_URLS.md`](./PAYMENT_REDIRECT_URLS.md)

---

**Quick Reference:**
- ✅ Success: URL chứa `/payment/success` hoặc `status=success`
  - Backend current: `http://ezyfix.site/payment/success` ✅ WORKING
- ❌ Failed/Cancel: URL chứa `/payment/failed` hoặc `/payment/cancel` hoặc `status=failed` hoặc `status=cancel`
  - Backend current: `http://ezyfix.site/payment/failed` ✅ WORKING
- 🔔 Real confirmation: SignalR `PaymentUpdated` event (REQUIRED)

**✅ Backend KHÔNG CẦN thay đổi gì - URLs hiện tại đã được app support!**
