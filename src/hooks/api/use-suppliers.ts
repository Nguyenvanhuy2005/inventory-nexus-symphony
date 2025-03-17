
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Supplier } from "@/types/models";
import { fetchDatabaseTable, fetchCustomAPI, insertDatabaseRecord, updateDatabaseRecord, deleteDatabaseRecord } from "@/lib/api";
import { mockSuppliers } from "@/lib/mock-data-suppliers";

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
        // Try to insert using the Custom API database endpoint
        const result = await insertDatabaseRecord('suppliers', {
          name: data.name,
          contact_name: data.contact_name || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          initial_debt: data.initial_debt || 0,
          current_debt: data.current_debt || 0,
          total_debt: data.total_debt || 0,
          notes: data.notes || '',
          status: data.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
        toast.success('Đã tạo nhà cung cấp mới thành công');
        
        // Return the created supplier with ID
        return { 
          id: result.insert_id || Date.now(),
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
        // Try to update using the Custom API database endpoint
        const updateData = {
          ...data,
          updated_at: new Date().toISOString()
        };
        
        await updateDatabaseRecord('suppliers', id, updateData);
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
        // Try to delete using the Custom API database endpoint
        await deleteDatabaseRecord('suppliers', id);
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
