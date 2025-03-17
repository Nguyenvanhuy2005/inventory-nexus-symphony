
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchCustomAPI } from "@/lib/api";

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
