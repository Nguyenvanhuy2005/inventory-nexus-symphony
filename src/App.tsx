
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import StockManagement from "./pages/StockManagement";
import Sales from "./pages/Sales";
import Customers from "./pages/Customers";
import Suppliers from "./pages/Suppliers";
import GoodsReceipt from "./pages/GoodsReceipt";
import Returns from "./pages/Returns";
import PaymentReceipts from "./pages/PaymentReceipts";
import DamagedStock from "./pages/DamagedStock";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import ProductDetail from "./pages/ProductDetail";
import StockAdjustments from "./pages/StockAdjustments";
import { useEffect } from "react";
import { toast } from "sonner";
import { getAuthStatus } from "./lib/auth-utils";

// Create a new QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => {
  // Check authentication status on app start
  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = await getAuthStatus();
      
      if (!authStatus.woocommerce.hasCredentials) {
        toast.warning(
          "Thông tin xác thực WooCommerce chưa được thiết lập. Vui lòng thiết lập trong phần Cài đặt.", 
          {
            duration: 8000,
            action: {
              label: "Đi tới Cài đặt",
              onClick: () => window.location.href = "/settings",
            },
          }
        );
      } else if (!authStatus.woocommerce.isAuthenticated) {
        toast.error(
          "Xác thực WooCommerce thất bại. Vui lòng kiểm tra lại thông tin xác thực trong phần Cài đặt.",
          {
            duration: 8000,
            action: {
              label: "Đi tới Cài đặt",
              onClick: () => window.location.href = "/settings",
            },
          }
        );
      }
    };
    
    // Run check after a short delay to allow the app to load
    const timer = setTimeout(checkAuth, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/product/:id" element={<ProductDetail />} />
              <Route path="/stock-management" element={<StockManagement />} />
              <Route path="/stock-management/adjustments/new" element={<StockAdjustments />} />
              <Route path="/stock-adjustments/new" element={<Navigate to="/stock-management/adjustments/new" replace />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/goods-receipt" element={<GoodsReceipt />} />
              <Route path="/returns" element={<Returns />} />
              <Route path="/payment-receipts" element={<PaymentReceipts />} />
              <Route path="/damaged-stock" element={<DamagedStock />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
