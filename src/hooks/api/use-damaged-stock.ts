
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchDatabaseTable, insertDatabaseRecord } from "@/lib/api/database-api";
import { toast } from "sonner";
import { DamagedStock } from "@/types/models";

/**
 * Hook to get damaged stock reports
 */
export function useGetDamagedStock() {
  return useQuery<DamagedStock[], Error>({
    queryKey: ['damaged-stock'],
    queryFn: async () => {
      console.log('Fetching damaged stock data...');
      const result = await fetchDatabaseTable('damaged_stock');
      return result.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to create new damaged stock report
 */
export function useCreateDamagedStock() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (damagedStock: Omit<DamagedStock, 'id' | 'damage_id' | 'created_at'>) => {
      console.log('Creating damaged stock report:', damagedStock);
      
      // Generate damage ID
      const damage_id = `DMG-${Date.now()}`;
      
      const newDamagedStock = {
        ...damagedStock,
        damage_id,
        created_by: 'Admin', // TODO: Get from auth context
        status: 'reported'
      };
      
      const result = await insertDatabaseRecord('damaged_stock', newDamagedStock);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damaged-stock'] });
      toast.success('Đã tạo báo cáo hàng hỏng thành công');
    },
    onError: (error) => {
      console.error('Error creating damaged stock:', error);
      toast.error('Lỗi khi tạo báo cáo hàng hỏng');
    }
  });
}
