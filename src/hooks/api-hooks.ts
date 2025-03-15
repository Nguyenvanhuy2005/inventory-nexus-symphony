import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { checkAPIStatus } from "@/lib/api-utils";
import { checkWooCommerceAuth, initializeDefaultCredentials } from "@/lib/auth-utils";
import { fetchWooCommerce, fetchCustomAPI } from "@/lib/api-utils";
import { toast } from "sonner";
import { PaymentReceipt, Product, ProductVariation, StockTransaction, Supplier } from "@/types/models";

// Define types for the return values of our query hooks
type ApiStatus = {
  isConnected: boolean;
  version?: string;
  error?: string | null;
  status?: string;
  woocommerce: {
    isConnected: boolean;
    error: string | null;
  }
};

type ProductWithVariations = {
  product: Product | null;
  variations: ProductVariation[];
};

/**
 * Hook to check API connection status
 * @returns API status information
 */
export function useCheckAPIStatus() {
  return useQuery<ApiStatus, Error>({
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
      } as ApiStatus;
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
  return useQuery<Product[], Error>({
    queryKey: ['products', params],
    queryFn: async () => {
      try {
        return await fetchWooCommerce('/products', { 
          params: params || { per_page: '100' },
          suppressToast: true
        }) as Product[];
      } catch (error) {
        console.error('Error fetching products:', error);
        return [] as Product[];
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
  
  return useQuery<ProductWithVariations, Error>({
    queryKey: ['product', productId],
    queryFn: async () => {
      if (!productId) return { product: null, variations: [] };
      
      try {
        const product = await fetchWooCommerce(`/products/${productId}`);
        let variations: ProductVariation[] = [];
        
        if (product.type === 'variable') {
          variations = await fetchWooCommerce(`/products/${productId}/variations`);
        }
        
        return { product, variations };
      } catch (error) {
        console.error(`Error fetching product ${productId}:`, error);
        return { product: null, variations: [] };
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
    mutationFn: async (params: { id: number, data: any }) => {
      return await fetchWooCommerce(`/products/${params.id}`, {
        method: 'PUT',
        body: params.data
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

/**
 * Hook to get payment receipt by ID
 */
export function useGetPaymentReceipt(receiptId?: number) {
  const enabled = !!receiptId && receiptId > 0;
  
  return useQuery<PaymentReceipt, Error>({
    queryKey: ['payment-receipt', receiptId],
    queryFn: async () => {
      if (!enabled) return {} as PaymentReceipt;
      
      try {
        const data = await fetchCustomAPI(`/payment-receipts/${receiptId}`);
        return data as PaymentReceipt;
      } catch (error) {
        console.error(`Error fetching payment receipt ${receiptId}:`, error);
        return {} as PaymentReceipt;
      }
    },
    enabled
  });
}

/**
 * Hook to get stock transactions with pagination
 */
export function useGetStockTransactions(params: Record<string, string> = {}) {
  return useQuery<{ transactions: StockTransaction[], total_pages: number }, Error>({
    queryKey: ['stock-transactions', params],
    queryFn: async () => {
      try {
        const response = await fetchCustomAPI('/stock-transactions', { params });
        return response as { transactions: StockTransaction[], total_pages: number };
      } catch (error) {
        console.error('Error fetching stock transactions:', error);
        return { transactions: [], total_pages: 0 };
      }
    }
  });
}

/**
 * Hook to create a new stock adjustment
 */
export function useCreateStockAdjustment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      try {
        const response = await fetchCustomAPI('/stock-adjustments', {
          method: 'POST',
          body: data
        });
        return response;
      } catch (error) {
        console.error('Error creating stock adjustment:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockAdjustments'] });
      queryClient.invalidateQueries({ queryKey: ['stock-transactions'] });
      toast.success('Đã tạo điều chỉnh tồn kho thành công');
    }
  });
}

/**
 * Hook to get all suppliers
 */
export function useGetSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      try {
        const data = await fetchCustomAPI('/suppliers');
        return data as Supplier[];
      } catch (error) {
        console.error('Error fetching suppliers:', error);
        return [];
      }
    }
  });
}

/**
 * Hook to create a new supplier
 */
export function useCreateSupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      try {
        const response = await fetchCustomAPI('/suppliers', {
          method: 'POST',
          body: data
        });
        return response;
      } catch (error) {
        console.error('Error creating supplier:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Đã tạo nhà cung cấp mới thành công');
    }
  });
}

/**
 * Hook to update an existing supplier
 */
export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      try {
        const response = await fetchCustomAPI(`/suppliers/${id}`, {
          method: 'PUT',
          body: data
        });
        return response;
      } catch (error) {
        console.error(`Error updating supplier ${id}:`, error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Đã cập nhật nhà cung cấp thành công');
    }
  });
}

/**
 * Hook to delete a supplier
 */
export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      try {
        const response = await fetchCustomAPI(`/suppliers/${id}`, {
          method: 'DELETE'
        });
        return response;
      } catch (error) {
        console.error(`Error deleting supplier ${id}:`, error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Đã xóa nhà cung cấp thành công');
    }
  });
}

/**
 * Hook to get all stock adjustments
 */
export function useGetStockAdjustments() {
  return useQuery({
    queryKey: ['stock-adjustments'],
    queryFn: async () => {
      try {
        const data = await fetchCustomAPI('/stock-adjustments');
        return data;
      } catch (error) {
        console.error('Error fetching stock adjustments:', error);
        return [];
      }
    }
  });
}

/**
 * Hook to get all goods receipts
 */
export function useGetGoodsReceipts() {
  return useQuery({
    queryKey: ['goods-receipts'],
    queryFn: async () => {
      try {
        const data = await fetchCustomAPI('/goods-receipts');
        return data;
      } catch (error) {
        console.error('Error fetching goods receipts:', error);
        return [];
      }
    }
  });
}

/**
 * Hook to create a new goods receipt
 */
export function useCreateGoodsReceipt() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      try {
        const response = await fetchCustomAPI('/goods-receipts', {
          method: 'POST',
          body: data
        });
        return response;
      } catch (error) {
        console.error('Error creating goods receipt:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goods-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['stock-transactions'] });
      toast.success('Đã tạo phiếu nhập hàng thành công');
    }
  });
}

/**
 * Hook to get all returns
 */
export function useGetReturns() {
  return useQuery({
    queryKey: ['returns'],
    queryFn: async () => {
      try {
        const data = await fetchCustomAPI('/returns');
        return data;
      } catch (error) {
        console.error('Error fetching returns:', error);
        return [];
      }
    }
  });
}

/**
 * Hook to create a new return
 */
export function useCreateReturn() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      try {
        const response = await fetchCustomAPI('/returns', {
          method: 'POST',
          body: data
        });
        return response;
      } catch (error) {
        console.error('Error creating return:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['stock-transactions'] });
      toast.success('Đã tạo phiếu trả hàng thành công');
    }
  });
}

/**
 * Hook to get all damaged stock
 */
export function useGetDamagedStock() {
  return useQuery({
    queryKey: ['damaged-stock'],
    queryFn: async () => {
      try {
        const data = await fetchCustomAPI('/damaged-stock');
        return data;
      } catch (error) {
        console.error('Error fetching damaged stock:', error);
        return [];
      }
    }
  });
}

/**
 * Hook to create a new damaged stock report
 */
export function useCreateDamagedStock() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      try {
        const response = await fetchCustomAPI('/damaged-stock', {
          method: 'POST',
          body: data
        });
        return response;
      } catch (error) {
        console.error('Error creating damaged stock report:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damaged-stock'] });
      queryClient.invalidateQueries({ queryKey: ['stock-transactions'] });
      toast.success('Đã tạo báo cáo hàng hỏng thành công');
    }
  });
}

/**
 * Hook to get all payment receipts
 */
export function useGetPaymentReceipts() {
  return useQuery<PaymentReceipt[], Error>({
    queryKey: ['payment-receipts'],
    queryFn: async () => {
      try {
        const data = await fetchCustomAPI('/payment-receipts');
        return data as PaymentReceipt[];
      } catch (error) {
        console.error('Error fetching payment receipts:', error);
        return [];
      }
    }
  });
}

/**
 * Hook to create a new payment receipt
 */
export function useCreatePaymentReceipt() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      try {
        const response = await fetchCustomAPI('/payment-receipts', {
          method: 'POST',
          body: data
        });
        return response;
      } catch (error) {
        console.error('Error creating payment receipt:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-receipts'] });
      toast.success('Đã tạo phiếu thu chi thành công');
    }
  });
}

/**
 * Hook to update a stock level
 */
export function useUpdateStockLevel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      try {
        const response = await fetchCustomAPI('/stock-levels', {
          method: 'PUT',
          body: data
        });
        return response;
      } catch (error) {
        console.error('Error updating stock level:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-levels'] });
      toast.success('Đã cập nhật tồn kho thành công');
    }
  });
}

/**
 * Hook to create a new stock level
 */
export function useCreateStockLevel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      try {
        const response = await fetchCustomAPI('/stock-levels', {
          method: 'POST',
          body: data
        });
        return response;
      } catch (error) {
        console.error('Error creating stock level:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-levels'] });
      toast.success('Đã tạo tồn kho thành công');
    }
  });
}
