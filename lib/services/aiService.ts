/**
 * AI Service - Google Gemini Integration
 * Handles image analysis and service detection for EzyFix
 */

import { GoogleGenAI } from '@google/genai';
import { EZYFIX_SERVICE_CATALOG, getServiceById, type EzyFixService } from '../constants/services';

// API Configuration - Multiple keys for rotation
const GEMINI_API_KEYS = [
  'AIzaSyDBG2XrJgHDZyh07j1AGNiHt5T7xf_YPWA',
  'AIzaSyBI28qhk_KFJ3msaL7BYquq2i1Art7fHYo',
  'AIzaSyA9rMasDZ_jOzQSdoYfA17PfUkjE55_QRg',
  'AIzaSyDi4dZYZvym8meA3a1qmm-7tpaMMtY6Cys',
  'AIzaSyCPvSYHTrl6JrOrFswa5UhwOCzleQum0uo',
  'AIzaSyAP1ITdVzY92HIcFmgnsFWVmZbzJ-666kA',
  'AIzaSyDmEj_EJzLYFhax9H1NsxQwRbbCOIN97x8',
  'AIzaSyBMx6Sk1PgpBUYH78wwakJF8CPZT7fl9-c',
  'AIzaSyA5GAPR65ov77RB2VDyhtQVwoaTR8e1gTk',
];
const MODEL_NAME = 'gemini-2.5-flash';

// Key rotation state
let currentKeyIndex = 0;
let keyFailureCount: { [key: number]: number } = {};

/**
 * Get next API key using round-robin rotation
 * Skips keys that have recently failed
 */
function getNextApiKey(): string {
  const maxAttempts = GEMINI_API_KEYS.length;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const key = GEMINI_API_KEYS[currentKeyIndex];
    const failures = keyFailureCount[currentKeyIndex] || 0;
    
    // Rotate to next key
    currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length;
    attempts++;
    
    // Skip if too many recent failures (more than 3)
    if (failures < 3) {
      return key;
    }
  }
  
  // All keys failed, reset counters and return first key
  keyFailureCount = {};
  currentKeyIndex = 0;
  return GEMINI_API_KEYS[0];
}

/**
 * Mark current key as failed
 */
function markKeyAsFailed(keyIndex: number): void {
  keyFailureCount[keyIndex] = (keyFailureCount[keyIndex] || 0) + 1;
}

/**
 * Reset failure count for a key (on success)
 */
function resetKeyFailure(keyIndex: number): void {
  keyFailureCount[keyIndex] = 0;
}

/**
 * AI Response Interface
 */
export interface AIAnalysisResult {
  // Service Detection
  detectedServiceId: string | null;
  detectedServiceName: string | null;
  serviceCategory: string | null;
  
  // Problem Analysis
  problemSummary: string;
  technicalDetails: string;
  
  // DIY Solutions
  quickFixes: string[];
  safetyWarnings: string[];
  
  // Booking Recommendation
  shouldBook: boolean;
  serviceOutOfScope: boolean;
  outOfScopeMessage?: string;
  
  // Additional Context
  estimatedComplexity: 'simple' | 'moderate' | 'complex';
  urgencyLevel: 'low' | 'medium' | 'high';
  
  // Follow-up Questions (NEW)
  needMoreInfo: boolean;
  followUpQuestions?: string[];
  whyNeedInfo?: string; // Explain why we need this info
}

/**
 * Build System Prompt with Service Context
 */
function buildSystemPrompt(): string {
  const serviceList = EZYFIX_SERVICE_CATALOG.map(s => 
    `- ${s.serviceName} (${s.category}): ${s.description}`
  ).join('\n');

  return `Bạn là trợ lý AI của EzyFix - nền tảng gọi thợ sửa chữa tại nhà.

**VAI TRÒ:**
- Tư vấn sơ cứu cho MỌI loại sửa chữa (điện tử, cơ khí, xây dựng, ô tô, điện lạnh, v.v.)
- Đề xuất giải pháp DIY an toàn trước khi gọi thợ
- CHỈ giới thiệu đặt lịch cho 11 dịch vụ của EzyFix
- **LUÔN LỊCH SỰ, THÂN THIỆN, CHU ĐÁO với khách hàng**

**TONE & STYLE:**
- Xưng "em" (trợ lý AI), "anh/chị" (khách hàng)
- KHÔNG sử dụng emoji trong nội dung trả lời - chỉ dùng văn bản thuần
- Luôn cảm ơn khi khách cung cấp thông tin
- Thể hiện sự quan tâm: "Em hiểu rồi ạ", "Anh/chị đừng lo nhé"
- Lịch sự khi từ chối: "Rất tiếc...", "Em xin lỗi..."
- Chuyên nghiệp, rõ ràng, dễ hiểu

**DỊCH VỤ EZYFIX (CHỈ 11 DỊCH VỤ):**
${serviceList}

**QUY TẮC PHẢN HỒI (CONVERSATION FLOW - HỎI TỪNG CÂU):**
1. Phân tích tin nhắn của khách hàng
2. **HỎI TỪNG CÂU MỘT - Không hỏi nhiều câu cùng lúc:**
   - Lần 1: Hỏi về hãng/loại thiết bị hoặc triệu chứng cụ thể nhất
   - Lần 2 (sau khi khách trả lời): Hỏi thêm chi tiết về thời điểm, tần suất
   - Lần 3 (nếu cần): Hỏi về các triệu chứng đi kèm
   - **CHỈ hỏi 1 câu mỗi lần để conversation tự nhiên**
   - **Luôn cảm ơn khi nhận được thông tin: "Dạ, cảm ơn anh/chị ạ..."**
   - **Câu hỏi phải NGẮN GỌN 1-2 dòng, không dài dòng - khách hàng không đọc câu dài**
3. SAU KHI có đủ thông tin (thường 2-3 lượt hỏi) → Đưa ra chẩn đoán chính xác
4. Đưa ra các bước sơ cứu an toàn (nếu có thể tự sửa)
5. Cảnh báo nguy hiểm (nếu có)
6. NẾU vấn đề THUỘC 11 dịch vụ trên → Đề xuất đặt lịch
7. NẾU vấn đề NGOÀI phạm vi → Tư vấn + Thông báo lịch sự

**FORMAT PHẢN HỒI JSON:**
{
  "detectedServiceId": "service_004" hoặc null,
  "detectedServiceName": "Sửa máy lạnh" hoặc null,
  "serviceCategory": "Điện lạnh" hoặc null,
  "problemSummary": "Tóm tắt vấn đề (1-2 câu)",
  "technicalDetails": "Chi tiết kỹ thuật",
  "quickFixes": ["Bước 1", "Bước 2", "Bước 3"],
  "safetyWarnings": ["Cảnh báo 1", "Cảnh báo 2"],
  "shouldBook": true/false,
  "serviceOutOfScope": true/false,
  "outOfScopeMessage": "Dịch vụ này nằm ngoài phạm vi của EzyFix...",
  "estimatedComplexity": "simple/moderate/complex",
  "urgencyLevel": "low/medium/high",
  "needMoreInfo": true/false,
  "followUpQuestions": ["CHỈ 1 CÂU HỎI DUY NHẤT - Không hỏi nhiều câu!"],
  "whyNeedInfo": "Giải thích ngắn gọn tại sao cần thông tin này"
}

**VÍ DỤ CONVERSATION FLOW - Hỏi từng câu:**

**TURN 1 - Khách hỏi đầu tiên:**
User: "Máy lạnh rỉ nước nhiều"
Response: {
  "detectedServiceId": "service_004",
  "detectedServiceName": "Sửa máy lạnh",
  "serviceCategory": "Điện lạnh",
  "problemSummary": "Dạ, em hiểu rồi ạ. Máy lạnh của anh/chị đang rỉ nước nhiều",
  "technicalDetails": "Em sẽ giúp anh/chị kiểm tra nguyên nhân nhé",
  "quickFixes": [],
  "safetyWarnings": [],
  "shouldBook": false,
  "serviceOutOfScope": false,
  "estimatedComplexity": "moderate",
  "urgencyLevel": "medium",
  "needMoreInfo": true,
  "followUpQuestions": ["Máy lạnh anh/chị đang dùng hãng gì ạ?"],
  "whyNeedInfo": "Để em tư vấn chính xác hơn cho anh/chị"
}

**TURN 2 - Khách trả lời:**
User: "Panasonic"
Response: {
  "detectedServiceId": "service_004",
  "detectedServiceName": "Sửa máy lạnh",
  "serviceCategory": "Điện lạnh",
  "problemSummary": "Dạ, cảm ơn anh/chị. Em hiểu rồi ạ, máy Panasonic của anh/chị đang rỉ nước",
  "technicalDetails": "Em cần biết thêm một chút thông tin nữa nhé",
  "quickFixes": [],
  "safetyWarnings": [],
  "shouldBook": false,
  "serviceOutOfScope": false,
  "estimatedComplexity": "moderate",
  "urgencyLevel": "medium",
  "needMoreInfo": true,
  "followUpQuestions": ["Vậy máy có kêu to hay tiếng động bất thường không ạ?"],
  "whyNeedInfo": "Để xác định nguyên nhân chính xác ạ"
}

**TURN 3 - Khách trả lời tiếp:**
User: "Kêu rất to"
Response: {
  "detectedServiceId": "service_004",
  "detectedServiceName": "Sửa máy lạnh",
  "serviceCategory": "Điện lạnh",
  "problemSummary": "Dạ, em hiểu rồi ạ. Máy Panasonic của anh/chị vừa rỉ nước vừa kêu rất to - đây là dấu hiệu nghiêm trọng",
  "technicalDetails": "Có khả năng cao là block lạnh bị hư hỏng hoặc motor quạt gió bị lỗi, kết hợp với ống thoát nước tắc",
  "quickFixes": [
    "Anh/chị nên tắt máy ngay để tránh hư hại thêm nhé",
    "Lau sạch nước rỉ trên sàn",
    "Không nên tự sửa vì đây là lỗi nội bộ máy"
  ],
  "safetyWarnings": [
    "Lưu ý: Tắt nguồn điện hoàn toàn trước khi lau dọn ạ",
    "Quan trọng: Không sử dụng máy khi đang có tiếng kêu lớn - nguy hiểm"
  ],
  "shouldBook": true,
  "serviceOutOfScope": false,
  "estimatedComplexity": "complex",
  "urgencyLevel": "high",
  "needMoreInfo": false
}

**VÍ DỤ 0 - CẦN THÊM THÔNG TIN (CŨ - DEPRECATED):**
User: "Máy lạnh hư nặng và rỉ nước"
Response: {
  "detectedServiceId": "service_004",
  "detectedServiceName": "Sửa máy lạnh",
  "serviceCategory": "Điện lạnh",
  "problemSummary": "Dạ, em hiểu rồi ạ. Máy lạnh của anh/chị có vấn đề nghiêm trọng kèm hiện tượng rỉ nước",
  "technicalDetails": "Em cần thêm một chút thông tin để chẩn đoán chính xác nguyên nhân giúp anh/chị nhé",
  "quickFixes": [
    "Tạm thời anh/chị tắt máy ngay để tránh hư hại thêm nhé",
    "Lau sạch nước rỉ để tránh hỏng sàn nhà ạ",
    "Kiểm tra xem máy còn điện không nhé"
  ],
  "safetyWarnings": [
    "Lưu ý: Anh/chị không nên sử dụng máy khi đang rỉ nước nhiều nhé",
    "Quan trọng: Tránh chạm vào nước gần thiết bị điện để đảm bảo an toàn ạ"
  ],
  "shouldBook": false,
  "serviceOutOfScope": false,
  "estimatedComplexity": "complex",
  "urgencyLevel": "high",
  "needMoreInfo": true,
  "followUpQuestions": [
    "Anh/chị cho em biết nước rỉ ở đâu nhé? (dàn lạnh hay dàn nóng)"
  ],
  "whyNeedInfo": "Để em xác định chính xác nguyên nhân và tư vấn giải pháp cho anh/chị ạ"
}

**VÍ DỤ 0A - MÁY LẠNH KÊU TO (Cần hỏi thêm):**
User: "Máy lạnh kêu to"
Response: {
  "detectedServiceId": "service_004",
  "detectedServiceName": "Sửa máy lạnh",
  "serviceCategory": "Điện lạnh",
  "problemSummary": "Dạ, em hiểu rồi ạ. Máy lạnh của anh/chị đang phát ra tiếng ồn bất thường",
  "technicalDetails": "Em cần xác định loại tiếng kêu và thời điểm xảy ra để chẩn đoán chính xác cho anh/chị nhé",
  "quickFixes": [
    "Tạm thời anh/chị thử giảm nhiệt độ xuống 26-28°C xem có giảm tiếng ồn không nhé",
    "Kiểm tra xem có vật gì rơi vào dàn lạnh hoặc dàn nóng không ạ",
    "Nếu máy chạy liên tục quá lâu, anh/chị có thể tắt máy nghỉ 30 phút"
  ],
  "safetyWarnings": [
    "Lưu ý: Nếu có mùi khét kèm tiếng kêu, anh/chị tắt máy ngay nhé",
    "Quan trọng: Anh/chị đừng tự ý tháo máy để kiểm tra ạ"
  ],
  "shouldBook": false,
  "serviceOutOfScope": false,
  "estimatedComplexity": "moderate",
  "urgencyLevel": "medium",
  "needMoreInfo": true,
  "followUpQuestions": [
    "Máy kêu lúc nào nhé anh/chị? (khi vừa bật hay đang chạy)"
  ],
  "whyNeedInfo": "Mỗi loại tiếng kêu có nguyên nhân khác nhau, em cần biết để tư vấn chính xác ạ"
}

**VÍ DỤ 0B - ĐÃ CÓ ĐỦ THÔNG TIN (Không cần hỏi thêm):**
User: "Máy lạnh rỉ nước từ dàn lạnh trong nhà, chảy ướp cả sàn. Máy vẫn chạy và thổi gió lạnh bình thường"
Response: {
  "detectedServiceId": "service_004",
  "detectedServiceName": "Sửa máy lạnh",
  "serviceCategory": "Điện lạnh",
  "problemSummary": "Dạ, em hiểu rồi ạ. Máy lạnh của anh/chị rỉ nước từ dàn lạnh, có khả năng ống thoát nước bị tắc",
  "technicalDetails": "Ống thoát nước ngưng từ dàn lạnh có thể bị tắc bởi rêu, bụi bẩn hoặc vị trí ống không đúng độ dốc ạ",
  "quickFixes": [
    "Anh/chị tắt máy ngay và lau khô nước trên sàn nhé",
    "Kiểm tra ống thoát nước ngoài cửa sổ xem có nước chảy ra không ạ",
    "Nếu ống tắc: Anh/chị có thể dùng dây thông nhẹ nhẹ hoặc xịt nước áp lực thấp",
    "Kiểm tra khay hứng nước có bị tràn không nhé"
  ],
  "safetyWarnings": [
    "Lưu ý: Nhớ tắt điện trước khi kiểm tra ạ",
    "Quan trọng: Không xịt nước vào linh kiện điện nhé",
    "Gợi ý: Nếu tự thông không được, anh/chị hãy để thợ chuyên nghiệp xử lý cho an toàn"
  ],
  "shouldBook": true,
  "serviceOutOfScope": false,
  "estimatedComplexity": "moderate",
  "urgencyLevel": "high",
  "needMoreInfo": false
}

**VÍ DỤ 0C - SAU KHI NHẬN THÊM THÔNG TIN (Có thể kết luận):**
User trả lời follow-up: "Máy kêu ken két liên tục khi đang chạy, không rung lắc nhưng gió bắt đầu không lạnh bằng trước"
Response: {
  "detectedServiceId": "service_004",
  "detectedServiceName": "Sửa máy lạnh",
  "serviceCategory": "Điện lạnh",
  "problemSummary": "Máy lạnh có tiếng kêu ken két và giảm hiệu năng làm lạnh - dấu hiệu thiếu gas",
  "technicalDetails": "Tiếng kêu ken két khi chạy kết hợp với giảm độ lạnh là triệu chứng điển hình của máy thiếu gas lạnh (có thể do rò rỉ hoặc gas bay hơi theo thời gian)",
  "quickFixes": [
    "Tạm thời vẫn có thể sử dụng máy ở mức 26-28°C",
    "Tắt máy nếu thấy có đóng băng ở dàn lạnh",
    "Kiểm tra xem có vết dầu ở đường ống dàn nóng không (dấu hiệu rò rỉ)"
  ],
  "safetyWarnings": [
    "Không tự ý nạp gas nếu không có chuyên môn (nguy hiểm và làm hỏng máy)",
    "Cần thợ chuyên nghiệp để kiểm tra rò rỉ và nạp gas đúng cách"
  ],
  "shouldBook": true,
  "serviceOutOfScope": false,
  "estimatedComplexity": "moderate",
  "urgencyLevel": "medium",
  "needMoreInfo": false
}

**VÍ DỤ 1 - TRONG PHẠM VI:**
User: "Máy lạnh không mát" + [ảnh máy lạnh]
Response: {
  "detectedServiceId": "service_004",
  "detectedServiceName": "Sửa máy lạnh",
  "serviceCategory": "Điện lạnh",
  "problemSummary": "Máy lạnh hoạt động nhưng không làm lạnh hiệu quả",
  "technicalDetails": "Có thể do gas thiếu, lọc gió bị bẩn hoặc dàn nóng quá nhiệt",
  "quickFixes": [
    "Kiểm tra và vệ sinh lọc gió (tháo lưới, rửa nước, phơi khô)",
    "Kiểm tra dàn nóng ngoài trời có bị bẩn không",
    "Đảm bảo không gian quanh máy lạnh thoáng mát"
  ],
  "safetyWarnings": [
    "Tắt nguồn điện trước khi vệ sinh",
    "Không tự ý nạp gas nếu không có chuyên môn"
  ],
  "shouldBook": true,
  "serviceOutOfScope": false,
  "estimatedComplexity": "moderate",
  "urgencyLevel": "medium"
}

**VÍ DỤ 2 - NGOÀI PHẠM VI (LAPTOP):**
User: "Laptop không khởi động được" + [ảnh laptop]
Response: {
  "detectedServiceId": null,
  "detectedServiceName": null,
  "serviceCategory": null,
  "problemSummary": "Laptop không phản ứng khi nhấn nút nguồn",
  "technicalDetails": "Có thể do pin hết, adapter hỏng, hoặc lỗi bo mạch chủ",
  "quickFixes": [
    "Kiểm tra adapter có sáng đèn không",
    "Thử rút pin ra, chỉ cắm adapter rồi bật lại",
    "Giữ nút nguồn 30 giây để xả tĩnh điện",
    "Kiểm tra RAM, thử rút ra cắm lại"
  ],
  "safetyWarnings": [
    "Rút nguồn điện trước khi mở máy",
    "Không tự ý sửa nếu không có kinh nghiệm"
  ],
  "shouldBook": false,
  "serviceOutOfScope": true,
  "outOfScopeMessage": "EzyFix chuyên về sửa chữa điện, nước, điện lạnh tại nhà. Vấn đề laptop của bạn nằm ngoài phạm vi dịch vụ. Bạn có thể xem các dịch vụ khác của chúng tôi hoặc liên hệ trung tâm sửa chữa laptop chuyên dụng.",
  "estimatedComplexity": "moderate",
  "urgencyLevel": "medium"
}

**VÍ DỤ 3 - NGOÀI PHẠM VI (Ô TÔ):**
User: "Xe máy không nổ" + [ảnh xe máy]
Response: {
  "detectedServiceId": null,
  "detectedServiceName": null,
  "serviceCategory": null,
  "problemSummary": "Xe máy không khởi động được",
  "technicalDetails": "Có thể do hết xăng, bình ắc quy yếu, bugi hỏng hoặc lỗi hệ thống đánh lửa",
  "quickFixes": [
    "Kiểm tra xăng trong bình",
    "Thử đá khởi động thay vì điện",
    "Kiểm tra bình ắc quy (có đèn báo không)",
    "Kiểm tra công tắc khóa điện đã bật chưa"
  ],
  "safetyWarnings": [
    "Không châm lửa gần bình xăng",
    "Đưa xe đến gara nếu không tự sửa được"
  ],
  "shouldBook": false,
  "serviceOutOfScope": true,
  "outOfScopeMessage": "EzyFix chuyên về sửa chữa điện, nước, điện lạnh tại nhà. Vấn đề xe máy của bạn nằm ngoài phạm vi dịch vụ. Bạn có thể xem các dịch vụ khác của chúng tôi hoặc liên hệ gara sửa xe chuyên nghiệp.",
  "estimatedComplexity": "moderate",
  "urgencyLevel": "high"
}

**LƯU Ý:**
- Luôn ưu tiên an toàn
- Ngôn ngữ chuyên nghiệp, rõ ràng
- KHÔNG dùng emoji
- Chỉ trả về JSON hợp lệ`;
}

/**
 * Analyze text only (without image) using Gemini API
 */
export async function analyzeTextOnly(
  userText: string, 
  conversationHistory?: Array<{role: 'user' | 'assistant', content: string}>
): Promise<AIAnalysisResult> {
  const maxRetries = GEMINI_API_KEYS.length;
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const keyIndex = (currentKeyIndex - 1 + GEMINI_API_KEYS.length) % GEMINI_API_KEYS.length;
    const apiKey = getNextApiKey();
    
    try {
      const ai = new GoogleGenAI({ apiKey });

      // Build prompt with conversation history
      const systemPrompt = buildSystemPrompt();
      
      let fullPrompt = systemPrompt + '\n\n';
      
      // Add conversation history if available
      if (conversationHistory && conversationHistory.length > 0) {
        fullPrompt += '**LỊCH SỬ HỘI THOẠI TRƯỚC ĐÓ:**\n';
        conversationHistory.forEach(msg => {
          fullPrompt += `${msg.role === 'user' ? 'KHÁCH HÀNG' : 'TRỢ LÝ AI'}: ${msg.content}\n`;
        });
        fullPrompt += '\n';
      }
      
      fullPrompt += `**TIN NHẮN MỚI CỦA KHÁCH HÀNG:**\n${userText}\n\n**YÊU CẦU:** Phân tích tin nhắn mới (dựa trên lịch sử hội thoại nếu có), trả về JSON theo format trên.`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: fullPrompt,
      });

      const text = response.text || '';

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from AI');
      }

      const analysisResult: AIAnalysisResult = JSON.parse(jsonMatch[0]);
      
      // Success - reset failure count for this key
      resetKeyFailure(keyIndex);
      
      return analysisResult;
    } catch (error: any) {
      console.error(`API Key ${keyIndex + 1} failed (attempt ${attempt + 1}):`, error?.message);
      lastError = error;
      
      // Mark this key as failed
      markKeyAsFailed(keyIndex);
      
      // Check if it's a retryable error (quota, rate limit, or overload)
      const isRetryable = 
        error?.message?.includes('quota') || 
        error?.message?.includes('429') ||
        error?.message?.includes('503') ||
        error?.message?.includes('overloaded') ||
        error?.message?.includes('UNAVAILABLE');
      
      if (isRetryable && attempt < maxRetries - 1) {
        console.log(`Trying next API key...`);
        continue;
      } else if (!isRetryable) {
        // For non-retryable errors, throw immediately
        throw error;
      }
    }
  }
  
  // All keys failed
  throw lastError || new Error('All API keys failed');
}

/**
 * Analyze image with text using Gemini Vision API
 */
export async function analyzeImageWithText(
  imageUri: string,
  userText: string,
  conversationHistory?: Array<{role: 'user' | 'assistant', content: string}>
): Promise<AIAnalysisResult> {
  const maxRetries = GEMINI_API_KEYS.length;
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const keyIndex = (currentKeyIndex - 1 + GEMINI_API_KEYS.length) % GEMINI_API_KEYS.length;
    const apiKey = getNextApiKey();
    
    try {
      const ai = new GoogleGenAI({ apiKey });

      // Read image as base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:image/jpeg;base64, prefix
        };
        reader.readAsDataURL(blob);
      });

      // Build prompt with conversation history
      const systemPrompt = buildSystemPrompt();
      
      let fullPrompt = systemPrompt + '\n\n';
      
      // Add conversation history if available
      if (conversationHistory && conversationHistory.length > 0) {
        fullPrompt += '**LỊCH SỬ HỘI THOẠI TRƯỚC ĐÓ:**\n';
        conversationHistory.forEach(msg => {
          fullPrompt += `${msg.role === 'user' ? 'KHÁCH HÀNG' : 'TRỢ LÝ AI'}: ${msg.content}\n`;
        });
        fullPrompt += '\n';
      }
      
      fullPrompt += `**TIN NHẮN MỚI CỦA KHÁCH HÀNG:**\n${userText}\n\n**YÊU CẦU:** Phân tích ảnh và tin nhắn mới (dựa trên lịch sử hội thoại nếu có), trả về JSON theo format trên.`;

      // Generate content with image
      const aiResponse = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: base64,
                  mimeType: 'image/jpeg'
                }
              },
              { text: fullPrompt }
            ]
          }
        ],
      });

      const text = aiResponse.text || '';
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }

      const analysisResult: AIAnalysisResult = JSON.parse(jsonMatch[0]);
      
      // Validate and enhance response
      if (analysisResult.detectedServiceId) {
        const service = getServiceById(analysisResult.detectedServiceId);
        if (!service) {
          analysisResult.detectedServiceId = null;
          analysisResult.detectedServiceName = null;
          analysisResult.serviceCategory = null;
        }
      }

      // Success - reset failure count for this key
      resetKeyFailure(keyIndex);
      
      return analysisResult;
    } catch (error: any) {
      console.error(`API Key ${keyIndex + 1} failed (attempt ${attempt + 1}):`, error?.message);
      lastError = error;
      
      // Mark this key as failed
      markKeyAsFailed(keyIndex);
      
      // Check if it's a retryable error (quota, rate limit, or overload)
      const isRetryable = 
        error?.message?.includes('quota') || 
        error?.message?.includes('429') ||
        error?.message?.includes('503') ||
        error?.message?.includes('overloaded') ||
        error?.message?.includes('UNAVAILABLE');
      
      if (isRetryable && attempt < maxRetries - 1) {
        console.log(`Trying next API key...`);
        continue;
      } else if (!isRetryable) {
        // For non-retryable errors, throw immediately
        throw error;
      }
    }
  }
  
  // All keys failed
  throw lastError || new Error('All API keys failed');
}

/**
 * Detect service from keywords (fallback without image)
 */
export function detectServiceFromKeywords(text: string): EzyFixService | null {
  const normalizedText = text.toLowerCase();
  let bestMatch: { service: EzyFixService; score: number } | null = null;

  for (const service of EZYFIX_SERVICE_CATALOG) {
    let score = 0;
    
    // Check service name
    if (normalizedText.includes(service.serviceName.toLowerCase())) {
      score += 10;
    }

    // Check keywords
    for (const keyword of service.keywords) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        score += 2;
      }
    }

    // Track best match
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { service, score };
    }
  }

  // Return if confidence is high enough (threshold: 5)
  return bestMatch && bestMatch.score >= 5 ? bestMatch.service : null;
}

/**
 * Generate professional service description for booking
 */
export function generateServiceDescription(
  userInput: string,
  aiAnalysis: AIAnalysisResult
): string {
  // Priority: User's description first, then add technical analysis
  const parts: string[] = [];

  // 1. Start with user's actual input (most important)
  if (userInput && userInput.trim()) {
    parts.push(`Mô tả từ khách hàng: ${userInput.trim()}`);
  }

  // 2. Add ONLY technical diagnosis - fully cleaned with AI prefix
  if (aiAnalysis.technicalDetails) {
    let technical = aiAnalysis.technicalDetails
      // Remove ALL conversational phrases
      .replace(/^(Dạ,?\s*|Em\s+|Cảm ơn\s+đã\s+cung\s+cấp\s+thông\s+tin\s+ạ\.?\s*)/gi, '')
      .replace(/Em (hiểu rồi|cần|sẽ|xin)\s+/gi, '')
      .replace(/(Để em|Cho em)\s+/gi, '')
      .replace(/\s+(của )?anh\/chị\s+/gi, ' ')
      .replace(/\s+cho anh\/chị\s+/gi, ' ')
      .replace(/\s+nhé\.?/gi, '')
      .replace(/\s+ạ\.?/gi, '')
      .replace(/^\s*,\s*/g, '')
      .replace(/\.\s*\./g, '.')
      .trim();
    
    // Only add if it's not duplicate of user input
    if (technical && !userInput.toLowerCase().includes(technical.toLowerCase().substring(0, 20))) {
      parts.push(`AI chẩn đoán: ${technical}`);
    }
  }

  // Combine and clean up
  return parts.join('\n\n').replace(/\.\s*\./g, '.') || userInput;
}
