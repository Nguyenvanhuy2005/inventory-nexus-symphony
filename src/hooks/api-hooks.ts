
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchCustomAPI } from "@/lib/api-utils";
import {
  Supplier,
  PaymentReceipt,
  GoodsReceipt,
  Return,
  DamagedStock,
  StockAdjustment,
  CustomerDebt
} from "@/types/models";

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
      toast.error('Không thể tạo nhà cung cấp');
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
      toast.error('Không thể cập nhật nhà cung cấp');
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
      toast.error('Không thể xóa nhà cung cấp');
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
    mutationFn: async (paymentReceipt: Omit<PaymentReceipt, 'id' | 'created_at' | 'updated_at'>) => {
      return await fetchCustomAPI('/payment-receipts', {
        method: 'POST',
        body: paymentReceipt
      }) as PaymentReceipt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentReceipts'] });
      // Invalidate related entity data
      if (paymentReceipt.entity === 'customer') {
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        queryClient.invalidateQueries({ queryKey: ['customer', paymentReceipt.entity_id.toString()] });
      } else if (paymentReceipt.entity === 'supplier') {
        queryClient.invalidateQueries({ queryKey: ['suppliers'] });
        queryClient.invalidateQueries({ queryKey: ['supplier', paymentReceipt.entity_id.toString()] });
      }
      toast.success('Phiếu thu chi đã được tạo thành công');
    },
    onError: (error) => {
      console.error('Error creating payment receipt:', error);
      toast.error('Không thể tạo phiếu thu chi');
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
      toast.success('Phiếu nhập hàng đã được tạo thành công');
    },
    onError: (error) => {
      console.error('Error creating goods receipt:', error);
      toast.error('Không thể tạo phiếu nhập hàng');
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
    mutationFn: async (returnData: Omit<Return, 'id' | 'created_at' | 'updated_at'>) => {
      return await fetchCustomAPI('/returns', {
        method: 'POST',
        body: returnData
      }) as Return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if (returnData.type === 'customer') {
        queryClient.invalidateQueries({ queryKey: ['customers'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      }
      toast.success('Phiếu trả hàng đã được tạo thành công');
    },
    onError: (error) => {
      console.error('Error creating return:', error);
      toast.error('Không thể tạo phiếu trả hàng');
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
      toast.success('Báo cáo hàng hỏng đã được tạo thành công');
    },
    onError: (error) => {
      console.error('Error creating damaged stock record:', error);
      toast.error('Không thể tạo báo cáo hàng hỏng');
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
      toast.success('Điều chỉnh tồn kho đã được tạo thành công');
    },
    onError: (error) => {
      console.error('Error creating stock adjustment:', error);
      toast.error('Không thể tạo điều chỉnh tồn kho');
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
