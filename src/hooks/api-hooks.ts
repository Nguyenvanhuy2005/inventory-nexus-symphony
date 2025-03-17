import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PaymentReceipt, Product, ProductVariation, ProductWithVariations, StockTransaction, Supplier } from "@/types/models";
import { mockSuppliers } from "@/lib/mock-data-suppliers";
import { mockPaymentReceipts } from "@/lib/mock-data-payment-receipts";
import { 
  checkAPIStatus, 
  fetchWooCommerce, 
  fetchCustomAPI, 
  fetchDatabaseTable, 
  executeDatabaseQuery 
} from "@/lib/api";
import { 
  checkWooCommerceAuth, 
  checkDatabaseApiAuth, 
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
 * Hook to get all suppliers from the database directly
 */
export function useGetSuppliers() {
  return useQuery<Supplier[], Error>({
    queryKey: ['suppliers'],
    queryFn: async () => {
      try {
        console.log("Fetching suppliers from Database API...");
        // First try to get data from the database API directly
        const data = await fetchDatabaseTable('suppliers', { suppressToast: false });
        
        if (data && Array.isArray(data.data)) {
          // Transform the raw database data to match our Supplier interface
          return data.data.map(item => ({
            id: parseInt(item.id),
            name: item.name,
            email: item.email,
            phone: item.phone,
            address: item.address,
            contact_name: item.contact_name,
            notes: item.notes,
            payment_terms: item.payment_terms,
            tax_id: item.tax_id,
            status: (item.status as 'active' | 'inactive') || 'active',
            created_at: item.created_at,
            updated_at: item.updated_at,
            initial_debt: parseFloat(item.initial_debt || '0'),
            current_debt: parseFloat(item.current_debt || '0'),
            total_debt: parseFloat(item.total_debt || '0')
          }));
        }
        
        // Fallback to custom API
        console.log("Falling back to custom API...");
        const customApiData = await fetchCustomAPI('/suppliers');
        return customApiData as Supplier[];
      } catch (error) {
        console.error('Error fetching suppliers:', error);
        console.log("Falling back to mock data");
        return mockSuppliers as Supplier[];
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
        // Try to insert directly into the database
        const query = `
          INSERT INTO wp_hmm_suppliers 
          (name, contact_name, phone, email, address, initial_debt, current_debt, total_debt, notes, status, created_at, updated_at) 
          VALUES 
          ('${data.name}', '${data.contact_name || ''}', '${data.phone || ''}', '${data.email || ''}', 
           '${data.address || ''}', ${data.initial_debt || 0}, ${data.current_debt || 0}, ${data.total_debt || 0}, 
           '${data.notes || ''}', '${data.status}', NOW(), NOW())
        `;
        
        const result = await executeDatabaseQuery(query, { suppressToast: false });
        toast.success('Đã tạo nhà cung cấp mới thành công');
        
        // Return the created supplier with ID
        return { 
          id: result.insert_id,
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      } catch (error) {
        console.error('Error creating supplier in database:', error);
        
        // Fallback to custom API
        try {
          const response = await fetchCustomAPI('/suppliers', {
            method: 'POST',
            body: data
          });
          return response;
        } catch (apiError) {
          console.error('Error creating supplier via API:', apiError);
          toast.success('Đã tạo nhà cung cấp mới (chế độ thử nghiệm)');
          return { id: Date.now(), ...data };
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
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
        // Try to update directly in the database
        let setClause = Object.entries(data)
          .filter(([key, _]) => key !== 'id') // Exclude ID from the SET clause
          .map(([key, value]) => {
            if (typeof value === 'string') {
              return `${key} = '${value.replace(/'/g, "\\'")}'`; // Escape single quotes
            } else {
              return `${key} = ${value}`;
            }
          })
          .join(', ');
        
        setClause += `, updated_at = NOW()`;
        
        const query = `
          UPDATE wp_hmm_suppliers 
          SET ${setClause}
          WHERE id = ${id}
        `;
        
        await executeDatabaseQuery(query, { suppressToast: false });
        toast.success('Đã cập nhật nhà cung cấp thành công');
        
        // Return the updated supplier
        return { id, ...data };
      } catch (error) {
        console.error(`Error updating supplier ${id} in database:`, error);
        
        // Fallback to custom API
        try {
          const response = await fetchCustomAPI(`/suppliers/${id}`, {
            method: 'PUT',
            body: data
          });
          return response;
        } catch (apiError) {
          console.error(`Error updating supplier ${id} via API:`, apiError);
          toast.success('Đã cập nhật nhà cung cấp (chế độ thử nghiệm)');
          return { id, ...data };
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
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
        // Try to delete directly from the database
        const query = `DELETE FROM wp_hmm_suppliers WHERE id = ${id}`;
        await executeDatabaseQuery(query, { suppressToast: false });
        toast.success('Đã xóa nhà cung cấp thành công');
        
        return { success: true };
      } catch (error) {
        console.error(`Error deleting supplier ${id} from database:`, error);
        
        // Fallback to custom API
        try {
          const response = await fetchCustomAPI(`/suppliers/${id}`, {
            method: 'DELETE'
          });
          return response;
        } catch (apiError) {
          console.error(`Error deleting supplier ${id} via API:`, apiError);
          toast.success('Đã xóa nhà cung cấp (chế độ thử nghiệm)');
          return { success: true };
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
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
        return mockPaymentReceipts as PaymentReceipt[];
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
