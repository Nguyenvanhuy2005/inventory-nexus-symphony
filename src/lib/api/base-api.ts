import { toast } from "sonner";
import { initializeDefaultCredentials } from "../auth-utils";

// API base URLs with fallbacks that will work in browser environment
export const API_BASE_URL = localStorage.getItem('api_url') || import.meta.env.VITE_API_URL || 'https://hcm.sithethao.com/wp-json';
export const WOOCOMMERCE_API_URL = localStorage.getItem('woocommerce_api_url') || import.meta.env.VITE_WOOCOMMERCE_API_URL || 'https://hcm.sithethao.com/wp-json/wc/v3';

// WooCommerce authentication keys from environment or localStorage
export function getConsumerKey() {
  return localStorage.getItem('woocommerce_consumer_key') || import.meta.env.VITE_WOOCOMMERCE_CONSUMER_KEY || '';
}

export function getConsumerSecret() {
  return localStorage.getItem('woocommerce_consumer_secret') || import.meta.env.VITE_WOOCOMMERCE_CONSUMER_SECRET || '';
}

/**
 * Checks if the custom API is working
 * @returns Promise with API status
 */
export async function checkAPIStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/custom/v1/status?_=${Date.now()}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API status check failed: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    console.info('Custom API response data:', data);
    return {
      status: data,
      isConnected: true
    };
  } catch (error) {
    console.error('Error checking API status:', error);
    return { 
      status: { 
        wordpress: {
          connected: false,
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        status: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString() 
      },
      isConnected: false,
      error: error
    };
  }
}

// Export common utility functions that will be used across different API modules
export function handleApiError(error: any, endpoint: string, options: any = {}) {
  console.error(`Error fetching from ${endpoint}:`, error);
  
  // Don't show toast for GET requests to avoid flooding the UI
  if (!options.suppressToast && options.method && options.method !== 'GET') {
    toast.error(`Lỗi API: ${error instanceof Error ? error.message : 'Không thể kết nối tới máy chủ'}`);
  }
  
  throw error;
}
