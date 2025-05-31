
// Export all API hooks for backward compatibility
export * from './use-api-status';
export * from './use-products';
export * from './use-customers';
export * from './use-suppliers';
export * from './use-stock';
export * from './use-inventory';

// Export specific hooks from payment receipts to avoid conflicts
export { 
  useGetPaymentReceipts,
  useCreatePaymentReceipt,
  useUpdatePaymentReceipt,
  useDeletePaymentReceipt 
} from './use-payment-receipts';

// Export specific hooks from payments to avoid conflicts with payment-receipts
export { 
  useGetPaymentReceipts as useGetPaymentsAPI,
  useCreatePaymentReceipt as useCreatePaymentAPI,
  useGetPaymentReceipt
} from './use-payments';

// Export specific hooks from damaged stock to avoid conflicts  
export {
  useGetDamagedStock as useGetDamagedStockDB,
  useCreateDamagedStock as useCreateDamagedStockDB
} from './use-damaged-stock';
