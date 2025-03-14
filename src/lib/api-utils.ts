
import { toast } from 'sonner';

// WooCommerce API credentials
const WOO_API_URL = 'https://hmm.vn/wp-json/wc/v3';
const CONSUMER_KEY = 'ck_bb8635bb0fd810ceb013f1a01423e03a7ddf955a';
const CONSUMER_SECRET = 'cs_d2157fd9d4ef2ae3bcb1690ae4fd7c317c9f4460';

// WordPress API credentials
const WP_API_URL = 'https://hmm.vn/wp-json/wp/v2';
const WP_USERNAME = 'admin';
const APPLICATION_PASSWORD = 'w6fl K60U uSgH qrs4 F6gh LDBl';

// Custom API endpoint
const CUSTOM_API_URL = 'https://hmm.vn/wp-json/custom/v1';

// Interface for API options
interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  suppressToast?: boolean; // Add option to suppress toast notifications
}

/**
 * Fetch data from WooCommerce API
 */
export async function fetchWooCommerce(endpoint: string, options: ApiOptions = {}) {
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
      throw new Error(`API error: ${response.status} ${response.statusText} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('WooCommerce API error:', error);
    if (!options.suppressToast) {
      toast.error('Error fetching data from WooCommerce API');
    }
    throw error;
  }
}

/**
 * Fetch data from WordPress API
 */
export async function fetchWordPress(endpoint: string, options: ApiOptions = {}) {
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
      throw new Error(`API error: ${response.status} ${response.statusText} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('WordPress API error:', error);
    if (!options.suppressToast) {
      toast.error('Error fetching data from WordPress API');
    }
    throw error;
  }
}

/**
 * Fetch data from custom API
 */
export async function fetchCustomAPI(endpoint: string, options: ApiOptions = {}) {
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
      console.error(`Custom API response error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Custom API response data:`, data);
    return data;
  } catch (error) {
    console.error('Custom API error:', error);
    if (!options.suppressToast) {
      toast.error('Error fetching data from custom API');
    }
    throw error;
  }
}
