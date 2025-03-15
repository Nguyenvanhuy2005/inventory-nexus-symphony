
import { fetchWooCommerce } from './api-utils';

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
