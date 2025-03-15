
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
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

export default App;
