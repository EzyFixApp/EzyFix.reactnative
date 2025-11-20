/**
 * EzyFix Service Catalog
 * Hard-coded service list (11 services across 3 categories)
 * Optimized for performance and stability
 */

export type ServiceCategory = 'Nước' | 'Điện' | 'Điện lạnh';

export interface EzyFixService {
  serviceId: string;
  serviceName: string;
  category: ServiceCategory;
  description: string;
  keywords: string[]; // For AI detection
  basePrice?: string;
}

/**
 * Complete EzyFix Service Catalog
 * Aligned with database schema
 */
export const EZYFIX_SERVICE_CATALOG: EzyFixService[] = [
  // Category: Nước (Water Services)
  {
    serviceId: 'service_001',
    serviceName: 'Sửa ống nước',
    category: 'Nước',
    description: 'Sửa chữa đường ống nước bị rò rỉ, nứt vỡ, tắc nghẽn. Thay thế ống nước cũ, lắp đặt ống mới.',
    keywords: ['ống nước', 'rò rỉ', 'nứt', 'vỡ', 'thay ống', 'đường ống', 'nước chảy', 'ống bể'],
    basePrice: '200.000đ'
  },
  {
    serviceId: 'service_002',
    serviceName: 'Thông cống',
    category: 'Nước',
    description: 'Thông tắc cống, thông bồn cầu, thông chậu rửa, hút bể phốt. Vệ sinh đường ống thoát nước.',
    keywords: ['cống', 'tắc', 'bồn cầu', 'chậu rửa', 'bể phốt', 'thoát nước', 'hút bể', 'thông tắc'],
    basePrice: '300.000đ'
  },
  {
    serviceId: 'service_003',
    serviceName: 'Bảo trì hệ thống nước',
    category: 'Nước',
    description: 'Kiểm tra, bảo dưỡng hệ thống cấp thoát nước. Vệ sinh bể nước, thay lọc nước, sửa máy bơm.',
    keywords: ['bảo trì', 'bảo dưỡng', 'kiểm tra', 'bể nước', 'máy bơm', 'lọc nước', 'hệ thống nước'],
    basePrice: '500.000đ'
  },

  // Category: Điện lạnh (Cooling & Refrigeration)
  {
    serviceId: 'service_004',
    serviceName: 'Sửa máy lạnh',
    category: 'Điện lạnh',
    description: 'Sửa máy lạnh không mát, tiếng ồn, rò rỉ nước, lỗi nguồn. Nạp gas, thay linh kiện.',
    keywords: ['máy lạnh', 'điều hòa', 'không mát', 'tiếng ồn', 'rò nước', 'gas', 'lạnh', 'air conditioner'],
    basePrice: '300.000đ'
  },
  {
    serviceId: 'service_005',
    serviceName: 'Vệ sinh máy lạnh',
    category: 'Điện lạnh',
    description: 'Vệ sinh dàn lạnh, dàn nóng, lọc gió máy lạnh. Khử mùi, diệt khuẩn, tăng hiệu suất làm lạnh.',
    keywords: ['vệ sinh máy lạnh', 'lọc gió', 'dàn lạnh', 'dàn nóng', 'khử mùi', 'diệt khuẩn'],
    basePrice: '250.000đ'
  },
  {
    serviceId: 'service_006',
    serviceName: 'Lắp đặt máy lạnh',
    category: 'Điện lạnh',
    description: 'Lắp đặt máy lạnh mới, di dời máy lạnh, tháo lắp máy lạnh. Tư vấn vị trí lắp đặt hợp lý.',
    keywords: ['lắp máy lạnh', 'lắp đặt', 'di dời', 'tháo lắp', 'máy lạnh mới'],
    basePrice: '600.000đ'
  },
  {
    serviceId: 'service_007',
    serviceName: 'Sửa tủ lạnh',
    category: 'Điện lạnh',
    description: 'Sửa tủ lạnh không lạnh, kêu to, đóng tuyết, chảy nước. Thay block, nạp gas, sửa bo mạch.',
    keywords: ['tủ lạnh', 'không lạnh', 'kêu to', 'đóng tuyết', 'chảy nước', 'block', 'gas tủ lạnh'],
    basePrice: '300.000đ'
  },
  {
    serviceId: 'service_008',
    serviceName: 'Vệ sinh tủ lạnh',
    category: 'Điện lạnh',
    description: 'Vệ sinh tủ lạnh, khử mùi, diệt khuẩn. Vệ sinh dàn lạnh, thay lọc khí, kiểm tra hệ thống.',
    keywords: ['vệ sinh tủ lạnh', 'khử mùi tủ lạnh', 'diệt khuẩn', 'lọc khí', 'vệ sinh dàn'],
    basePrice: '200.000đ'
  },

  // Category: Điện (Electrical Services)
  {
    serviceId: 'service_009',
    serviceName: 'Sửa điện',
    category: 'Điện',
    description: 'Sửa chập điện, chạm điện, mất điện, cầu dao nhảy. Sửa ổ cắm, công tắc, đấu nối dây điện.',
    keywords: ['điện', 'chập', 'chạm', 'mất điện', 'cầu dao', 'ổ cắm', 'công tắc', 'dây điện'],
    basePrice: '200.000đ'
  },
  {
    serviceId: 'service_010',
    serviceName: 'Lắp đặt hệ thống điện',
    category: 'Điện',
    description: 'Lắp đặt hệ thống điện mới, nâng cấp hệ thống cũ. Đi dây điện, lắp tủ điện, aptomat, CB.',
    keywords: ['lắp điện', 'hệ thống điện', 'đi dây', 'tủ điện', 'aptomat', 'CB', 'lắp đặt'],
    basePrice: '500.000đ'
  },
  {
    serviceId: 'service_011',
    serviceName: 'Hệ thống chiếu sáng',
    category: 'Điện',
    description: 'Lắp đặt, sửa chữa hệ thống chiếu sáng. Thay bóng đèn, đèn LED, đèn trang trí, đèn âm trần.',
    keywords: ['chiếu sáng', 'đèn', 'bóng đèn', 'LED', 'đèn trang trí', 'đèn âm trần'],
    basePrice: '150.000đ'
  }
];

/**
 * Category Summary
 * Vietnamese names matching database exactly
 */
export const CATEGORY_SUMMARY = {
  'Nước': {
    name: 'Nước',
    description: 'Dịch vụ sửa chữa, bảo trì hệ thống cấp thoát nước',
    services: ['service_001', 'service_002', 'service_003']
  },
  'Điện lạnh': {
    name: 'Điện lạnh',
    description: 'Dịch vụ sửa chữa, vệ sinh, lắp đặt máy lạnh và tủ lạnh',
    services: ['service_004', 'service_005', 'service_006', 'service_007', 'service_008']
  },
  'Điện': {
    name: 'Điện',
    description: 'Dịch vụ sửa chữa, lắp đặt hệ thống điện và chiếu sáng',
    services: ['service_009', 'service_010', 'service_011']
  }
} as const;

/**
 * Get service by ID
 */
export function getServiceById(serviceId: string): EzyFixService | undefined {
  return EZYFIX_SERVICE_CATALOG.find(s => s.serviceId === serviceId);
}

/**
 * Get services by category
 */
export function getServicesByCategory(category: ServiceCategory): EzyFixService[] {
  return EZYFIX_SERVICE_CATALOG.filter(s => s.category === category);
}

/**
 * Get all categories
 */
export function getAllCategories(): ServiceCategory[] {
  return ['Nước', 'Điện lạnh', 'Điện'];
}
