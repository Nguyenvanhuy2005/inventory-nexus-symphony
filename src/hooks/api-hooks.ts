
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchCustomAPI, checkAPIStatus, fetchWooCommerce } from "@/lib/api-utils";
import {
  Supplier,
  PaymentReceipt,
  GoodsReceipt,
  Return,
  DamagedStock,
  StockAdjustment,
  CustomerDebt,
  StockLevel,
  PurchaseOrder,
  StockEntry,
  Product,
  ProductVariation
} from "@/types/models";

// --- API Status ---
export function useCheckAPIStatus() {
  return useQuery({
    queryKey: ['apiStatus'],
    queryFn: async () => {
      return await checkAPIStatus();
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false
  });
}

// --- Suppliers ---
export function useGetSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      return await fetchCustomAPI('/suppliers') as Supplier[];
    }
  });
}

export function useGetSupplier(id: number) {
  return useQuery({
    queryKey: ['supplier', id.toString()],
    queryFn: async () => {
      return await fetchCustomAPI(`/suppliers/${id}`) as Supplier;
    },
    enabled: !!id
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => {
      return await fetchCustomAPI('/suppliers', {
        method: 'POST',
        body: supplier
      }) as Supplier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Nhà cung cấp đã được tạo thành công');
    },
    onError: (error) => {
      console.error('Error creating supplier:', error);
      toast.error('Không thể tạo nhà cung cấp: ' + (error instanceof Error ? error.message : ''));
    }
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Supplier> & { id: number }) => {
      return await fetchCustomAPI(`/suppliers/${id}`, {
        method: 'PUT',
        body: data
      }) as Supplier;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', variables.id.toString()] });
      toast.success('Nhà cung cấp đã được cập nhật thành công');
    },
    onError: (error) => {
      console.error('Error updating supplier:', error);
      toast.error('Không thể cập nhật nhà cung cấp: ' + (error instanceof Error ? error.message : ''));
    }
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      return await fetchCustomAPI(`/suppliers/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Nhà cung cấp đã được xóa thành công');
    },
    onError: (error) => {
      console.error('Error deleting supplier:', error);
      toast.error('Không thể xóa nhà cung cấp: ' + (error instanceof Error ? error.message : ''));
    }
  });
}

// --- Payment Receipts ---
export function useGetPaymentReceipts() {
  return useQuery({
    queryKey: ['paymentReceipts'],
    queryFn: async () => {
      return await fetchCustomAPI('/payment-receipts') as PaymentReceipt[];
    }
  });
}

export function useGetPaymentReceipt(id: number) {
  return useQuery({
    queryKey: ['paymentReceipt', id.toString()],
    queryFn: async () => {
      return await fetchCustomAPI(`/payment-receipts/${id}`) as PaymentReceipt;
    },
    enabled: !!id
  });
}

export function useCreatePaymentReceipt() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (paymentReceiptData: Omit<PaymentReceipt, 'id' | 'created_at' | 'updated_at'>) => {
      return await fetchCustomAPI('/payment-receipts', {
        method: 'POST',
        body: paymentReceiptData
      }) as PaymentReceipt;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['paymentReceipts'] });
      // Invalidate related entity data
      if (variables.entity === 'customer') {
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        queryClient.invalidateQueries({ queryKey: ['customer', variables.entity_id.toString()] });
      } else if (variables.entity === 'supplier') {
        queryClient.invalidateQueries({ queryKey: ['suppliers'] });
        queryClient.invalidateQueries({ queryKey: ['supplier', variables.entity_id.toString()] });
      }
      toast.success('Phiếu thu chi đã được tạo thành công');
    },
    onError: (error) => {
      console.error('Error creating payment receipt:', error);
      toast.error('Không thể tạo phiếu thu chi: ' + (error instanceof Error ? error.message : ''));
    }
  });
}

// --- Goods Receipts ---
export function useGetGoodsReceipts() {
  return useQuery({
    queryKey: ['goodsReceipts'],
    queryFn: async () => {
      return await fetchCustomAPI('/goods-receipts') as GoodsReceipt[];
    }
  });
}

export function useGetGoodsReceipt(id: number) {
  return useQuery({
    queryKey: ['goodsReceipt', id.toString()],
    queryFn: async () => {
      return await fetchCustomAPI(`/goods-receipts/${id}`) as GoodsReceipt;
    },
    enabled: !!id
  });
}

export function useCreateGoodsReceipt() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (goodsReceipt: Omit<GoodsReceipt, 'id' | 'created_at' | 'updated_at'>) => {
      return await fetchCustomAPI('/goods-receipts', {
        method: 'POST',
        body: goodsReceipt
      }) as GoodsReceipt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goodsReceipts'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stockLevels'] });
      toast.success('Phiếu nhập hàng đã được tạo thành công');
    },
    onError: (error) => {
      console.error('Error creating goods receipt:', error);
      toast.error('Không thể tạo phiếu nhập hàng: ' + (error instanceof Error ? error.message : ''));
    }
  });
}

// --- Returns ---
export function useGetReturns() {
  return useQuery({
    queryKey: ['returns'],
    queryFn: async () => {
      return await fetchCustomAPI('/returns') as Return[];
    }
  });
}

export function useGetReturn(id: number) {
  return useQuery({
    queryKey: ['return', id.toString()],
    queryFn: async () => {
      return await fetchCustomAPI(`/returns/${id}`) as Return;
    },
    enabled: !!id
  });
}

export function useCreateReturn() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (returnFormData: Omit<Return, 'id' | 'created_at' | 'updated_at'>) => {
      return await fetchCustomAPI('/returns', {
        method: 'POST',
        body: returnFormData
      }) as Return;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stockLevels'] });
      if (variables.type === 'customer') {
        queryClient.invalidateQueries({ queryKey: ['customers'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      }
      toast.success('Phiếu trả hàng đã được tạo thành công');
    },
    onError: (error) => {
      console.error('Error creating return:', error);
      toast.error('Không thể tạo phiếu trả hàng: ' + (error instanceof Error ? error.message : ''));
    }
  });
}

// --- Damaged Stock ---
export function useGetDamagedStock() {
  return useQuery({
    queryKey: ['damagedStock'],
    queryFn: async () => {
      return await fetchCustomAPI('/damaged-stock') as DamagedStock[];
    }
  });
}

export function useCreateDamagedStock() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (damagedStock: Omit<DamagedStock, 'id' | 'created_at'>) => {
      return await fetchCustomAPI('/damaged-stock', {
        method: 'POST',
        body: damagedStock
      }) as DamagedStock;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damagedStock'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stockLevels'] });
      toast.success('Báo cáo hàng hỏng đã được tạo thành công');
    },
    onError: (error) => {
      console.error('Error creating damaged stock record:', error);
      toast.error('Không thể tạo báo cáo hàng hỏng: ' + (error instanceof Error ? error.message : ''));
    }
  });
}

// --- Stock Adjustments ---
export function useGetStockAdjustments() {
  return useQuery({
    queryKey: ['stockAdjustments'],
    queryFn: async () => {
      return await fetchCustomAPI('/stock-adjustments') as StockAdjustment[];
    }
  });
}

export function useCreateStockAdjustment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (stockAdjustment: Omit<StockAdjustment, 'id'>) => {
      return await fetchCustomAPI('/stock-adjustments', {
        method: 'POST',
        body: stockAdjustment
      }) as StockAdjustment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockAdjustments'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stockLevels'] });
      toast.success('Điều chỉnh tồn kho đã được tạo thành công');
    },
    onError: (error) => {
      console.error('Error creating stock adjustment:', error);
      toast.error('Không thể tạo điều chỉnh tồn kho: ' + (error instanceof Error ? error.message : ''));
    }
  });
}

// --- Stock Levels ---
export function useGetStockLevels() {
  return useQuery({
    queryKey: ['stockLevels'],
    queryFn: async () => {
      return await fetchCustomAPI('/stock-levels') as StockLevel[];
    }
  });
}

export function useGetStockLevel(productId: number) {
  return useQuery({
    queryKey: ['stockLevel', productId.toString()],
    queryFn: async () => {
      return await fetchCustomAPI(`/stock-levels/${productId}`) as StockLevel;
    },
    enabled: !!productId
  });
}

export function useUpdateStockLevel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (stockLevel: StockLevel) => {
      return await fetchCustomAPI(`/stock-levels/${stockLevel.product_id}`, {
        method: 'PUT',
        body: stockLevel
      }) as StockLevel;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stockLevels'] });
      queryClient.invalidateQueries({ queryKey: ['stockLevel', variables.product_id.toString()] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Tồn kho đã được cập nhật thành công');
    },
    onError: (error) => {
      console.error('Error updating stock level:', error);
      toast.error('Không thể cập nhật tồn kho: ' + (error instanceof Error ? error.message : ''));
    }
  });
}

export function useCreateStockLevel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (stockLevel: StockLevel) => {
      return await fetchCustomAPI(`/stock-levels`, {
        method: 'POST',
        body: stockLevel
      }) as StockLevel;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stockLevels'] });
      queryClient.invalidateQueries({ queryKey: ['stockLevel', variables.product_id.toString()] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Tồn kho đã được tạo thành công');
    },
    onError: (error) => {
      console.error('Error creating stock level:', error);
      toast.error('Không thể tạo tồn kho: ' + (error instanceof Error ? error.message : ''));
    }
  });
}

// --- Customer Debts ---
export function useGetCustomerDebts() {
  return useQuery({
    queryKey: ['customerDebts'],
    queryFn: async () => {
      return await fetchCustomAPI('/customer-debts') as CustomerDebt[];
    }
  });
}

export function useGetCustomerDebt(customerId: number) {
  return useQuery({
    queryKey: ['customerDebt', customerId.toString()],
    queryFn: async () => {
      return await fetchCustomAPI(`/customer-debts?customer_id=${customerId}`) as CustomerDebt;
    },
    enabled: !!customerId
  });
}

// New hooks for Product management
export function useGetProductWithVariations(productId: number) {
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', productId.toString()],
    queryFn: async () => {
      return await fetchWooCommerce(`/products/${productId}`) as Product;
    },
    enabled: !!productId
  });

  const { data: variations, isLoading: isLoadingVariations } = useQuery({
    queryKey: ['variations', productId.toString()],
    queryFn: async () => {
      return await fetchWooCommerce(`/products/${productId}/variations`) as ProductVariation[];
    },
    enabled: !!productId
  });

  const { data: stockLevel } = useGetStockLevel(productId);

  return {
    product: product ? {
      ...product,
      real_stock: stockLevel?.ton_thuc_te || product.stock_quantity,
      available_to_sell: stockLevel?.co_the_ban || product.stock_quantity
    } : undefined,
    variations,
    isLoading: isLoading || isLoadingVariations,
    error
  };
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (productData: Partial<Product>) => {
      return await fetchWooCommerce('/products', {
        method: 'POST',
        body: productData
      }) as Product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Sản phẩm đã được tạo thành công');
    },
    onError: (error) => {
      console.error('Error creating product:', error);
      toast.error('Không thể tạo sản phẩm: ' + (error instanceof Error ? error.message : ''));
    }
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Product> & { id: number }) => {
      return await fetchWooCommerce(`/products/${id}`, {
        method: 'PUT',
        body: data
      }) as Product;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id.toString()] });
      toast.success('Sản phẩm đã được cập nhật thành công');
    },
    onError: (error) => {
      console.error('Error updating product:', error);
      toast.error('Không thể cập nhật sản phẩm: ' + (error instanceof Error ? error.message : ''));
    }
  });
}

export function useCreateProductVariation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ productId, data }: { productId: number, data: Partial<ProductVariation> }) => {
      return await fetchWooCommerce(`/products/${productId}/variations`, {
        method: 'POST',
        body: data
      }) as ProductVariation;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['variations', variables.productId.toString()] });
      toast.success('Biến thể sản phẩm đã được tạo thành công');
    },
    onError: (error) => {
      console.error('Error creating product variation:', error);
      toast.error('Không thể tạo biến thể sản phẩm: ' + (error instanceof Error ? error.message : ''));
    }
  });
}

export function useUpdateProductVariation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ productId, variationId, data }: { productId: number, variationId: number, data: Partial<ProductVariation> }) => {
      return await fetchWooCommerce(`/products/${productId}/variations/${variationId}`, {
        method: 'PUT',
        body: data
      }) as ProductVariation;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['variations', variables.productId.toString()] });
      toast.success('Biến thể sản phẩm đã được cập nhật thành công');
    },
    onError: (error) => {
      console.error('Error updating product variation:', error);
      toast.error('Không thể cập nhật biến thể sản phẩm: ' + (error instanceof Error ? error.message : ''));
    }
  });
}

export function useGetProductCategories() {
  return useQuery({
    queryKey: ['productCategories'],
    queryFn: async () => {
      return await fetchWooCommerce('/products/categories?per_page=100') as Array<{id: number, name: string}>;
    }
  });
}

export function useGetProductAttributes() {
  return useQuery({
    queryKey: ['productAttributes'],
    queryFn: async () => {
      return await fetchWooCommerce('/products/attributes?per_page=100') as Array<{id: number, name: string, slug: string}>;
    }
  });
}
