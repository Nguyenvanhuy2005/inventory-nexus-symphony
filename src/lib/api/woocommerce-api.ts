
import { toast } from "sonner";
import { WOOCOMMERCE_API_URL, getConsumerKey, getConsumerSecret } from "./base-api";
import { mockWooCommerceData } from "./mock-data";

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

    // Get the latest credentials from localStorage
    const CONSUMER_KEY = getConsumerKey();
    const CONSUMER_SECRET = getConsumerSecret();

    // Build URL with authentication parameters
    let url = `${WOOCOMMERCE_API_URL}${endpoint}`;
    const searchParams = new URLSearchParams();
    
    // Add authentication parameters
    if (CONSUMER_KEY && CONSUMER_SECRET) {
      searchParams.append('consumer_key', CONSUMER_KEY);
      searchParams.append('consumer_secret', CONSUMER_SECRET);
    } else {
      console.warn('WooCommerce API credentials not found');
    }
    
    // Add any other parameters from options
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        searchParams.append(key, value as string);
      });
    }
    
    // Append all parameters to the URL
    url += `?${searchParams.toString()}`;
    
    console.info(`Fetching WooCommerce API: ${endpoint}`, {
      url: url.replace(/consumer_secret=([^&]+)/, 'consumer_secret=****'),
      hasCredentials: !!CONSUMER_KEY && !!CONSUMER_SECRET
    });
    
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`WooCommerce API error (${response.status}):`, errorText);
      throw new Error(`WooCommerce API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching from WooCommerce API (${endpoint}):`, error);
    
    // Show appropriate error message
    if (!options.suppressToast) {
      toast.error(`Lỗi WooCommerce API: ${error instanceof Error ? error.message : 'Không thể kết nối tới máy chủ'}`);
    }
    
    // For demonstration or development, use mock data
    if (endpoint.includes('/products') && options.method === 'GET') {
      console.info('Using mock product data');
      return mockWooCommerceData.products;
    }
    
    throw error;
  }
}
