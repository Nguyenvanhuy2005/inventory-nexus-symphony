
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Product, ProductVariation, ProductWithVariations } from "@/types/models";
import { fetchWooCommerce } from "@/lib/api";

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
