
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { StockTransaction } from "@/types/models";
import { fetchCustomAPI } from "@/lib/api";

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
