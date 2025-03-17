
import { useQuery } from "@tanstack/react-query";
import { 
  checkAPIStatus, 
  checkWooCommerceAuth, 
  checkDatabaseApiAuth, 
  initializeDefaultCredentials 
} from "@/lib/api";

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
      
      const apiStatus = await checkAPIStatus();
      const woocommerceStatus = await checkWooCommerceAuth();
      const databaseApiStatus = await checkDatabaseApiAuth();
      
      return {
        ...apiStatus,
        woocommerce: {
          isAuthenticated: woocommerceStatus,
          error: woocommerceStatus ? null : 'Không thể xác thực với WooCommerce API',
          hasCredentials: !!localStorage.getItem('woocommerce_consumer_key') && !!localStorage.getItem('woocommerce_consumer_secret')
        },
        databaseApi: {
          isAuthenticated: databaseApiStatus.isAuthenticated,
          error: databaseApiStatus.error
        },
        status: apiStatus.status || {
          wordpress: {
            connected: false,
            message: "Not checked"
          }
        }
      };
    },
    refetchOnWindowFocus: false,
    refetchInterval: false,
    retry: 1
  });
}
