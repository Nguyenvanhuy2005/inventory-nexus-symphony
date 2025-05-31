
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchDatabaseTable, insertDatabaseRecord, updateDatabaseRecord, deleteDatabaseRecord } from "@/lib/api/database-api";
import { toast } from "sonner";
import { PaymentReceipt } from "@/types/models";

/**
 * Hook to get payment receipts
 */
export function useGetPaymentReceipts() {
  return useQuery<PaymentReceipt[], Error>({
    queryKey: ['payment-receipts'],
    queryFn: async () => {
      console.log('Fetching payment receipts...');
      const result = await fetchDatabaseTable('payment_receipts');
      return result.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to create new payment receipt
 */
export function useCreatePaymentReceipt() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (paymentReceipt: Omit<PaymentReceipt, 'id' | 'receipt_id' | 'created_at' | 'updated_at'>) => {
      console.log('Creating payment receipt:', paymentReceipt);
      
      // Generate receipt ID
      const receipt_id = `PR-${Date.now()}`;
      
      const newPaymentReceipt = {
        ...paymentReceipt,
        receipt_id,
        created_by: 'Admin', // TODO: Get from auth context
        status: 'completed'
      };
      
      const result = await insertDatabaseRecord('payment_receipts', newPaymentReceipt);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-receipts'] });
      toast.success('Đã tạo phiếu thu chi thành công');
    },
    onError: (error) => {
      console.error('Error creating payment receipt:', error);
      toast.error('Lỗi khi tạo phiếu thu chi');
    }
  });
}

/**
 * Hook to update payment receipt
 */
export function useUpdatePaymentReceipt() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<PaymentReceipt> }) => {
      console.log('Updating payment receipt:', id, data);
      const result = await updateDatabaseRecord('payment_receipts', id, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-receipts'] });
      toast.success('Đã cập nhật phiếu thu chi thành công');
    },
    onError: (error) => {
      console.error('Error updating payment receipt:', error);
      toast.error('Lỗi khi cập nhật phiếu thu chi');
    }
  });
}

/**
 * Hook to delete payment receipt
 */
export function useDeletePaymentReceipt() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      console.log('Deleting payment receipt:', id);
      const result = await deleteDatabaseRecord('payment_receipts', id);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-receipts'] });
      toast.success('Đã xóa phiếu thu chi thành công');
    },
    onError: (error) => {
      console.error('Error deleting payment receipt:', error);
      toast.error('Lỗi khi xóa phiếu thu chi');
    }
  });
}
