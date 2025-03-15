
import { toast } from "sonner";
import { mockWooCommerceData } from "./mock-data";

/**
 * Checks if the custom API is working
 * @returns Promise with API status
 */
export async function checkAPIStatus() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://hmm.vn/wp-json'}/custom/v1/status?_=${Date.now()}`);
    if (!response.ok) {
      throw new Error(`API status check failed: ${response.status}`);
    }
    const data = await response.json();
    console.info('Custom API response data:', data);
    return data;
  } catch (error) {
    console.error('Error checking API status:', error);
    return { 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString() 
    };
  }
}

/**
 * Fetches data from the custom API
 * @param endpoint API endpoint
 * @param options Fetch options
 * @returns Promise with response data
 */
export async function fetchCustomAPI(endpoint: string, options: any = {}) {
  try {
    const fetchOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // If there's a body, stringify it
    if (options.body && typeof options.body === 'object') {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const url = `${process.env.NEXT_PUBLIC_API_URL || 'https://hmm.vn/wp-json'}/custom/v1${endpoint}`;
    console.info(`Fetching Custom API: ${endpoint}`, url);
    
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.info('Custom API response data:', data);
    return data;
  } catch (error) {
    console.error(`Error fetching from custom API (${endpoint}):`, error);
    // Don't show toast for GET requests to avoid flooding the UI
    if (options.method && options.method !== 'GET') {
      toast.error(`Lỗi API: ${error instanceof Error ? error.message : 'Không thể kết nối tới máy chủ'}`);
    }
    throw error;
  }
}

/**
 * Fetches data from the WooCommerce REST API
 * @param endpoint API endpoint
 * @param options Fetch options
 * @returns Promise with response data
 */
export async function fetchWooCommerce(endpoint: string, options: any = {}) {
  try {
    const fetchOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // If there's a body, stringify it
    if (options.body && typeof options.body === 'object') {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const url = `${process.env.NEXT_PUBLIC_WOOCOMMERCE_API_URL || 'https://hmm.vn/wp-json/wc/v3'}${endpoint}`;
    console.info(`Fetching WooCommerce API: ${endpoint}`);
    
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`WooCommerce API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching from WooCommerce API (${endpoint}):`, error);
    
    // For GET requests on products/orders, use mock data as fallback
    if (options.method === 'GET' || !options.method) {
      if (endpoint.includes('/products')) {
        console.info('Using mock product data as fallback');
        return mockWooCommerceData.products;
      } else if (endpoint.includes('/orders')) {
        console.info('Using mock order data as fallback');
        return mockWooCommerceData.orders;
      }
    }
    
    // Don't show toast for GET requests to avoid flooding the UI
    if (options.method && options.method !== 'GET') {
      toast.error(`Lỗi WooCommerce API: ${error instanceof Error ? error.message : 'Không thể kết nối tới máy chủ'}`);
    }
    throw error;
  }
}
