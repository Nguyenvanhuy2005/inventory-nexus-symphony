
import { useQuery } from "@tanstack/react-query";
import { fetchWooCommerce } from "@/lib/api";

/**
 * Hook to get all customers
 */
export function useGetCustomers(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: async () => {
      try {
        return await fetchWooCommerce('/customers', { 
          params: params || { per_page: '100' },
          suppressToast: true
        });
      } catch (error) {
        console.error('Error fetching customers:', error);
        return [];
      }
    },
    refetchOnWindowFocus: false
  });
}
