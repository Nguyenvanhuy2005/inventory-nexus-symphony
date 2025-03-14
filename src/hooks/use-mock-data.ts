
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  mockProducts,
  mockVariations,
  mockOrders,
  mockCustomers,
  mockSuppliers,
  mockPaymentReceipts,
  mockRecentActivities,
  mockSalesData,
  mockInventoryByCategoryData
} from "@/lib/mock-data";
import { fetchWooCommerce, fetchCustomAPI } from "@/lib/api-utils";
import { normalizeProduct } from "@/lib/woocommerce";

interface UseMockDataOptions<T> {
  queryKey: string[];
  apiFn: () => Promise<T>;
  mockData: T;
  mockDataId?: number;
  errorMessage?: string;
}

/**
 * Hook to use real API data but fall back to mock data when API fails
 */
export function useMockData<T>({
  queryKey,
  apiFn,
  mockData,
  mockDataId,
  errorMessage = "API connection failed. Using sample data."
}: UseMockDataOptions<T>) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      try {
        // Try to get data from API
        const data = await apiFn();
        return data;
      } catch (error) {
        // Log error and show toast
        console.error(`Error fetching ${queryKey[0]}:`, error);
        toast.error(errorMessage);
        
        // Return mock data
        if (mockDataId && Array.isArray(mockData)) {
          // If mockDataId is provided and mockData is an array, find the item by ID
          const item = mockData.find((item: any) => item.id === mockDataId);
          return item || mockData;
        }
        
        return mockData;
      }
    }
  });
}

/**
 * Hook to get products with fallback to mock data
 */
export function useGetProducts() {
  return useMockData({
    queryKey: ['products'],
    apiFn: async () => {
      const products = await fetchWooCommerce('/products?per_page=50');
      return products.map(normalizeProduct);
    },
    mockData: mockProducts
  });
}

/**
 * Hook to get a single product with fallback to mock data
 */
export function useGetProduct(productId: number) {
  return useMockData({
    queryKey: ['product', productId.toString()],
    apiFn: async () => {
      const product = await fetchWooCommerce(`/products/${productId}`);
      return normalizeProduct(product);
    },
    mockData: mockProducts,
    mockDataId: productId
  });
}

/**
 * Hook to get product variations with fallback to mock data
 */
export function useGetProductVariations(productId: number) {
  return useMockData({
    queryKey: ['productVariations', productId.toString()],
    apiFn: async () => {
      const variations = await fetchWooCommerce(`/products/${productId}/variations`);
      return variations.map(normalizeProduct);
    },
    mockData: mockVariations[productId] || []
  });
}

/**
 * Hook to get orders with fallback to mock data
 */
export function useGetOrders() {
  return useMockData({
    queryKey: ['orders'],
    apiFn: async () => {
      return await fetchWooCommerce('/orders?per_page=50');
    },
    mockData: mockOrders
  });
}

/**
 * Hook to get customers with fallback to mock data
 */
export function useGetCustomers() {
  return useMockData({
    queryKey: ['customers'],
    apiFn: async () => {
      return await fetchWooCommerce('/customers?per_page=50');
    },
    mockData: mockCustomers
  });
}

/**
 * Hook to get suppliers with fallback to mock data
 */
export function useGetSuppliers() {
  return useMockData({
    queryKey: ['suppliers'],
    apiFn: async () => {
      return await fetchCustomAPI('/suppliers');
    },
    mockData: mockSuppliers
  });
}

/**
 * Hook to get payment receipts with fallback to mock data
 */
export function useGetPaymentReceipts() {
  return useMockData({
    queryKey: ['paymentReceipts'],
    apiFn: async () => {
      return await fetchCustomAPI('/payment-receipts');
    },
    mockData: mockPaymentReceipts
  });
}

/**
 * Hook to get recent activities for dashboard
 */
export function useGetRecentActivities() {
  return useMockData({
    queryKey: ['recentActivities'],
    apiFn: async () => {
      // This would typically be a custom endpoint that aggregates recent activities
      // For now, we'll just return mock data
      return mockRecentActivities;
    },
    mockData: mockRecentActivities
  });
}

/**
 * Hook to get sales data for dashboard charts
 */
export function useGetSalesData() {
  return useMockData({
    queryKey: ['salesData'],
    apiFn: async () => {
      // This would typically be a reports endpoint
      // For now, we'll just return mock data
      return mockSalesData;
    },
    mockData: mockSalesData
  });
}

/**
 * Hook to get inventory by category data for dashboard charts
 */
export function useGetInventoryByCategoryData() {
  return useMockData({
    queryKey: ['inventoryByCategoryData'],
    apiFn: async () => {
      // This would typically be a reports endpoint
      // For now, we'll just return mock data
      return mockInventoryByCategoryData;
    },
    mockData: mockInventoryByCategoryData
  });
}
