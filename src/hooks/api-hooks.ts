
import { useQuery } from "@tanstack/react-query";
import { checkAPIStatus } from "@/lib/api-utils";
import { checkWooCommerceAuth } from "@/lib/auth-utils";

/**
 * Hook to check API connection status
 * @returns API status information
 */
export function useCheckAPIStatus() {
  return useQuery({
    queryKey: ['api-status'],
    queryFn: async () => {
      const apiStatus = await checkAPIStatus();
      const woocommerceStatus = await checkWooCommerceAuth();
      
      return {
        ...apiStatus,
        woocommerce: {
          isConnected: woocommerceStatus,
          error: woocommerceStatus ? null : 'Không thể xác thực với WooCommerce API'
        }
      };
    },
    refetchOnWindowFocus: false,
    refetchInterval: false,
    retry: 1
  });
}
