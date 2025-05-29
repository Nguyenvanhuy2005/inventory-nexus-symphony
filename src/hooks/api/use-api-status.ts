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
      
      // Get HMM Core API authentication status (previously Database API)
      console.log('Checking HMM Core API authentication...');
      const coreApiStatus = await checkDatabaseApiAuth();
      
      // Determine WordPress connection status from Core API result
      // If Core API is connected, WordPress must be connected too
      const wpConnected = coreApiStatus.isAuthenticated;
      
      console.log('API status check complete:', {
        woocommerce: woocommerceStatus,
        coreApi: coreApiStatus.isAuthenticated,
        wordpress: wpConnected
      });
      
      return {
        woocommerce: {
          isAuthenticated: woocommerceStatus.isAuthenticated,
          error: woocommerceStatus.isAuthenticated ? null : 'Không thể xác thực với WooCommerce API',
          hasCredentials: !!localStorage.getItem('woocommerce_consumer_key') && !!localStorage.getItem('woocommerce_consumer_secret')
        },
        databaseApi: {
          // We're keeping this property name for backward compatibility
          isAuthenticated: coreApiStatus.isAuthenticated,
          error: coreApiStatus.error,
          version: coreApiStatus.version,
          tables: coreApiStatus.tables || []
        },
        coreApi: {
          // New property specifically for HMM Core API
          isAuthenticated: coreApiStatus.isAuthenticated,
          error: coreApiStatus.error,
          version: coreApiStatus.version,
          tables: coreApiStatus.tables || []
        },
        status: {
          wordpress: {
            connected: wpConnected,
            message: wpConnected ? 'Connected' : coreApiStatus.error || 'Failed to connect'
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
