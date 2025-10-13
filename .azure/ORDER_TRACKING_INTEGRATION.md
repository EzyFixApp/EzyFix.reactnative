# 📍 Order Tracking Flow - Hoạt động ở đâu trong App?

## 🎯 Tổng quan

Order Tracking Screen là màn hình trung tâm theo dõi toàn bộ quy trình từ **đặt lịch → hoàn thành** với **timeline real-time** hiển thị 11 bước.

---

## 👤 Customer Journey (Khách hàng)

### 1️⃣ Dashboard → Active Orders
```
CustomerDashboard
├── HeroBanner (tìm kiếm dịch vụ)
├── 🆕 ActiveOrdersSection ← Hiển thị đơn đang xử lý
│   ├── Card: "Sửa điều hòa" - Status: Quoted
│   │   └── Button: "Theo dõi" → Navigate to OrderTrackingScreen
│   └── Card: "Sửa ống nước" - Status: Searching
│       └── Button: "Theo dõi" → Navigate to OrderTrackingScreen
├── ServiceCategories
└── PromotionSection
```

**Khi nào hiển thị?**
- ✅ Có đơn hàng với status: `searching`, `quoted`, `accepted`, `in-progress`
- ❌ Không hiển thị nếu tất cả đơn đã `completed` hoặc `cancelled`

---

### 2️⃣ Booking History → Track Order
```
BottomNavigation: Tab "Hoạt động"
    ↓
BookingHistory Screen
├── Filter: Tất cả | Đang tìm thợ | Có báo giá | Hoàn thành
└── Booking Cards
    ├── Card 1: Status = "quoted" ✨
    │   └── 🆕 Button: "Theo dõi đơn" → OrderTrackingScreen
    ├── Card 2: Status = "searching" ✨
    │   └── 🆕 Button: "Theo dõi đơn" → OrderTrackingScreen
    └── Card 3: Status = "completed"
        └── Button: "Xem chi tiết" → BookingDetail (old)
```

**Logic hiển thị nút:**
```typescript
if (status !== 'completed' && status !== 'cancelled') {
  // Show "Theo dõi đơn" button → Navigate to OrderTracking
} else {
  // Show "Xem chi tiết" button → Navigate to BookingDetail
}
```

---

### 3️⃣ After Booking Service
```
ServiceCategories → Select "Sửa điều hòa"
    ↓
BookServiceScreen (form đặt lịch)
    ↓
Submit thành công
    ↓
🆕 Navigate to OrderTrackingScreen
    (orderId: newly_created_order)
    Status: "pending" → Timeline bắt đầu từ Step 1
```

---

## 🔧 Technician Journey (Thợ)

### 1️⃣ Dashboard → Order List
```
TechnicianDashboard
├── Stats: Đơn hôm nay | Doanh thu | Đánh giá
├── 🆕 PendingOrdersList ← Đơn chờ tiếp nhận
│   ├── Card: "Sửa điều hòa" - 2.5km
│   │   └── Button: "Xem & Báo giá" → OrderTrackingScreen
│   └── Card: "Sửa tủ lạnh" - 5km
│       └── Button: "Xem & Báo giá" → OrderTrackingScreen
└── 🆕 ActiveJobsList ← Đơn đang làm
    ├── Card: Status = "on_the_way"
    │   └── Button: "Tiếp tục" → OrderTrackingScreen
    └── Card: Status = "repairing"
        └── Button: "Tiếp tục" → OrderTrackingScreen
```

---

### 2️⃣ OrderTracking Actions (Thợ)
```
OrderTrackingScreen (userType: "technician")
├── Timeline (11 steps) - READ ONLY hiển thị progress
├── 🆕 Technician Action Panel ← Tùy theo status
│   ├── Status = "pending" → Button: "Tiếp nhận & Báo giá"
│   ├── Status = "quote_accepted" → Button: "Bắt đầu di chuyển"
│   ├── Status = "on_the_way" → Button: "Đã đến nơi"
│   ├── Status = "arrived" → Button: "Bắt đầu kiểm tra" + Upload ảnh
│   ├── Status = "inspecting" → Form: Nhập báo giá final + AI check
│   ├── Status = "final_accepted" → Button: "Bắt đầu sửa chữa"
│   └── Status = "repairing" → Button: "Hoàn thành" + Upload ảnh
└── Real-time updates mỗi 5s (sau sẽ dùng WebSocket)
```

---

## 🗂️ File Structure

### Routes
```
app/
├── customer/
│   ├── dashboard.tsx ← Renders CustomerDashboard
│   ├── booking-history.tsx ← List + "Theo dõi" button
│   └── 🆕 order-tracking.tsx ← Route wrapper cho OrderTrackingScreen
│
└── technician/
    ├── dashboard.tsx ← Renders TechnicianDashboard (TODO)
    └── 🆕 order-tracking.tsx ← Route wrapper cho OrderTrackingScreen
```

### Components
```
components/
├── 🆕 OrderTrackingScreen.tsx ← Main screen (customer + technician)
│   ├── Props: orderId, userType, onBack
│   ├── Timeline với 11 steps
│   ├── Quote cards (initial + final)
│   ├── Technician info
│   └── Real-time polling (checkForUpdates)
│
├── 🆕 ActiveOrdersSection.tsx ← Horizontal cards trong dashboard
│   └── Shows orders với status !== completed/cancelled
│
├── CustomerDashboard.tsx ← Updated with ActiveOrdersSection
└── TechnicianDashboard.tsx ← TODO: Create với PendingOrders + ActiveJobs
```

### Types
```
types/
└── BookingTypes.ts ← Enhanced với 15+ statuses
    ├── BookingStatus: pending → completed (13 statuses)
    ├── Quote: initialQuote + finalQuote với AI suggestion
    ├── Payment: escrow system + methods
    ├── MediaItem: before/after photos
    └── TimelineEvent: status changes với timestamp
```

---

## 🔄 Navigation Flow Summary

### Customer Navigation Map
```
┌─────────────────────────────────────────────────────────────┐
│                     CustomerDashboard                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │  🆕 ActiveOrdersSection (if có đơn active)          │    │
│  │    Card → "Theo dõi" → /customer/order-tracking    │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  BottomNav: "Hoạt động" → /customer/booking-history        │
└─────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────┐
│                    BookingHistory Screen                     │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Card với status active                             │    │
│  │    Footer: "Theo dõi đơn" → /customer/order-tracking│    │
│  └────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Card với status completed                          │    │
│  │    Footer: "Xem chi tiết" → /customer/booking-detail│    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────┐
│              🎯 OrderTrackingScreen                         │
│  - userType: "customer"                                     │
│  - 11-step timeline với pulse animation                    │
│  - Quote cards với Accept/Reject                           │
│  - Real-time status updates                                │
│  - Technician info với call button                         │
└─────────────────────────────────────────────────────────────┘
```

### Technician Navigation Map
```
┌─────────────────────────────────────────────────────────────┐
│                   TechnicianDashboard (TODO)                 │
│  ┌────────────────────────────────────────────────────┐    │
│  │  🆕 PendingOrdersList                               │    │
│  │    Card → "Xem & Báo giá" → /technician/order-tracking│  │
│  └────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  🆕 ActiveJobsList                                  │    │
│  │    Card → "Tiếp tục" → /technician/order-tracking  │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────┐
│              🎯 OrderTrackingScreen                         │
│  - userType: "technician"                                   │
│  - 11-step timeline (READ ONLY)                            │
│  - 🆕 Action Panel (status-dependent buttons)              │
│  - Upload photos (inspection + completed)                  │
│  - Input final quote với AI validation                     │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Đã hoàn thành

- [x] OrderTrackingScreen với 11-step timeline
- [x] Status-based styling (15+ colors)
- [x] Quote cards với AI suggestion
- [x] Technician info card
- [x] Real-time polling infrastructure
- [x] Routes: /customer/order-tracking, /technician/order-tracking
- [x] ActiveOrdersSection component
- [x] BookingHistory với "Theo dõi đơn" button
- [x] CustomerDashboard integration

---

## 🚧 Cần hoàn thành

### High Priority
- [ ] **TechnicianDashboard** với PendingOrdersList + ActiveJobsList
- [ ] **Technician Action Panel** trong OrderTrackingScreen
  - [ ] Accept/Quote form
  - [ ] Status update buttons
  - [ ] Photo upload (ImagePicker)
  - [ ] Final quote input với AI check
  
### Medium Priority  
- [ ] **Payment Section** component
  - [ ] Payment methods (Momo, ZaloPay, VNPay, QR, Cash)
  - [ ] Escrow status display
  - [ ] Invoice checkbox
  
- [ ] **Media Gallery** component
  - [ ] Before/After photo grid
  - [ ] Modal viewer với zoom
  - [ ] Upload functionality

### Low Priority
- [ ] WebSocket integration (thay interval polling)
- [ ] Push notifications cho status changes
- [ ] Rating/Review system after completion

---

## 💡 Key Points

### 1. Single Screen, Multiple Views
**OrderTrackingScreen** phục vụ cả **customer** và **technician** với prop `userType`:
- Customer: View-only timeline + Accept/Reject quotes
- Technician: Interactive timeline + Action buttons + Upload photos

### 2. Smart Button Logic
Booking History dynamically shows:
```typescript
Active orders (searching/quoted/in-progress) → "Theo dõi đơn" ⚡
Completed/Cancelled orders → "Xem chi tiết" 📄
```

### 3. Real-time Updates
Current: `setInterval(checkForUpdates, 5000)` - Poll mỗi 5s  
Future: WebSocket connection cho instant updates

### 4. Dashboard Integration
- **CustomerDashboard**: ActiveOrdersSection hiển thị ngang (horizontal scroll)
- **TechnicianDashboard**: Cần tạo với 2 sections (Pending + Active)

---

## 🎨 UI/UX Highlights

### Animations
- **Pulse effect** trên active timeline step (scale 1 → 1.2 loop)
- **Fade in** khi load screen (opacity 0 → 1)
- **Stagger animation** cho booking cards

### Visual Hierarchy
- **Status colors**: 15 distinct colors cho từng status
- **Timeline vertical**: Left indicator bar + icon + description
- **Card shadows**: Depth với elevation 3-4
- **Gradient backgrounds**: LinearGradient cho badges/buttons

---

## 📱 Demo Flow

### Customer sử dụng
1. Mở app → CustomerDashboard
2. Thấy "Đơn đang xử lý" section → Click "Theo dõi"
3. Vào OrderTrackingScreen → Thấy timeline ở step 3: "Chờ xác nhận báo giá"
4. Quote card hiển thị: 350,000đ (AI suggest: 300k-400k) ✅
5. Click "Chấp nhận báo giá" → Status chuyển sang "quote_accepted"
6. Timeline auto scroll đến step 4: "Thợ đang di chuyển"

### Technician sử dụng
1. Mở app → TechnicianDashboard (TODO)
2. Thấy "Đơn chờ xử lý" → Click "Xem & Báo giá"
3. Vào OrderTrackingScreen → Timeline ở step 1
4. Nhập báo giá 350k → AI check (trong range) → Submit
5. Customer accept → Notification "Đã được chấp nhận"
6. Click "Bắt đầu di chuyển" → Status → "on_the_way"
7. Đến nơi → Click "Đã đến" → Upload ảnh → "Bắt đầu kiểm tra"

---

**Tóm lại:** OrderTracking flow hoạt động ở **3 điểm chính**:
1. 🏠 **Dashboard** (Quick access cho active orders)
2. 📋 **Booking History** (Full list với track buttons)
3. ➕ **After Booking** (Immediate tracking sau khi đặt lịch)
