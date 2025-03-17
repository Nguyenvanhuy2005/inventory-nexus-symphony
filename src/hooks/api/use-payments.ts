
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PaymentReceipt } from "@/types/models";
import { fetchCustomAPI } from "@/lib/api";
import { mockPaymentReceipts } from "@/lib/mock-data-payment-receipts";

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
