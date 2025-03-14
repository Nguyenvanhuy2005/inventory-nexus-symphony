
import { toast } from 'sonner';

// WooCommerce API credentials
let WOO_API_URL = 'https://hmm.vn/wp-json/wc/v3';
let CONSUMER_KEY = 'ck_bb8635bb0fd810ceb013f1a01423e03a7ddf955a';
let CONSUMER_SECRET = 'cs_d2157fd9d4ef2ae3bcb1690ae4fd7c317c9f4460';

// WordPress API credentials
let WP_API_URL = 'https://hmm.vn/wp-json/wp/v2';
let WP_USERNAME = 'admin';
let APPLICATION_PASSWORD = 'w6fl K60U uSgH qrs4 F6gh LDBl';

// Custom API endpoint
let CUSTOM_API_URL = 'https://hmm.vn/wp-json/custom/v1';

// Thử lấy cấu hình từ localStorage nếu có
try {
  const savedSettings = localStorage.getItem('api_settings');
  if (savedSettings) {
    const settings = JSON.parse(savedSettings);
    if (settings.woocommerce_url) WOO_API_URL = settings.woocommerce_url;
    if (settings.consumer_key) CONSUMER_KEY = settings.consumer_key;
    if (settings.consumer_secret) CONSUMER_SECRET = settings.consumer_secret;
    if (settings.wp_username) WP_USERNAME = settings.wp_username;
    if (settings.application_password) APPLICATION_PASSWORD = settings.application_password;
    
    // Cập nhật URL API tùy chỉnh dựa trên domain của WooCommerce
    if (settings.woocommerce_url) {
      const domainMatch = settings.woocommerce_url.match(/(https?:\/\/[^\/]+)/);
      if (domainMatch && domainMatch[1]) {
        CUSTOM_API_URL = `${domainMatch[1]}/wp-json/custom/v1`;
      }
    }
  }
} catch (error) {
  console.error('Error loading API settings from localStorage:', error);
}

// Interface for API options
interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  suppressToast?: boolean; // Add option to suppress toast notifications
  retryCount?: number; // Số lần thử lại khi có lỗi
}

/**
 * Fetch data from WooCommerce API
 */
export async function fetchWooCommerce(endpoint: string, options: ApiOptions = {}) {
  const retryCount = options.retryCount || 0;
  
  try {
    const url = `${WOO_API_URL}${endpoint}`;
    const params = new URLSearchParams();
    params.append('consumer_key', CONSUMER_KEY);
    params.append('consumer_secret', CONSUMER_SECRET);

    const requestUrl = `${url}${url.includes('?') ? '&' : '?'}${params.toString()}`;
    
    console.log(`Fetching WooCommerce API: ${endpoint}`);
    
    const response = await fetch(requestUrl, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(`WooCommerce API error (${response.status}): ${errorText}`);
      throw new Error(`API error: ${response.status} ${response.statusText} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('WooCommerce API error:', error);
    
    // Nếu vẫn còn lần thử lại và không phải lỗi 404
    if (retryCount < 2 && !error.message?.includes('404')) {
      console.log(`Retrying WooCommerce API request (${retryCount + 1}/2)...`);
      return fetchWooCommerce(endpoint, { ...options, retryCount: retryCount + 1 });
    }
    
    if (!options.suppressToast) {
      toast.error('Lỗi khi tải dữ liệu từ WooCommerce API');
    }
    throw error;
  }
}

/**
 * Fetch data from WordPress API
 */
export async function fetchWordPress(endpoint: string, options: ApiOptions = {}) {
  const retryCount = options.retryCount || 0;
  
  try {
    const url = `${WP_API_URL}${endpoint}`;
    const credentials = btoa(`${WP_USERNAME}:${APPLICATION_PASSWORD}`);
    
    console.log(`Fetching WordPress API: ${endpoint}`);
    
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(`WordPress API error (${response.status}): ${errorText}`);
      throw new Error(`API error: ${response.status} ${response.statusText} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('WordPress API error:', error);
    
    // Nếu vẫn còn lần thử lại và không phải lỗi 404
    if (retryCount < 2 && !error.message?.includes('404')) {
      console.log(`Retrying WordPress API request (${retryCount + 1}/2)...`);
      return fetchWordPress(endpoint, { ...options, retryCount: retryCount + 1 });
    }
    
    if (!options.suppressToast) {
      toast.error('Lỗi khi tải dữ liệu từ WordPress API');
    }
    throw error;
  }
}

/**
 * Fetch data from custom API
 */
export async function fetchCustomAPI(endpoint: string, options: ApiOptions = {}) {
  const retryCount = options.retryCount || 0;
  
  try {
    const url = `${CUSTOM_API_URL}${endpoint}`;
    const credentials = btoa(`${WP_USERNAME}:${APPLICATION_PASSWORD}`);
    
    console.log(`Fetching Custom API: ${endpoint}`);
    
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    // Log the raw response for debugging
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(`Custom API response error: ${response.status}`, errorText);
      
      // Nếu là lỗi 404 Not Found, có thể REST API route chưa được đăng ký
      if (response.status === 404) {
        throw new Error('API endpoint không tồn tại. Vui lòng cài đặt plugin HMM Custom API.');
      }
      
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Custom API response data:`, data);
    return data;
  } catch (error) {
    console.error('Custom API error:', error);
    
    // Nếu vẫn còn lần thử lại và không phải lỗi 404 (vì 404 là lỗi route không tồn tại)
    if (retryCount < 2 && !error.message?.includes('404')) {
      console.log(`Retrying Custom API request (${retryCount + 1}/2)...`);
      return fetchCustomAPI(endpoint, { ...options, retryCount: retryCount + 1 });
    }
    
    if (!options.suppressToast) {
      if (error.message?.includes('plugin')) {
        toast.error('API chưa sẵn sàng. Vui lòng cài đặt plugin HMM Custom API.');
      } else {
        toast.error('Lỗi khi tải dữ liệu từ API tùy chỉnh');
      }
    }
    throw error;
  }
}

/**
 * Kiểm tra trạng thái API
 */
export async function checkAPIStatus() {
  try {
    const result = await fetchCustomAPI('/status', { suppressToast: true });
    return {
      isConnected: true,
      status: result
    };
  } catch (error) {
    console.error('API Status check failed:', error);
    return {
      isConnected: false,
      error: error.message
    };
  }
}
