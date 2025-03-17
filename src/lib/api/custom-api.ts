
import { toast } from "sonner";
import { API_BASE_URL } from "./base-api";
import { DEFAULT_WORDPRESS_CREDENTIALS } from "../auth-utils";
import { mockWooCommerceData } from "./mock-data";

/**
 * Fetches data from the custom API
 * @param endpoint API endpoint
 * @param options Fetch options
 * @returns Promise with response data
 */
export async function fetchCustomAPI(endpoint: string, options: any = {}) {
  try {
    // Get authentication credentials from localStorage or defaults
    const username = localStorage.getItem('wordpress_username') || DEFAULT_WORDPRESS_CREDENTIALS.username;
    const password = localStorage.getItem('wordpress_application_password') || DEFAULT_WORDPRESS_CREDENTIALS.application_password;
    
    // Prepare authentication headers
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    };
    
    // Add Basic Auth for all API calls (including Database API)
    const authToken = btoa(`${username}:${password}`);
    headers['Authorization'] = `Basic ${authToken}`;
    
    const fetchOptions = {
      method: options.method || 'GET',
      headers: headers,
      ...options
    };

    // If there's a body, stringify it
    if (options.body && typeof options.body === 'object') {
      fetchOptions.body = JSON.stringify(options.body);
    }

    // Check if this is a Database API call (starts with /hmm/v1)
    const isDatabaseApiCall = endpoint.startsWith('/hmm/v1');
    
    // For Database API calls, use the direct endpoint without the 'custom/v1' prefix
    const url = isDatabaseApiCall 
      ? `${API_BASE_URL}${endpoint}`
      : `${API_BASE_URL}/custom/v1${endpoint}`;
      
    console.info(`Fetching ${isDatabaseApiCall ? 'Database' : 'Custom'} API: ${endpoint}`, {
      url,
      method: fetchOptions.method,
      hasAuth: !!authToken,
      username: username
    });
    
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API request failed (${response.status}):`, errorText);
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.info(`${isDatabaseApiCall ? 'Database' : 'Custom'} API response data:`, data);
    return data;
  } catch (error) {
    console.error(`Error fetching from ${endpoint.startsWith('/hmm/v1') ? 'Database' : 'Custom'} API (${endpoint}):`, error);
    // Don't show toast for GET requests to avoid flooding the UI
    if (!options.suppressToast && options.method && options.method !== 'GET') {
      toast.error(`Lỗi API: ${error instanceof Error ? error.message : 'Không thể kết nối tới máy chủ'}`);
    }
    
    // Mock data for development
    if (endpoint === '/stock-transactions' && options.method === 'GET') {
      return {
        transactions: mockWooCommerceData.stockTransactions,
        total: mockWooCommerceData.stockTransactions.length,
        page: 1,
        per_page: 100,
        total_pages: 1
      };
    }
    
    throw error;
  }
}

/**
 * Check Database API connection and authentication
 * @returns Promise with auth status
 */
export async function checkDatabaseApiAuth() {
  try {
    const result = await fetchCustomAPI('/hmm/v1/status', { suppressToast: true });
    return {
      isAuthenticated: true,
      error: null,
      version: result.version,
      tables: result.custom_tables || []
    };
  } catch (error) {
    console.error('Database API authentication check failed:', error);
    
    let errorMessage = 'Không thể kết nối tới Database API';
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        errorMessage = 'Lỗi xác thực: Thông tin đăng nhập không hợp lệ';
      } else if (error.message.includes('404')) {
        errorMessage = 'Lỗi 404: Plugin HMM Database API có thể chưa được kích hoạt';
      }
    }
    
    return {
      isAuthenticated: false,
      error: errorMessage,
      version: null,
      tables: []
    };
  }
}

/**
 * Fetch stock levels from the custom API
 * @returns Promise with stock levels data
 */
export async function fetchStockLevels() {
  try {
    return await fetchCustomAPI('/stock-levels');
  } catch (error) {
    console.error('Error fetching stock levels:', error);
    return [];
  }
}
