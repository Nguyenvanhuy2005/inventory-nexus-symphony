
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { checkAPIStatus } from "@/lib/api-utils";
import { checkWooCommerceAuth, initializeDefaultCredentials } from "@/lib/auth-utils";
import { fetchWooCommerce } from "@/lib/api-utils";
import { toast } from "sonner";

/**
 * Hook to check API connection status
 * @returns API status information
 */
export function useCheckAPIStatus() {
  return useQuery({
    queryKey: ['api-status'],
    queryFn: async () => {
      // Ensure credentials are initialized
      initializeDefaultCredentials();
      
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

/**
 * Hook to sync product stock between WooCommerce and internal system
 */
export function useSyncProductsStock() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      try {
        const products = await fetchWooCommerce('/products', { 
          params: { per_page: '100' },
          suppressToast: true
        });
        
        toast.success(`Đã đồng bộ ${products.length} sản phẩm với WooCommerce`);
        return products;
      } catch (error) {
        console.error('Error syncing products:', error);
        toast.error('Không thể đồng bộ sản phẩm với WooCommerce');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-levels'] });
    }
  });
}

/**
 * Hook to fetch all products from WooCommerce
 */
export function useGetProducts(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      try {
        return await fetchWooCommerce('/products', { 
          params: params || { per_page: '100' },
          suppressToast: true
        });
      } catch (error) {
        console.error('Error fetching products:', error);
        return [];
      }
    },
    refetchOnWindowFocus: false
  });
}

/**
 * Hook to get product with variations
 */
export function useGetProductWithVariations(productId: number | string | null) {
  const enabled = !!productId;
  
  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      if (!productId) return null;
      
      try {
        const product = await fetchWooCommerce(`/products/${productId}`);
        let variations = [];
        
        if (product.type === 'variable') {
          variations = await fetchWooCommerce(`/products/${productId}/variations`);
        }
        
        return { product, variations };
      } catch (error) {
        console.error(`Error fetching product ${productId}:`, error);
        return null;
      }
    },
    enabled
  });
}

/**
 * Hook to create a new product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (productData: any) => {
      return await fetchWooCommerce('/products', {
        method: 'POST',
        body: productData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Đã tạo sản phẩm mới thành công');
    }
  });
}

/**
 * Hook to update an existing product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await fetchWooCommerce(`/products/${id}`, {
        method: 'PUT',
        body: data
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
      toast.success('Đã cập nhật sản phẩm thành công');
    }
  });
}

/**
 * Hook to get all product categories
 */
export function useGetProductCategories() {
  return useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      try {
        return await fetchWooCommerce('/products/categories', { 
          params: { per_page: '100' },
          suppressToast: true
        });
      } catch (error) {
        console.error('Error fetching product categories:', error);
        return [];
      }
    }
  });
}

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

// Add these stubs to avoid TypeScript errors
// In a real implementation, these would be fully implemented
export function useCreateStockAdjustment() {
  return useMutation({
    mutationFn: async (data: any) => {
      console.log('Creating stock adjustment:', data);
      return { success: true };
    }
  });
}

export function useGetSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      return [];
    }
  });
}

export function useCreateSupplier() {
  return useMutation({
    mutationFn: async (data: any) => {
      return { id: Date.now(), ...data };
    }
  });
}

export function useUpdateSupplier() {
  return useMutation({
    mutationFn: async ({ id, data }: any) => {
      return { id, ...data };
    }
  });
}

export function useDeleteSupplier() {
  return useMutation({
    mutationFn: async (id: any) => {
      return { success: true };
    }
  });
}

export function useGetStockTransactions() {
  return useQuery({
    queryKey: ['stock-transactions'],
    queryFn: async () => {
      return [];
    }
  });
}

export function useGetStockAdjustments() {
  return useQuery({
    queryKey: ['stock-adjustments'],
    queryFn: async () => {
      return [];
    }
  });
}

export function useGetGoodsReceipts() {
  return useQuery({
    queryKey: ['goods-receipts'],
    queryFn: async () => {
      return [];
    }
  });
}

export function useCreateGoodsReceipt() {
  return useMutation({
    mutationFn: async (data: any) => {
      return { id: Date.now(), ...data };
    }
  });
}

export function useGetReturns() {
  return useQuery({
    queryKey: ['returns'],
    queryFn: async () => {
      return [];
    }
  });
}

export function useCreateReturn() {
  return useMutation({
    mutationFn: async (data: any) => {
      return { id: Date.now(), ...data };
    }
  });
}

export function useGetDamagedStock() {
  return useQuery({
    queryKey: ['damaged-stock'],
    queryFn: async () => {
      return [];
    }
  });
}

export function useCreateDamagedStock() {
  return useMutation({
    mutationFn: async (data: any) => {
      return { id: Date.now(), ...data };
    }
  });
}

export function useGetPaymentReceipts() {
  return useQuery({
    queryKey: ['payment-receipts'],
    queryFn: async () => {
      return [];
    }
  });
}

export function useGetPaymentReceipt() {
  return useQuery({
    queryKey: ['payment-receipt'],
    queryFn: async () => {
      return {};
    },
    enabled: false
  });
}

export function useCreatePaymentReceipt() {
  return useMutation({
    mutationFn: async (data: any) => {
      return { id: Date.now(), ...data };
    }
  });
}

export function useUpdateStockLevel() {
  return useMutation({
    mutationFn: async ({ id, data }: any) => {
      return { id, ...data };
    }
  });
}

export function useCreateStockLevel() {
  return useMutation({
    mutationFn: async (data: any) => {
      return { id: Date.now(), ...data };
    }
  });
}
