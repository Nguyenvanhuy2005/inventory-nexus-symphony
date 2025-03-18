
import { useQuery } from "@tanstack/react-query";
import { checkDatabaseApiAuth } from "@/lib/api/custom-api";
import { 
  checkWooCommerceAuth, 
  initializeDefaultCredentials 
} from "@/lib/auth-utils";

/**
 * Hook to check API connection status
 * @returns API status information
 */
export function useCheckAPIStatus() {
  return useQuery<any, Error>({
    queryKey: ['api-status'],
    queryFn: async () => {
      // Ensure credentials are initialized
      initializeDefaultCredentials();
      
      // Get WooCommerce authentication status
      console.log('Checking WooCommerce API authentication...');
      const woocommerceStatus = await checkWooCommerceAuth();
      
      // Get Database API authentication status
      console.log('Checking Database API authentication...');
      const databaseApiStatus = await checkDatabaseApiAuth();
      
      // Determine WordPress connection status from Database API result
      // If Database API is connected, WordPress must be connected too
      const wpConnected = databaseApiStatus.isAuthenticated;
      
      console.log('API status check complete:', {
        woocommerce: woocommerceStatus,
        databaseApi: databaseApiStatus.isAuthenticated,
        wordpress: wpConnected
      });
      
      return {
        woocommerce: {
          isAuthenticated: woocommerceStatus,
          error: woocommerceStatus ? null : 'Không thể xác thực với WooCommerce API',
          hasCredentials: !!localStorage.getItem('woocommerce_consumer_key') && !!localStorage.getItem('woocommerce_consumer_secret')
        },
        databaseApi: {
          isAuthenticated: databaseApiStatus.isAuthenticated,
          error: databaseApiStatus.error,
          version: databaseApiStatus.version,
          tables: databaseApiStatus.tables || []
        },
        status: {
          wordpress: {
            connected: wpConnected,
            message: wpConnected ? 'Connected' : databaseApiStatus.error || 'Failed to connect'
          }
        }
      };
    },
    refetchOnWindowFocus: false,
    refetchInterval: false,
    retry: 1
  });
}
