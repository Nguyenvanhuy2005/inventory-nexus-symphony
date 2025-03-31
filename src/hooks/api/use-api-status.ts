
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

/**
 * Helper function to reset API connection and clear cache
 */
export function resetApiConnection(newDomain?: string) {
  const queryClient = useQueryClient();
  
  // Update domain if provided
  if (newDomain) {
    localStorage.setItem('api_url', `https://${newDomain}/wp-json`);
    localStorage.setItem('woocommerce_api_url', `https://${newDomain}/wp-json/wc/v3`);
  }
  
  // Clear API-related cache
  queryClient.invalidateQueries({ queryKey: ['api-status'] });
  queryClient.invalidateQueries({ queryKey: ['customers'] });
  queryClient.invalidateQueries({ queryKey: ['products'] });
  queryClient.invalidateQueries({ queryKey: ['orders'] });
  queryClient.invalidateQueries({ queryKey: ['suppliers'] });
  
  console.log('API connection reset:', {
    api_url: localStorage.getItem('api_url'),
    woocommerce_api_url: localStorage.getItem('woocommerce_api_url')
  });
  
  return true;
}
