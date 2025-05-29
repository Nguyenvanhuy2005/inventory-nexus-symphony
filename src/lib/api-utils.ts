
import { toast } from "sonner";

/**
 * Base API configuration and utility functions
 */

export const API_BASE_URL = 'https://hanoi.sithethao.com/wp-json';

/**
 * Format currency value
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('vi-VN');
}

/**
 * Format datetime for display
 */
export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('vi-VN');
}

/**
 * Show success toast
 */
export function showSuccessToast(message: string) {
  toast.success(message);
}

/**
 * Show error toast
 */
export function showErrorToast(message: string) {
  toast.error(message);
}

/**
 * Handle API errors
 */
export function handleApiError(error: any, context?: string) {
  console.error(`API Error${context ? ` in ${context}` : ''}:`, error);
  
  const message = error?.message || error?.data?.message || 'Đã xảy ra lỗi không xác định';
  showErrorToast(message);
  
  throw error;
}

/**
 * Sleep function for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
}

/**
 * Check if value is empty
 */
export function isEmpty(value: any): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (Vietnamese)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(\+84|84|0)(3|5|7|8|9)\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Safe JSON parse
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return defaultValue;
  }
}

/**
 * Convert object to URL params
 */
export function objectToParams(obj: Record<string, any>): string {
  const params = new URLSearchParams();
  
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      params.append(key, String(value));
    }
  });
  
  return params.toString();
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Check if file is image
 */
export function isImageFile(filename: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  return imageExtensions.includes(getFileExtension(filename));
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// API Functions - Re-export from api module
export { fetchWooCommerce } from './api/woocommerce-api';
export { fetchCustomAPI } from './api/custom-api';
export { uploadAttachment } from './api/wordpress-api';
export { exportToCSV, syncProductsWithStockLevels, getTransactionTypeDisplay, formatTransactionForDisplay } from './api/utils';

/**
 * Fetch stock levels from HMM API Bridge
 */
export async function fetchStockLevels() {
  try {
    // Import fetchCustomAPI from the correct module
    const { fetchCustomAPI } = await import('./api/custom-api');
    const response = await fetchCustomAPI('/hmm/v1/tables/wp_hmm_stock_levels/select', {
      method: 'GET'
    });
    return response.data || [];
  } catch (error) {
    console.error('Error fetching stock levels:', error);
    throw error;
  }
}

/**
 * Mock WooCommerce data for fallback
 */
export const mockWooCommerceData = {
  products: [
    {
      id: 1,
      name: "Sản phẩm mẫu 1",
      sku: "SP001",
      price: "100000",
      regular_price: "100000",
      sale_price: "",
      stock_quantity: 50,
      stock_status: "instock",
      images: [
        {
          id: 1,
          src: "https://via.placeholder.com/300x300",
          name: "Sản phẩm mẫu 1"
        }
      ],
      categories: []
    },
    {
      id: 2,
      name: "Sản phẩm mẫu 2",
      sku: "SP002",
      price: "200000",
      regular_price: "200000",
      sale_price: "",
      stock_quantity: 25,
      stock_status: "instock",
      images: [
        {
          id: 2,
          src: "https://via.placeholder.com/300x300",
          name: "Sản phẩm mẫu 2"
        }
      ],
      categories: []
    }
  ]
};
