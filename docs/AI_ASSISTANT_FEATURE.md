# EzyFix AI Assistant - Technical Documentation

## Tổng quan

EzyFix AI Assistant là tính năng trợ lý ảo thông minh được tích hợp vào nút logo trung tâm của bottom navigation. Tính năng này sử dụng Google Gemini 2.5 Flash để hỗ trợ khách hàng chẩn đoán và giải quyết vấn đề sửa chữa một cách nhanh chóng, đồng thời tự động hóa quy trình đặt dịch vụ.

## Mục tiêu

1. **Tăng trải nghiệm người dùng**: Cung cấp hỗ trợ tức thì cho các vấn đề sửa chữa thông thường
2. **Tối ưu hóa quy trình booking**: Tự động điền thông tin và giảm số bước thao tác
3. **Tăng tỷ lệ chuyển đổi**: Hướng dẫn khách hàng từ vấn đề đến giải pháp một cách mượt mà
4. **Giảm tải cho customer support**: Xử lý các câu hỏi cơ bản bằng AI

## Kiến trúc hệ thống

### 1. Entry Point
- **Vị trí**: Center logo button trong `BottomNavigation.tsx`
- **Trigger**: `onLogoPress` callback
- **Điều hướng**: Navigate đến `/customer/ai-assistant`

### 2. Tech Stack
```typescript
{
  "AI Engine": "Google Gemini 2.5 Flash",
  "API Key": "AIzaSyDBG2XrJgHDZyh07j1AGNiHt5T7xf_YPWA",
  "Package": "@google/genai",
  "Image Processing": "expo-image-picker",
  "Media Upload": "mediaService (existing)",
  "Navigation": "expo-router"
}
```

### 3. Core Components

```
app/customer/ai-assistant.tsx (NEW)
├── AIConversationScreen
│   ├── WelcomeScreen
│   ├── ChatInterface
│   ├── ImageUploadHandler
│   ├── SolutionDisplay
│   └── BookingRedirect
└── Integration with book-service.tsx
```

## User Flow (Happy Case)

### Phase 1: Initiation
```
User clicks Logo → AI Welcome Screen
├── Greeting: "Chào mừng đến với EzyFix!"
├── Description: "Tôi có thể giúp bạn chẩn đoán và sửa chữa vấn đề"
└── CTA: [Bắt đầu] button
```

### Phase 2: Problem Input
```
User taps [Bắt đầu] → Chat Interface Opens
├── Input Options:
│   ├── Upload Image (Bắt buộc)
│   ├── Voice Note (Tùy chọn - Tính năng tương lai)
│   └── Text Description (Bắt buộc)
└── Example: "Máy lạnh không mát"
```

### Phase 3: AI Analysis
```
AI receives: Image + Text Description
├── Vision API: Analyze image content
├── Context: "EzyFix repair service for Vietnam market"
├── Processing Time: 2-5 seconds
└── Generate Response
```

### Phase 4: Initial Solution
```
AI Response Format:
┌─────────────────────────────────────────┐
│ CHẨN ĐOÁN                               │
│ Vấn đề: Máy lạnh không làm lạnh         │
│                                         │
│ GIẢI PHÁP SƠ CỨU                        │
│ 1. Kiểm tra điều hòa có nguồn điện     │
│ 2. Làm sạch bộ lọc khí                 │
│ 3. Kiểm tra chế độ nhiệt độ            │
│                                         │
│ VIDEO HƯỚNG DẪN:                        │
│ [Link YouTube - Cách vệ sinh máy lạnh] │
│                                         │
│ BẠN ĐÃ GIẢI QUYẾT ĐƯỢC CHƯA?           │
│ ├── [Đã sửa được]                      │
│ └── [Vẫn chưa được]                    │
└─────────────────────────────────────────┘
```

### Phase 5A: Problem Solved (Exit Flow)
```
User selects [Đã sửa được]
├── AI: "Tuyệt vời! Chúc mừng bạn!"
├── AI: "Hẹn gặp lại bạn trong tương lai"
├── CTA: [Quay về trang chủ]
└── End Session
```

### Phase 5B: Need Professional Help (Booking Flow)
```
User selects [Vẫn chưa được]
├── AI: "Tôi sẽ giúp bạn đặt lịch với thợ chuyên nghiệp"
├── AI: "Đang chuẩn bị thông tin..."
├── Auto-fill booking form
└── Redirect to book-service.tsx
```

## Integration với book-service.tsx

### Auto-fill Strategy

```typescript
// IMPORTANT: Must match book-service.tsx exactly

interface AIBookingData {
  // From User Auth (Existing)
  customerName: string;      // user.fullName
  phoneNumber: string;       // user.phoneNumber
  
  // From AI Analysis
  serviceId: string;         // AI detects service type
  serviceName: string;       // "Sửa máy lạnh", "Sửa tủ lạnh", etc.
  servicePrice: string;      // From service data
  serviceDescription: string; // AI-generated professional description
  
  // From AI Session - CRITICAL: Use uploadedMediaJSON instead of images
  uploadedMediaJSON: string; // JSON.stringify(uploadedMedia[]) - contains mediaID, fileURL, localUri
  
  // From User History (Smart)
  addressID: string;         // Last used address OR empty if first time
  address: string;           // Full address text
  
  // Flag
  fromAI: string;            // 'true' to indicate AI source
  
  // User Decision (Next Screen in select-schedule)
  requestedDate: string;     // User chooses in select-schedule
  expectedStartTime: string; // User chooses OR "now" option
}
```

### Data Flow

```typescript
// 1. AI Assistant prepares data
const bookingData = {
  customerName: user.fullName,
  phoneNumber: user.phoneNumber,
  serviceId: detectServiceFromAI(imageAnalysis, textInput),
  serviceName: getServiceName(detectedServiceId),
  servicePrice: getServicePrice(detectedServiceId),
  serviceDescription: generateProfessionalDescription(
    userInput: "Máy lạnh không mát",
    aiAnalysis: "Compressor issue, filter clogged"
  ),
  // Output: "Máy lạnh không làm lạnh hiệu quả. Có thể do lọc gió bị tắc 
  //          hoặc khí nén không hoạt động. Cần kiểm tra và bảo trì."
  
  // CRITICAL: Pass uploaded media as JSON (same as book-service format)
  uploadedMediaJSON: JSON.stringify(uploadedMedia.map(m => ({
    mediaID: m.mediaID,
    fileURL: m.fileURL,
    localUri: m.localUri
  }))),
  
  addressID: await getLastUsedAddress(user.id),
  address: await getLastUsedAddressText(user.id),
  fromAI: 'true'
};

// 2. Navigate to book-service with pre-filled data
router.push({
  pathname: '/customer/book-service',
  params: bookingData
});

// 3. book-service.tsx receives and populates
useEffect(() => {
  if (params.fromAI === 'true') {
    // Parse uploaded media from AI session
    const aiUploadedMedia = params.uploadedMediaJSON 
      ? JSON.parse(params.uploadedMediaJSON as string)
      : [];
    
    setFormData({
      customerName: params.customerName,
      phoneNumber: params.phoneNumber,
      serviceId: params.serviceId,
      serviceName: params.serviceName,
      servicePrice: params.servicePrice,
      serviceDescription: params.serviceDescription,
      address: params.address,
      addressID: params.addressID,
      images: aiUploadedMedia.map((m: UploadedMedia) => m.localUri) // For display
    });
    
    // CRITICAL: Pre-populate uploadedMedia state (not images state)
    // This ensures backend receives correct mediaID and fileURL
    setUploadedMedia(aiUploadedMedia);
    
    if (__DEV__) {
      console.log('✅ Auto-filled from AI:', {
        service: params.serviceName,
        mediaCount: aiUploadedMedia.length,
        uploadedMedia: aiUploadedMedia
      });
    }
  }
}, [params]);
```

## Select-Schedule Enhancement

### New "Book Now" Option

```typescript
// In select-schedule.tsx
interface ScheduleOption {
  type: 'now' | 'scheduled';
  label: string;
  description: string;
}

const scheduleOptions: ScheduleOption[] = [
  {
    type: 'now',
    label: 'Ngay bây giờ',
    description: 'Thợ sẽ đến trong 30-60 phút',
    // Auto-fill:
    requestedDate: new Date().toISOString(),
    expectedStartTime: getCurrentTime() // e.g., "14:30"
  },
  {
    type: 'scheduled',
    label: 'Đặt lịch sau',
    description: 'Chọn ngày và giờ phù hợp',
    // User selects manually
  }
];

// If fromAI = true, auto-select "now" option
useEffect(() => {
  if (params.fromAI === 'true') {
    setSelectedOption('now');
    setShowNowHighlight(true); // Visual hint for user
  }
}, [params.fromAI]);
```

## UI/UX Design

### Welcome Screen
```
┌───────────────────────────────────────────────┐
│  ← Back                  Trợ lý AI EzyFix     │
├───────────────────────────────────────────────┤
│                                               │
│        [Logo: assets/logononame.png]          │
│           (EzyFix logo without name)          │
│                                               │
│       Chào mừng đến với EzyFix!              │
│                                               │
│  Tôi có thể giúp bạn chẩn đoán và sửa        │
│     chữa các vấn đề trong nhà                │
│                                               │
│  ┌─────────────────────────────────────┐     │
│  │  Chụp ảnh vấn đề                    │     │
│  │  Gửi hình ảnh để được tư vấn        │     │
│  └─────────────────────────────────────┘     │
│                                               │
│  ┌─────────────────────────────────────┐     │
│  │  Mô tả vấn đề                       │     │
│  │  Kể chi tiết tình trạng của thiết bị│     │
│  └─────────────────────────────────────┘     │
│                                               │
│  ┌─────────────────────────────────────┐     │
│  │  Tìm thợ gần đây                    │     │
│  │  Kết nối với thợ chuyên nghiệp      │     │
│  └─────────────────────────────────────┘     │
│                                               │
│         ┌─────────────────────┐              │
│         │    Bắt đầu ngay     │              │
│         └─────────────────────┘              │
│                                               │
└───────────────────────────────────────────────┘
```

### Chat Interface
```
┌───────────────────────────────────────────────┐
│  ← Back           Trợ lý AI                   │
├───────────────────────────────────────────────┤
│                                               │
│  [AI Avatar]  Xin chào! Hãy cho tôi          │
│               biết bạn gặp vấn đề gì nhé     │
│                                     10:30     │
│                                               │
│                           [User Avatar]       │
│                 Máy lạnh nhà em không mát    │
│              10:31                            │
│                                               │
│  [Image Preview]                              │
│  ┌─────────────┐                             │
│  │   [Photo]   │                             │
│  │  AC Unit    │                             │
│  └─────────────┘                             │
│              10:31                            │
│                                               │
│  [AI Avatar]  Để tôi xem nhé...              │
│               Đang phân tích...               │
│                                     10:31     │
│                                               │
├───────────────────────────────────────────────┤
│  [Camera] [Nhập tin nhắn...]       [Gửi] →  │
└───────────────────────────────────────────────┘
```

### Solution Display
```
┌───────────────────────────────────────────────┐
│  [AI Avatar]                                  │
│  ┌─────────────────────────────────────────┐ │
│  │ CHẨN ĐOÁN CỦA TÔI                       │ │
│  │                                         │ │
│  │ Dựa vào hình ảnh, có vẻ máy lạnh       │ │
│  │ của bạn đang gặp vấn đề về làm lạnh.   │ │
│  │                                         │ │
│  │ THỬ CÁC CÁCH SAU:                       │ │
│  │ 1. Kiểm tra nguồn điện                  │ │
│  │ 2. Vệ sinh bộ lọc khí                   │ │
│  │ 3. Kiểm tra nhiệt độ cài đặt            │ │
│  │                                         │ │
│  │ [Xem video hướng dẫn]                   │ │
│  │                                         │ │
│  │ ────────────────────────────            │ │
│  │                                         │ │
│  │ Bạn đã thử và kết quả thế nào?        │ │
│  │                                         │ │
│  │ ┌──────────────┐  ┌──────────────┐    │ │
│  │ │ Đã được      │  │ Chưa được    │    │ │
│  │ └──────────────┘  └──────────────┘    │ │
│  └─────────────────────────────────────────┘ │
│                                     10:32     │
└───────────────────────────────────────────────┘
```

### Out of Scope Response
```
┌───────────────────────────────────────────────┐
│  [AI Avatar]                                  │
│  ┌─────────────────────────────────────────┐ │
│  │ CHẨN ĐOÁN CỦA TÔI                       │ │
│  │                                         │ │
│  │ Laptop của bạn có thể bị bụi tích tụ   │ │
│  │ trong quạt tản nhiệt. Dưới đây là       │ │
│  │ cách xử lý sơ cứu:                      │ │
│  │                                         │ │
│  │ 1. Đóng các ứng dụng không cần thiết    │ │
│  │ 2. Đặt laptop ở nơi thoáng mát          │ │
│  │ 3. Mang đến trung tâm bảo hành          │ │
│  │                                         │ │
│  │ ────────────────────────────            │ │
│  │                                         │ │
│  │ Rất tiếc, EzyFix hiện chưa cung cấp    │ │
│  │ dịch vụ sửa chữa laptop và thiết bị    │ │
│  │ điện tử.                                │ │
│  │                                         │ │
│  │ Bạn có thể tham khảo các dịch vụ mà    │ │
│  │ chúng tôi đang cung cấp:                │ │
│  │                                         │ │
│  │ • Điện: Sửa điện, lắp đặt, chiếu sáng  │ │
│  │ • Nước: Sửa ống, thông cống, bảo trì   │ │
│  │ • Điện lạnh: Máy lạnh, tủ lạnh         │ │
│  │                                         │ │
│  │ ┌──────────────────────────────┐       │ │
│  │ │   Xem tất cả dịch vụ         │       │ │
│  │ └──────────────────────────────┘       │ │
│  └─────────────────────────────────────────┘ │
│                                     10:32     │
└───────────────────────────────────────────────┘
```

## AI Training & Prompt Engineering

### EzyFix Service Catalog (Hard-coded)

```typescript
/**
 * EzyFix Service Catalog - Static Configuration
 * Total: 11 services across 3 categories
 * 
 * WHY HARD-CODED?
 * - Only 11 services (small, stable dataset)
 * - Reduces API calls and latency
 * - Services rarely change
 * - AI needs instant access to service info
 * 
 * UPDATE WHEN: Admin adds/modifies services in backend
 */

interface ServiceCatalogItem {
  serviceName: string;
  description: string;
  category: 'Nước' | 'Điện' | 'Điện lạnh';
  keywords: string[]; // For better AI matching
}

const EZYFIX_SERVICE_CATALOG: ServiceCatalogItem[] = [
  // ==================== NƯỚC (3 services) ====================
  {
    serviceName: 'Sửa ống nước',
    description: 'Dịch vụ sửa ống nước chuyên nhận khắc phục rò rỉ, tắc nghẽn và thay thế đường ống hư hỏng tại nhà. Đội ngũ thợ chuyên nghiệp, đến nhanh sau khi nhận yêu cầu. Cam kết làm việc uy tín, giá cả rõ ràng và bảo hành chu đáo.',
    category: 'Nước',
    keywords: ['ống nước', 'rò rỉ', 'tắc nghẽn', 'đường ống', 'nước chảy', 'vòi nước', 'bể nước']
  },
  {
    serviceName: 'Thông cống',
    description: 'Dịch vụ thông cống chuyên xử lý nghẹt cống, tắc bồn cầu, chậu rửa và hệ thống thoát nước nhanh chóng. Sử dụng thiết bị hiện đại, không đục phá, đảm bảo sạch sẽ và hiệu quả lâu dài. Phục vụ tận nơi 24/7 với giá cả minh bạch, uy tín hàng đầu.',
    category: 'Nước',
    keywords: ['thông cống', 'nghẹt cống', 'tắc bồn cầu', 'chậu rửa', 'thoát nước', 'cống tắc', 'nhà vệ sinh']
  },
  {
    serviceName: 'Bảo trì hệ thống nước',
    description: 'Dịch vụ bảo trì hệ thống nước chuyên kiểm tra, vệ sinh và khắc phục sự cố rò rỉ, tắc nghẽn, áp lực yếu trong đường ống. Đảm bảo hệ thống hoạt động ổn định, tiết kiệm nước và an toàn. Phục vụ định kỳ hoặc theo yêu cầu, uy tín và chuyên nghiệp.',
    category: 'Nước',
    keywords: ['bảo trì nước', 'kiểm tra ống', 'áp lực nước', 'hệ thống nước', 'tiết kiệm nước']
  },

  // ==================== ĐIỆN LẠNH (5 services: Máy lạnh + Tủ lạnh) ====================
  {
    serviceName: 'Sửa máy lạnh',
    description: 'Dịch vụ sửa máy lạnh chuyên nhận kiểm tra, vệ sinh, nạp gas và khắc phục mọi sự cố máy lạnh nhanh chóng. Đội ngũ kỹ thuật viên tay nghề cao, phục vụ tận nơi. Cam kết làm việc chuyên nghiệp, giá hợp lý và bảo hành chu đáo.',
    category: 'Điện lạnh',
    keywords: ['máy lạnh', 'điều hòa', 'không mát', 'nạp gas', 'ac', 'air conditioner', 'máy hỏng', 'chạy ồn']
  },
  {
    serviceName: 'Vệ sinh máy lạnh',
    description: 'Dịch vụ vệ sinh máy lạnh chuyên làm sạch dàn lạnh, dàn nóng, lọc gió và kiểm tra gas giúp máy chạy êm, mát sâu và tiết kiệm điện. Sử dụng dụng cụ chuyên dụng, quy trình an toàn, không gây hư hại. Phục vụ tận nơi nhanh chóng, giá hợp lý và bảo dưỡng định kỳ theo yêu cầu.',
    category: 'Điện lạnh',
    keywords: ['vệ sinh máy lạnh', 'làm sạch dàn lạnh', 'lọc gió', 'bảo dưỡng điều hòa', 'tiết kiệm điện']
  },
  {
    serviceName: 'Lắp đặt máy lạnh',
    description: 'Dịch vụ lắp đặt máy lạnh chuyên tư vấn vị trí, lắp đặt dàn lạnh và dàn nóng chuẩn kỹ thuật, đảm bảo máy vận hành hiệu quả. Thợ kỹ thuật tay nghề cao, phục vụ tận nơi nhanh chóng. Cam kết an toàn, thẩm mỹ, bảo hành đầy đủ và giá cả minh bạch.',
    category: 'Điện lạnh',
    keywords: ['lắp đặt máy lạnh', 'lắp điều hòa', 'cài đặt ac', 'máy mới', 'di dời máy lạnh']
  },
  {
    serviceName: 'Sửa tủ lạnh',
    description: 'Dịch vụ sửa tủ lạnh chuyên kiểm tra, khắc phục các lỗi như không lạnh, rò gas, chảy nước, chạy ồn hoặc không hoạt động. Đội ngũ kỹ thuật viên giàu kinh nghiệm, sửa chữa tận nơi nhanh chóng. Cam kết linh kiện chính hãng, giá cả rõ ràng và bảo hành uy tín.',
    category: 'Điện lạnh',
    keywords: ['tủ lạnh', 'fridge', 'không lạnh', 'rò gas', 'chảy nước', 'ngăn đông', 'tủ hỏng']
  },
  {
    serviceName: 'Vệ sinh tủ lạnh',
    description: 'Dịch vụ vệ sinh tủ lạnh chuyên làm sạch khoang lạnh, ngăn đông, kệ và các bộ phận bên trong giúp tủ hoạt động hiệu quả, khử mùi hôi và an toàn cho thực phẩm. Thợ kỹ thuật đến tận nơi, nhanh chóng và cẩn thận. Cam kết vệ sinh sạch sẽ, bảo dưỡng định kỳ và giá cả minh bạch.',
    category: 'Điện lạnh',
    keywords: ['vệ sinh tủ lạnh', 'làm sạch tủ lạnh', 'khử mùi', 'bảo dưỡng tủ lạnh']
  },

  // ==================== ĐIỆN (3 services) ====================
  {
    serviceName: 'Sửa điện',
    description: 'Dịch vụ sửa điện chuyên khắc phục sự cố chập cháy, mất điện, thay dây, ổ cắm, công tắc và lắp đặt hệ thống điện mới. Đội ngũ thợ điện lành nghề, phục vụ nhanh chóng và an toàn tuyệt đối. Cam kết chất lượng, giá cả minh bạch và hỗ trợ 24/7.',
    category: 'Điện',
    keywords: ['điện', 'chập cháy', 'mất điện', 'ổ cắm', 'công tắc', 'dây điện', 'cầu dao', 'short circuit']
  },
  {
    serviceName: 'Lắp đặt hệ thống điện',
    description: 'Dịch vụ lắp đặt hệ thống điện chuyên thiết kế, đi dây, lắp đặt ổ cắm, công tắc và các thiết bị điện cho nhà ở, văn phòng hoặc công trình. Đội ngũ kỹ thuật viên chuyên nghiệp, đảm bảo an toàn và thẩm mỹ. Cam kết chất lượng, đúng tiến độ và giá cả minh bạch.',
    category: 'Điện',
    keywords: ['lắp đặt điện', 'hệ thống điện', 'đi dây điện', 'thiết kế điện', 'công trình mới']
  },
  {
    serviceName: 'Hệ thống chiếu sáng',
    description: 'Dịch vụ hệ thống chiếu sáng chuyên tư vấn, thiết kế và lắp đặt đèn chiếu sáng cho nhà ở, văn phòng, cửa hàng hoặc công trình. Đảm bảo ánh sáng đều, tiết kiệm điện và thẩm mỹ. Hỗ trợ bảo trì, sửa chữa nhanh chóng với đội ngũ kỹ thuật uy tín.',
    category: 'Điện',
    keywords: ['chiếu sáng', 'đèn', 'ánh sáng', 'led', 'bóng đèn', 'đèn trang trí']
  }
];

// Category summary (matches database exactly)
const CATEGORY_SUMMARY = {
  'Nước': 3,        // Plumbing services
  'Điện lạnh': 5,   // Cooling & Refrigeration services  
  'Điện': 3         // Electrical services
} as const;

// Get all categories
const getAllCategories = (): string[] => {
  return Object.keys(CATEGORY_SUMMARY);
};
```

**Database Alignment Notes:**
- ✅ Category names match database exactly: `Nước`, `Điện`, `Điện lạnh`
- ✅ All 11 services mapped to correct categories
- ✅ `Điện lạnh` combines both air conditioning (máy lạnh) and refrigeration (tủ lạnh) services
- ⚠️ **CRITICAL**: When calling API, ensure category field matches these exact Vietnamese names
const getAllCategories = () => {
  return Object.entries(CATEGORY_NAMES).map(([id, name]) => ({
    categoryId: id,
    categoryName: name,
    serviceCount: getServicesByCategory(id).length
  }));
};
```

### System Prompt Template (Optimized with Hard-coded Catalog)

```typescript
const buildSystemPrompt = (): string => {
  // Build category list with services
  const categoryList = Object.entries(CATEGORY_SUMMARY)
    .map(([categoryName, count], index) => {
      const categoryServices = EZYFIX_SERVICE_CATALOG.filter(s => s.category === categoryName);
      return `${index + 1}. ${categoryName} (${count} dịch vụ)
   ${categoryServices.map(s => `• ${s.serviceName}`).join('\n   ')}`;
    })
    .join('\n\n');

  // Build detailed service list
  const serviceList = EZYFIX_SERVICE_CATALOG
    .map((service, index) => {
      return `${index + 1}. ${service.serviceName} [${service.category}]
   Mô tả: ${service.description}
   Từ khóa: ${service.keywords.join(', ')}`;
    })
    .join('\n\n');

  return `
Bạn là trợ lý AI của EzyFix - nền tảng đặt thợ sửa chữa hàng đầu Việt Nam.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NHIỆM VỤ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Phân tích hình ảnh và mô tả vấn đề từ khách hàng
2. Đưa ra chẩn đoán và giải pháp sơ cứu CƠ BẢN (3-5 bước)
3. Khuyến khích khách hàng thử tự khắc phục trước
4. Nếu không được, đề xuất dịch vụ EzyFix phù hợp nhất

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUY TẮC QUAN TRỌNG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[PHẠM VI DỊCH VỤ]
- Bạn CÓ THỂ tư vấn sơ cứu cho MỌI lĩnh vực sửa chữa (điện, nước, điện tử, cơ khí, xây dựng...)
- NHƯNG chỉ đề xuất ĐẶT THỢ khi thuộc 3 CATEGORY và 11 DỊCH VỤ bên dưới
- Nếu vấn đề NGOÀI phạm vi 11 dịch vụ → Tư vấn sơ cứu + Thông báo không cung cấp dịch vụ

[NỘI DUNG TRẢ LỜI]
- Giải pháp phải AN TOÀN - KHÔNG yêu cầu mở điện, tháo máy, thao tác nguy hiểm
- Câu trả lời NGẮN GỌN (2-3 câu chẩn đoán, 3-5 bước giải pháp)
- Luôn thân thiện, chuyên nghiệp, dùng ngôn ngữ dễ hiểu
- KHÔNG dùng emoji/icon trong nội dung trả lời

[KHI ĐỀ XUẤT DỊCH VỤ]
- Nếu thuộc 11 dịch vụ → recommendedServiceName = tên chính xác từ danh sách
- Nếu NGOÀI 11 dịch vụ → recommendedServiceName = null + serviceOutOfScope = true

[TUYỆT ĐỐI KHÔNG]
- KHÔNG trả lời về: chính trị, tôn giáo, y tế, pháp luật
- KHÔNG đưa ra giải pháp nguy hiểm (mở máy, sờ dây điện, tháo linh kiện)
- KHÔNG khuyên mua thiết bị mới (khuyến khích sửa chữa)
- KHÔNG dùng emoji/icon trong diagnosis, quickFixes, hoặc bất kỳ text nào

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DANH MỤC 3 LOẠI DỊCH VỤ EZYFIX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${categoryList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHI TIẾT 11 DỊCH VỤ EZYFIX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${serviceList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ĐỊNH DẠNG PHẢN HỒI (JSON)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "diagnosis": "Chẩn đoán ngắn gọn vấn đề (1-2 câu, KHÔNG dùng emoji)",
  "quickFixes": [
    "Bước 1: Mô tả cụ thể (KHÔNG dùng emoji)",
    "Bước 2: Mô tả cụ thể (KHÔNG dùng emoji)",
    "Bước 3: Mô tả cụ thể (KHÔNG dùng emoji)"
  ],
  "videoLink": "URL YouTube hướng dẫn (hoặc null nếu không có)",
  "recommendedServiceName": "TÊN CHÍNH XÁC từ 11 dịch vụ (hoặc null nếu ngoài phạm vi)",
  "estimatedCost": "Ước tính chi phí (ví dụ: 150,000đ - 300,000đ, hoặc null nếu không cung cấp dịch vụ)",
  "complexity": "low | medium | high",
  "serviceOutOfScope": false,
  "outOfScopeMessage": "Thông báo khi ngoài phạm vi (hoặc null nếu trong phạm vi)"
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VÍ DỤ PHẢN HỒI CHUẨN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VÍ DỤ 1: Vấn đề TRONG phạm vi dịch vụ
User: "Máy lạnh không mát, chạy ồn"
Response:
{
  "diagnosis": "Máy lạnh có dấu hiệu thiếu gas hoặc lọp gió bẩn, cần kiểm tra và vệ sinh.",
  "quickFixes": [
    "Bước 1: Tắt máy và kiểm tra lọc gió - nếu bẩn, rửa sạch và phơi khô",
    "Bước 2: Bật lại máy, đặt nhiệt độ 18-20 độ C và chờ 15 phút",
    "Bước 3: Nếu vẫn không mát hoặc ồn, cần gọi thợ kiểm tra gas và dàn lạnh"
  ],
  "videoLink": null,
  "recommendedServiceName": "Sửa máy lạnh",
  "estimatedCost": "200,000đ - 500,000đ",
  "complexity": "medium",
  "serviceOutOfScope": false,
  "outOfScopeMessage": null
}

VÍ DỤ 2: Vấn đề NGOÀI phạm vi dịch vụ
User: "Laptop bị nóng và chậm"
Response:
{
  "diagnosis": "Laptop có thể bị bụi tích tụ trong quạt tản nhiệt hoặc phần mềm chạy nền nhiều, cần vệ sinh và tối ưu hệ thống.",
  "quickFixes": [
    "Bước 1: Kiểm tra và đóng các ứng dụng không cần thiết trong Task Manager",
    "Bước 2: Đặt laptop ở nơi thoáng mát, không đặt trên chăn hoặc bề mặt mềm",
    "Bước 3: Sao lưu dữ liệu quan trọng và cân nhắc mang đến trung tâm bảo hành"
  ],
  "videoLink": null,
  "recommendedServiceName": null,
  "estimatedCost": null,
  "complexity": "medium",
  "serviceOutOfScope": true,
  "outOfScopeMessage": "Rất tiếc, EzyFix hiện chưa cung cấp dịch vụ sửa chữa laptop và thiết bị điện tử. Bạn có thể tham khảo các dịch vụ mà chúng tôi đang cung cấp như sửa điện, nước, máy lạnh và tủ lạnh tại trang Dịch vụ."
}

VÍ DỤ 3: Vấn đề NGOÀI phạm vi - Sửa ô tô
User: "Xe ô tô bị rung lắc khi chạy"
Response:
{
  "diagnosis": "Xe có thể gặp vấn đề về hệ thống treo, lốp mất cân bằng hoặc phanh bị mòn, cần kiểm tra tại garage chuyên nghiệp.",
  "quickFixes": [
    "Bước 1: Kiểm tra áp suất lốp xe, đảm bảo đủ và đều các bánh",
    "Bước 2: Quan sát xem rung lắc xảy ra ở tốc độ nào (dưới 40km/h, trên 60km/h...)",
    "Bước 3: Liên hệ garage ô tô để kiểm tra hệ thống treo và cân bằng động lốp"
  ],
  "videoLink": null,
  "recommendedServiceName": null,
  "estimatedCost": null,
  "complexity": "high",
  "serviceOutOfScope": true,
  "outOfScopeMessage": "Xin lỗi bạn, EzyFix chuyên về dịch vụ sửa chữa nhà ở (điện, nước, máy lạnh, tủ lạnh) nên chưa hỗ trợ sửa chữa ô tô. Bạn vui lòng tham khảo các dịch vụ của chúng tôi tại trang Dịch vụ để biết thêm chi tiết."
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LƯU Ý:
• recommendedServiceName PHẢI là NULL khi serviceOutOfScope = true
• recommendedServiceName PHẢI khớp CHÍNH XÁC với 1 trong 11 dịch vụ khi serviceOutOfScope = false
• outOfScopeMessage nên thân thiện, lịch sự và mời khách hàng xem trang Dịch vụ
• Không dùng "Trang All Services" - hãy dùng "trang Dịch vụ" hoặc "danh sách dịch vụ"
• complexity: low (vệ sinh, kiểm tra), medium (sửa nhỏ), high (thay thế, sửa lớn)
• Luôn trả lời bằng JSON hợp lệ, không thêm markdown hoặc text thừa
• Ngôn ngữ: Tiếng Việt thân thiện, chuyên nghiệp, KHÔNG dùng emoji

Hãy giúp khách hàng tận tình!
`.trim();
};

// Pre-build system prompt (chỉ cần build 1 lần)
const SYSTEM_PROMPT = buildSystemPrompt();
```

### User Message Format

```typescript
const createUserMessage = async (
  imageBase64: string,
  textDescription: string,
  userHistory?: {
    previousServices: string[];
    lastAddress: string;
  }
) => {
  // Load current service catalog for AI context
  const { services, categories } = await loadEzyFixServices();
  
  // Build service summary for AI
  const serviceSummary = categories.map(cat => {
    const catServices = services
      .filter(s => s.categoryId === cat.categoryId)
      .map(s => `${s.serviceName} (${formatCurrency(s.basePrice)})`)
      .join(', ');
    
    return `${cat.categoryName}: ${catServices}`;
  }).join('\n');

  return {
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: imageBase64
            }
          },
          {
            text: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THÔNG TIN KHÁCH HÀNG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Vấn đề: ${textDescription}

${userHistory ? `
Lịch sử sử dụng dịch vụ: ${userHistory.previousServices.join(', ')}
Địa điểm: ${userHistory.lastAddress}
` : 'Khách hàng mới (chưa có lịch sử sử dụng dịch vụ)'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DỊCH VỤ EZYFIX CÓ SẴN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${serviceSummary}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YÊU CẦU:
1. Phân tích hình ảnh đính kèm
2. Đưa ra chẩn đoán ngắn gọn
3. Đề xuất 3-5 bước sơ cứu AN TOÀN
4. Đề xuất dịch vụ EzyFix PHÙ HỢP NHẤT từ danh sách trên
5. Ước tính chi phí dựa trên mức độ phức tạp

Hãy trả lời theo định dạng JSON đã quy định.
            `.trim()
          }
        ]
      }
    ]
  };
};
```

### Response Processing

```typescript
interface AIResponse {
  diagnosis: string;
  quickFixes: string[];
  videoLink?: string | null;
  recommendedServiceId: string;    // Changed from serviceRecommendation
  recommendedServiceName: string;  // NEW: For display
  estimatedCost: string;
}

const processAIResponse = async (rawResponse: string): Promise<AIResponse> => {
  try {
    const parsed = JSON.parse(rawResponse);
    
    // Validate serviceId exists in our database
    const isValidService = await validateServiceId(parsed.recommendedServiceId);
    
    if (!isValidService) {
      // Fallback: Find similar service
      const fallbackService = await findSimilarService(parsed.recommendedServiceName);
      parsed.recommendedServiceId = fallbackService.serviceId;
      parsed.recommendedServiceName = fallbackService.serviceName;
    }
    
    return {
      diagnosis: sanitizeText(parsed.diagnosis),
      quickFixes: parsed.quickFixes.slice(0, 5), // Max 5 steps
      videoLink: isValidYouTubeURL(parsed.videoLink) ? parsed.videoLink : null,
      recommendedServiceId: parsed.recommendedServiceId,
      recommendedServiceName: parsed.recommendedServiceName,
      estimatedCost: formatCurrency(parsed.estimatedCost)
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    
    // Fallback to plain text response
    return {
      diagnosis: rawResponse.substring(0, 200),
      quickFixes: extractStepsFromText(rawResponse),
      recommendedServiceId: await getDefaultServiceId(),
      recommendedServiceName: 'Sửa chữa tổng hợp',
      estimatedCost: 'Liên hệ'
    };
  }
};

// Helper: Validate service ID from API
const validateServiceId = async (serviceId: string): Promise<boolean> => {
  try {
    const service = await servicesService.getServiceById(serviceId);
    return !!service;
  } catch (error) {
    return false;
  }
};

// Helper: Find similar service by name
const findSimilarService = async (serviceName: string): Promise<Service> => {
  const services = await servicesService.getAllServices();
  
  // Simple fuzzy matching
  const matches = services.filter(s => 
    s.serviceName?.toLowerCase().includes(serviceName.toLowerCase()) ||
    serviceName.toLowerCase().includes(s.serviceName?.toLowerCase() || '')
  );
  
  return matches.length > 0 
    ? matches[0] 
    : services[0]; // Fallback to first service
};

// Helper: Get default/fallback service
const getDefaultServiceId = async (): Promise<string> => {
  const services = await servicesService.getAllServices();
  // Return first service as fallback
  return services.length > 0 ? services[0].serviceId : '';
};

// Helper: Format currency in Vietnamese style
const formatCurrency = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d]/g, '')) : value;
  
  if (isNaN(num)) return 'Liên hệ';
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(num);
};
```

## 📝 Service Detection Logic

```typescript
import { servicesService } from '../lib/api/services';
import type { Service, Category } from '../types/api';

/**
 * Service Cache Manager
 * Caches service data to reduce API calls
 */
class ServiceCacheManager {
  private servicesCache: Service[] = [];
  private categoriesCache: Category[] = [];
  private lastUpdate: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getServices(): Promise<Service[]> {
    if (this.shouldRefresh()) {
      await this.refresh();
    }
    return this.servicesCache;
  }

  async getCategories(): Promise<Category[]> {
    if (this.shouldRefresh()) {
      await this.refresh();
    }
    return this.categoriesCache;
  }

  private shouldRefresh(): boolean {
    return Date.now() - this.lastUpdate > this.CACHE_DURATION || 
           this.servicesCache.length === 0;
  }

  private async refresh(): Promise<void> {
    try {
      const [services, categories] = await Promise.all([
        servicesService.getAllServices(),
        servicesService.getAllCategories()
      ]);
      
      this.servicesCache = services;
      this.categoriesCache = categories;
      this.lastUpdate = Date.now();
      
      console.log(`✅ Service cache refreshed: ${services.length} services, ${categories.length} categories`);
    } catch (error) {
      console.error('Failed to refresh service cache:', error);
      // Keep using old cache if refresh fails
    }
  }

  // Force refresh (call after admin updates services)
  async forceRefresh(): Promise<void> {
    this.lastUpdate = 0;
    await this.refresh();
  }
}

// Singleton instance
const serviceCacheManager = new ServiceCacheManager();

/**
 * Detect best matching service from AI response and user input
 * Uses actual service data from API
 */
const detectServiceFromAI = async (
  aiResponse: AIResponse,
  imageAnalysis: string,
  userInput: string
): Promise<{ serviceId: string; serviceName: string }> => {
  
  // 1. If AI already provided valid serviceId, use it
  if (aiResponse.recommendedServiceId) {
    try {
      const service = await servicesService.getServiceById(aiResponse.recommendedServiceId);
      if (service) {
        return {
          serviceId: service.serviceId,
          serviceName: service.serviceName || ''
        };
      }
    } catch (error) {
      console.warn('AI recommended service not found:', aiResponse.recommendedServiceId);
    }
  }
  
  // 2. Load all services from cache
  const allServices = await serviceCacheManager.getServices();
  
  if (allServices.length === 0) {
    throw new Error('No services available');
  }
  
  // 3. Build search text from all available sources
  const searchText = `
    ${aiResponse.recommendedServiceName || ''} 
    ${userInput} 
    ${imageAnalysis}
    ${aiResponse.diagnosis}
  `.toLowerCase();
  
  // 4. Score each service based on keyword matching
  const scoredServices = allServices.map(service => {
    let score = 0;
    
    // Match service name
    if (service.serviceName) {
      const serviceName = service.serviceName.toLowerCase();
      if (searchText.includes(serviceName)) {
        score += 10; // High weight for exact service name match
      }
      
      // Partial word match
      serviceName.split(' ').forEach(word => {
        if (word.length > 2 && searchText.includes(word)) {
          score += 2;
        }
      });
    }
    
    // Match description keywords
    if (service.description) {
      const description = service.description.toLowerCase();
      description.split(' ').forEach(word => {
        if (word.length > 3 && searchText.includes(word)) {
          score += 1;
        }
      });
    }
    
    return { service, score };
  });
  
  // 5. Sort by score and return best match
  scoredServices.sort((a, b) => b.score - a.score);
  
  const bestMatch = scoredServices[0];
  
  if (bestMatch.score === 0) {
    // No match found, return first service as fallback
    console.warn('No matching service found, using fallback');
    return {
      serviceId: allServices[0].serviceId,
      serviceName: allServices[0].serviceName || 'Dịch vụ sửa chữa'
    };
  }
  
  return {
    serviceId: bestMatch.service.serviceId,
    serviceName: bestMatch.service.serviceName || ''
  };
};

/**
 * Get service details with category information
 */
const getServiceWithCategory = async (serviceId: string): Promise<{
  service: Service;
  category: Category | null;
}> => {
  const service = await servicesService.getServiceById(serviceId);
  
  // Get category details from cache
  let category: Category | null = null;
  try {
    const allCategories = await serviceCacheManager.getCategories();
    category = allCategories.find(cat => cat.categoryId === service.categoryId) || null;
  } catch (error) {
    console.error('Failed to fetch category:', error);
  }
  
  return { service, category };
};

/**
 * Search services by keyword (uses API search endpoint)
 */
const searchServicesByKeyword = async (keyword: string): Promise<Service[]> => {
  try {
    return await servicesService.searchServices(keyword);
  } catch (error) {
    console.error('Service search failed:', error);
    return [];
  }
};

/**
 * Get service price estimate
 */
const getServicePriceEstimate = (service: Service, complexity: 'low' | 'medium' | 'high'): string => {
  const basePrice = service.basePrice || 0;
  
  const multipliers = {
    low: { min: 1.0, max: 1.2 },
    medium: { min: 1.2, max: 1.5 },
    high: { min: 1.5, max: 2.0 }
  };
  
  const mult = multipliers[complexity];
  const minPrice = basePrice * mult.min;
  const maxPrice = basePrice * mult.max;
  
  return `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
};

/**
 * Example: Detect complexity from AI diagnosis
 */
const detectComplexity = (diagnosis: string): 'low' | 'medium' | 'high' => {
  const lowKeywords = ['vệ sinh', 'làm sạch', 'kiểm tra', 'đơn giản'];
  const highKeywords = ['thay thế', 'sửa chữa lớn', 'hỏng nặng', 'phức tạp'];
  
  const lowerDiagnosis = diagnosis.toLowerCase();
  
  if (highKeywords.some(kw => lowerDiagnosis.includes(kw))) {
    return 'high';
  }
  
  if (lowKeywords.some(kw => lowerDiagnosis.includes(kw))) {
    return 'low';
  }
  
  return 'medium';
};

// Export cache manager for external use
export { serviceCacheManager };
```

## 🔐 Security & Privacy

### API Key Management
```typescript
// DO NOT commit API key to git
// Use environment variables
const AI_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'AIzaSyDBG2XrJgHDZyh07j1AGNiHt5T7xf_YPWA',
  model: 'gemini-2.5-flash',
  maxTokens: 1024,
  temperature: 0.7
};
```

### Data Privacy
```typescript
// Images uploaded during AI chat
const imagePrivacy = {
  storage: 'Temporary (24 hours)',
  deletion: 'Auto-delete after booking OR session timeout',
  access: 'Customer + Assigned Technician only',
  encryption: 'AES-256 at rest'
};

// Conversation logs
const chatPrivacy = {
  retention: '30 days for quality improvement',
  anonymization: 'User ID replaced with hash',
  optOut: 'User can delete in settings'
};
```

## 📊 Analytics & Tracking

### Key Metrics

```typescript
interface AIAssistantMetrics {
  // Engagement
  totalSessions: number;
  averageSessionDuration: number;
  messagesPerSession: number;
  
  // Effectiveness
  problemSolvedRate: number; // % users clicked "Đã sửa được"
  bookingConversionRate: number; // % users proceeded to booking
  
  // Service Detection Accuracy
  correctServiceDetection: number; // Manual review needed
  
  // User Satisfaction
  feedbackRating: number; // 1-5 stars
  
  // Performance
  averageResponseTime: number; // AI response latency
  errorRate: number; // API failures
}
```

### Event Tracking

```typescript
// Firebase Analytics / Mixpanel
const trackAIEvent = (event: string, params: object) => {
  analytics.logEvent(`ai_assistant_${event}`, {
    ...params,
    timestamp: new Date().toISOString(),
    user_id: user.id,
    session_id: aiSessionId
  });
};

// Example usage
trackAIEvent('session_started', {});
trackAIEvent('image_uploaded', { image_size: fileSize });
trackAIEvent('solution_provided', { service_type: detectedService });
trackAIEvent('problem_solved', { self_solved: true });
trackAIEvent('booking_initiated', { from_ai: true });
```

## 🧪 Testing Strategy

### Unit Tests
```typescript
describe('AI Assistant Service Detection', () => {
  it('should detect air-conditioner from image and text', () => {
    const input = {
      text: 'Máy lạnh không mát',
      imageAnalysis: 'air conditioning unit visible'
    };
    
    const result = detectServiceFromAI(mockAIResponse, input.imageAnalysis, input.text);
    expect(result).toBe('air-conditioner-service-id');
  });
  
  it('should handle ambiguous inputs', () => {
    const input = {
      text: 'Thiết bị không hoạt động',
      imageAnalysis: 'unclear image'
    };
    
    const result = detectServiceFromAI(mockAIResponse, input.imageAnalysis, input.text);
    expect(result).toBe('general-repair-service-id');
  });
});
```

### Integration Tests
```typescript
describe('AI to Booking Flow', () => {
  it('should auto-fill booking form with AI data', async () => {
    const aiData = {
      serviceId: 'air-conditioner',
      description: 'AC not cooling properly',
      images: [uploadedImage1, uploadedImage2]
    };
    
    await navigateToBookingFromAI(aiData);
    
    const form = screen.getByTestId('booking-form');
    expect(form.serviceDescription).toBe(aiData.description);
    expect(form.images).toHaveLength(2);
  });
});
```

### Manual QA Checklist
- [ ] AI responds within 5 seconds for 95% of requests
- [ ] Service detection accuracy > 80%
- [ ] No inappropriate responses (profanity filter)
- [ ] Images upload successfully to media API
- [ ] Auto-fill works correctly in book-service
- [ ] "Book Now" option pre-selected from AI flow
- [ ] Conversation history persists during session
- [ ] Graceful error handling for API failures

## 🚀 Deployment Plan

### Phase 1: MVP (Week 1-2)
- [ ] Basic chat interface
- [ ] Image upload + text input
- [ ] Gemini API integration
- [ ] Simple solution display
- [ ] Yes/No outcome selection

### Phase 2: Booking Integration (Week 3)
- [ ] Service detection algorithm
- [ ] Auto-fill booking form
- [ ] Image transfer to book-service
- [ ] "Book Now" option in select-schedule

### Phase 3: Enhancement (Week 4)
- [ ] Video recommendations
- [ ] Conversation history
- [ ] Feedback collection
- [ ] Analytics dashboard

### Phase 4: Optimization (Week 5+)
- [ ] Voice input support
- [ ] Multi-language (English)
- [ ] Smart address suggestion
- [ ] Technician matching preview

## 📚 API Reference

### Gemini API Setup

```typescript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: AI_CONFIG.apiKey
});

const chat = async (message: string, imageBase64?: string) => {
  const contents = imageBase64
    ? [
        {
          inlineData: { mimeType: 'image/jpeg', data: imageBase64 }
        },
        { text: message }
      ]
    : [{ text: message }];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      role: 'user',
      parts: contents
    },
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    }
  });

  return response.text;
};
```

### Media Service Integration

```typescript
// CRITICAL: Must match book-service.tsx media flow exactly

// Interface for tracking uploaded media (same as book-service)
interface UploadedMedia {
  mediaID: string;      // ID from backend
  fileURL: string;      // Backend URL for submission
  localUri: string;     // Local URI for display
  isUploading?: boolean; // Upload in progress
}

// Upload image during AI chat (same process as book-service)
const uploadAIImage = async (localUri: string): Promise<UploadedMedia> => {
  // Prepare file for upload (same format as book-service)
  const file = {
    uri: localUri,
    type: 'image/jpeg',
    name: `ai_chat_${Date.now()}.jpg` // Different prefix to distinguish from book-service
  };

  // Upload to backend with empty requestID (same as book-service)
  // Backend will link this media to the actual requestID when service request is created
  const uploadResponse = await mediaService.uploadMedia({
    requestID: '', // Empty string - backend allows this and links later
    file,
    mediaType: 'ISSUE' as MediaType
  });

  return {
    mediaID: uploadResponse.mediaID,
    fileURL: uploadResponse.fileURL,
    localUri: localUri,
    isUploading: false
  };
};

// When navigating to book-service, pass uploadedMedia array
// book-service will use the existing mediaID and fileURL
const navigateToBooking = (aiResponse: AIResponse, uploadedMedia: UploadedMedia[]) => {
  router.push({
    pathname: '/customer/book-service',
    params: {
      ...bookingData,
      fromAI: 'true',
      // Pass uploaded media as JSON string
      uploadedMediaJSON: JSON.stringify(uploadedMedia.map(m => ({
        mediaID: m.mediaID,
        fileURL: m.fileURL,
        localUri: m.localUri
      })))
    }
  });
};
```

## ⚠️ Known Limitations & Future Improvements

### Current Limitations
1. **Language**: Vietnamese only (English planned for Phase 4)
2. **Image limit**: 1 image per message (multi-image in future)
3. **Service coverage**: 6 main categories only
4. **Offline**: Requires internet connection
5. **Response time**: 2-5 seconds (depends on Gemini API)

### Future Enhancements
1. **Voice Assistant**: Speech-to-text input
2. **AR Preview**: Show technician arrival on map
3. **Cost Estimator**: AI predicts repair cost
4. **Smart Scheduling**: AI suggests best time slots
5. **Proactive Tips**: Maintenance reminders
6. **Community Q&A**: Learn from similar issues

## 📞 Support & Maintenance

### Error Handling
```typescript
try {
  const response = await chat(userMessage, imageBase64);
  displayAIResponse(response);
} catch (error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    showError('Hệ thống đang bận. Vui lòng thử lại sau 1 phút.');
  } else if (error.code === 'INVALID_API_KEY') {
    logCriticalError('Gemini API key invalid');
    showError('Lỗi hệ thống. Vui lòng liên hệ support.');
  } else {
    showError('Không thể kết nối AI. Bạn có thể đặt dịch vụ trực tiếp.');
    // Show fallback: Direct booking button
  }
}
```

### Monitoring
- **Sentry**: Error tracking
- **Firebase**: Analytics & Crashlytics
- **CloudWatch**: API usage & costs
- **Custom Dashboard**: AI performance metrics

---

## � Practical Implementation Example

### Complete AI Assistant Flow

```typescript
import { GoogleGenAI } from "@google/genai";
import { servicesService } from '../lib/api/services';
import { mediaService } from '../lib/api/media';
import { useAuth } from '../store/authStore';

// AI Assistant Service
class AIAssistantService {
  private ai: GoogleGenAI;
  private systemPrompt: string = '';
  
  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'AIzaSyDBG2XrJgHDZyh07j1AGNiHt5T7xf_YPWA'
    });
  }

  // Initialize system prompt with latest services
  async initialize() {
    this.systemPrompt = await buildSystemPrompt();
    console.log('✅ AI Assistant initialized with service catalog');
  }

  // Main chat method
  async chat(userMessage: string, imageBase64?: string): Promise<AIResponse> {
    if (!this.systemPrompt) {
      await this.initialize();
    }

    const userMessageContent = await createUserMessage(
      imageBase64 || '',
      userMessage,
      undefined // TODO: Get user history
    );

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userMessageContent.contents,
        systemInstruction: this.systemPrompt,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          responseMimeType: "application/json"
        }
      });

      const rawResponse = response.text;
      return await processAIResponse(rawResponse);
    } catch (error) {
      console.error('AI chat error:', error);
      throw error;
    }
  }
}

// Usage in React Component
const AIAssistantScreen = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedMedia[]>([]);
  const [aiService] = useState(() => new AIAssistantService());

  // Handle image upload
  const handleImageUpload = async (imageUri: string) => {
    try {
      // 1. Upload to media service
      const uploadedMedia = await uploadAIImage(imageUri);
      setUploadedImages(prev => [...prev, uploadedMedia]);

      // 2. Convert to base64 for AI
      const base64 = await convertToBase64(imageUri);
      
      return { uploadedMedia, base64 };
    } catch (error) {
      console.error('Image upload failed:', error);
      throw error;
    }
  };

  // Send message to AI
  const sendMessage = async (text: string, imageBase64?: string) => {
    try {
      // Add user message to chat
      setMessages(prev => [...prev, {
        role: 'user',
        content: text,
        timestamp: new Date()
      }]);

      // Get AI response
      const aiResponse = await aiService.chat(text, imageBase64);

      // Add AI response to chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: formatAIResponse(aiResponse),
        timestamp: new Date(),
        data: aiResponse
      }]);

      return aiResponse;
    } catch (error) {
      console.error('Send message failed:', error);
      // Show error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Xin lỗi, tôi gặp lỗi. Vui lòng thử lại.',
        timestamp: new Date()
      }]);
    }
  };

  // Handle user selecting "Problem solved"
  const handleProblemSolved = () => {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: '🎉 Tuyệt vời! Chúc mừng bạn đã tự giải quyết được vấn đề. Hẹn gặp lại bạn!',
      timestamp: new Date()
    }]);
    
    // Track success
    trackAIEvent('problem_solved', { self_solved: true });
    
    // Navigate back to home after 2 seconds
    setTimeout(() => {
      router.back();
    }, 2000);
  };

  // Handle user selecting "Need help" - redirect to booking
  const handleNeedHelp = async (aiResponse: AIResponse) => {
    // Get detected service details
    const { service, category } = await getServiceWithCategory(
      aiResponse.recommendedServiceId
    );

    // Prepare booking data
    const bookingData = {
      customerName: user?.fullName || '',
      phoneNumber: user?.phoneNumber || '',
      serviceId: service.serviceId,
      serviceName: service.serviceName || '',
      servicePrice: formatCurrency(service.basePrice),
      serviceDescription: generateBookingDescription(aiResponse),
      images: uploadedImages, // Images already uploaded
      addressID: await getLastUsedAddressId(user?.id),
      address: await getLastUsedAddress(user?.id),
      fromAI: 'true'
    };

    // Track conversion
    trackAIEvent('booking_initiated', { 
      service_id: service.serviceId,
      from_ai: true 
    });

    // Navigate to book-service
    router.push({
      pathname: '/customer/book-service',
      params: bookingData
    });
  };

  return (
    <View style={styles.container}>
      {/* Chat messages */}
      <ScrollView style={styles.chatContainer}>
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
      </ScrollView>

      {/* Input area */}
      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={pickImage}>
          <Ionicons name="camera" size={24} />
        </TouchableOpacity>
        
        <TextInput
          placeholder="Mô tả vấn đề..."
          onSubmitEditing={(e) => sendMessage(e.nativeEvent.text)}
        />
      </View>
    </View>
  );
};

// Helper: Generate professional booking description from AI response
const generateBookingDescription = (aiResponse: AIResponse): string => {
  return `
${aiResponse.diagnosis}

Khách hàng đã thử các bước sơ cứu nhưng vẫn cần hỗ trợ chuyên nghiệp.

Đề xuất từ AI:
${aiResponse.quickFixes.map((step, i) => `${i + 1}. ${step}`).join('\n')}

Ước tính: ${aiResponse.estimatedCost}
  `.trim();
};

// Helper: Get last used address
const getLastUsedAddressId = async (userId?: string): Promise<string> => {
  if (!userId) return '';
  
  try {
    const addresses = await addressService.getAllAddresses();
    const userAddresses = addresses.filter(a => a.userId === userId);
    
    // Return most recent or first address
    return userAddresses.length > 0 ? userAddresses[0].addressId : '';
  } catch (error) {
    return '';
  }
};

const getLastUsedAddress = async (userId?: string): Promise<string> => {
  const addressId = await getLastUsedAddressId(userId);
  if (!addressId) return '';
  
  try {
    const addresses = await addressService.getAllAddresses();
    const address = addresses.find(a => a.addressId === addressId);
    return address ? formatAddressDisplay(address) : '';
  } catch (error) {
    return '';
  }
};
```

---

## �📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-14 | Initial documentation |
| 1.1.0 | 2025-11-14 | Added API integration, service detection, caching |

## 👥 Contributors

- **Product Owner**: [Name]
- **AI Engineer**: [Name]
- **Mobile Dev**: [Name]
- **QA Lead**: [Name]

## 📄 License

Proprietary - EzyFix Internal Use Only

---

**Last Updated**: November 14, 2025  
**Status**: 📝 Ready for Implementation
