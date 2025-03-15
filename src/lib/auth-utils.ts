
import { fetchWooCommerce } from './api-utils';

/**
 * Default WooCommerce credentials - These will be used if not overridden by localStorage
 */
export const DEFAULT_WOOCOMMERCE_CREDENTIALS = {
  consumer_key: 'ck_89c459799faea76b1eea95a3838b27172501f5a8',
  consumer_secret: 'cs_a9b30a11388a05da94b20c0c20539eace3b98645'
};

/**
 * Default WordPress credentials
 */
export const DEFAULT_WORDPRESS_CREDENTIALS = {
  username: 'lovable',
  application_password: 'wWpY NMDT jFqw eGyy dkZk KPZd'
};

/**
 * Checks if WooCommerce API credentials are valid
 */
export async function checkWooCommerceAuth(): Promise<boolean> {
  try {
    // Try to fetch a simple endpoint that requires authentication
    const result = await fetchWooCommerce('/system_status', {
      suppressToast: true
    });
    return !!result;
  } catch (error) {
    console.error('WooCommerce authentication failed:', error);
    return false;
  }
}

/**
 * Gets authentication status for various APIs
 */
export async function getAuthStatus() {
  // Set default credentials in localStorage if they don't exist
  if (!localStorage.getItem('woocommerce_consumer_key')) {
    localStorage.setItem('woocommerce_consumer_key', DEFAULT_WOOCOMMERCE_CREDENTIALS.consumer_key);
  }
  
  if (!localStorage.getItem('woocommerce_consumer_secret')) {
    localStorage.setItem('woocommerce_consumer_secret', DEFAULT_WOOCOMMERCE_CREDENTIALS.consumer_secret);
  }
  
  // Check authentication with the credentials
  const wooCommerceAuth = await checkWooCommerceAuth();
  
  return {
    woocommerce: {
      isAuthenticated: wooCommerceAuth,
      hasCredentials: !!(
        (localStorage.getItem('woocommerce_consumer_key') && 
         localStorage.getItem('woocommerce_consumer_secret')) ||
        (import.meta.env.VITE_WOOCOMMERCE_CONSUMER_KEY && 
         import.meta.env.VITE_WOOCOMMERCE_CONSUMER_SECRET)
      )
    }
  };
}

/**
 * Initialize default API credentials
 */
export function initializeDefaultCredentials() {
  // Initialize WooCommerce credentials
  if (!localStorage.getItem('woocommerce_consumer_key')) {
    localStorage.setItem('woocommerce_consumer_key', DEFAULT_WOOCOMMERCE_CREDENTIALS.consumer_key);
  }
  
  if (!localStorage.getItem('woocommerce_consumer_secret')) {
    localStorage.setItem('woocommerce_consumer_secret', DEFAULT_WOOCOMMERCE_CREDENTIALS.consumer_secret);
  }
  
  // You can also initialize WordPress credentials here if needed
  console.log('Default API credentials initialized');
}
