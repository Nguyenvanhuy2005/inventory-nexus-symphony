
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, ArrowUpDown, RefreshCw, Info, Edit, Plus, RotateCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { fetchCustomAPI, fetchStockLevels, fetchWooCommerce, mockWooCommerceData } from "@/lib/api-utils";
import { useSyncProductsStock } from "@/hooks/api-hooks";

export default function StockManagement() {
  const navigate = useNavigate();
  
  // Fetch stock levels from custom API
  const { data: stockLevels, isLoading: isLoadingStockLevels, refetch: refetchStockLevels, error: stockLevelsError } = useQuery({
    queryKey: ['custom-stock-levels'],
    queryFn: async () => {
      try {
        const response = await fetchStockLevels();
        console.log("Stock levels fetched:", response);
        return response;
      } catch (error) {
        console.error("Error fetching stock levels:", error);
        toast.error("Không thể lấy dữ liệu tồn kho từ hệ thống");
        return [];
      }
    },
    retry: 1
  });

  // Fetch related products from WooCommerce for product names and images
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['wc-products-basic'],
    queryFn: async () => {
      try {
        const response = await fetchWooCommerce('/products', {
          params: { 
            per_page: '100',
            status: 'publish',
            _fields: 'id,name,sku,images' // Request minimal fields
          }
        });
        console.log("Product basics fetched:", response);
        return response;
      } catch (error) {
        console.error("Error fetching product basics:", error);
        return mockWooCommerceData.products;
      }
    },
    retry: 1
  });
  
  const syncStockMutation = useSyncProductsStock();
  
  const [tab, setTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Combine stock levels with product information
  const stockItems = stockLevels?.map(stockItem => {
    const product = products?.find(p => p.id === stockItem.product_id);
    return {
      ...stockItem,
      product_name: product?.name || `Sản phẩm #${stockItem.product_id}`,
      product_sku: product?.sku || '',
      product_image: product?.images?.[0]?.src
    };
  });
  
  // Filter stock items based on tab and search term
  const filteredStockItems = stockItems?.filter(item => {
    const matchesSearch = 
      item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_sku.toLowerCase().includes(searchTerm.toLowerCase());
      
    if (tab === "all") return matchesSearch;
    if (tab === "instock") return item.ton_thuc_te > 0 && matchesSearch;
    if (tab === "lowstock") return item.ton_thuc_te <= 5 && item.ton_thuc_te > 0 && matchesSearch;
    if (tab === "outofstock") return item.ton_thuc_te <= 0 && matchesSearch;
    return matchesSearch;
  });
  
  const isLoading = isLoadingStockLevels || isLoadingProducts;
  const hasError = !!stockLevelsError;

  // Function to refresh data
  const refreshData = async () => {
    toast.info("Đang tải lại dữ liệu tồn kho...");
    try {
      await refetchStockLevels();
      toast.success("Dữ liệu tồn kho đã được tải lại thành công");
    } catch (error) {
      toast.error("Không thể tải lại dữ liệu tồn kho");
    }
  };

  // Show detailed explanation of data
  const showDataSourceInfo = () => {
    toast.info(
      <div className="space-y-2">
        <p className="font-medium">Nguồn dữ liệu tồn kho:</p>
        <ul className="list-disc pl-5 text-sm">
          <li><strong>Tồn kho thực tế:</strong> Số lượng thực tế đang có trong kho. Độc lập với tồn kho hiển thị trên website.</li>
          <li><strong>Có thể bán:</strong> Số lượng có thể bán dựa trên tồn kho thực tế trừ đi các đơn đang xử lý.</li>
          <li><strong>Tồn kho web:</strong> Tồn kho hiển thị trên website (WooCommerce). Có thể khác với tồn kho thực tế.</li>
          <li><strong>Đồng bộ:</strong> Đồng bộ tồn kho giữa hệ thống quản lý và website.</li>
        </ul>
      </div>
    );
  };
  
  // Navigate to stock adjustment page
  const handleCreateStockAdjustment = () => {
    navigate('/stock-management/adjustments/new');
  };
  
  // Sync stock with WooCommerce
  const handleSyncStock = () => {
    if (!stockItems || stockItems.length === 0) {
      toast.error("Không có dữ liệu tồn kho để đồng bộ");
      return;
    }
    
    toast.info("Đang đồng bộ tồn kho với website...");
    const productsToSync = stockItems.map(item => ({ product_id: item.product_id }));
    
    syncStockMutation.mutate(productsToSync, {
      onSuccess: () => {
        refetchStockLevels();
      }
    });
  };

  // Generate stock status badge
  const getStockStatusBadge = (quantity: number) => {
    if (quantity <= 0) {
      return <Badge variant="outline" className="border-red-500 text-red-500">Hết hàng</Badge>;
    }
    if (quantity <= 5) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Sắp hết</Badge>;
    }
    return <Badge variant="outline" className="border-green-500 text-green-500">Còn hàng</Badge>;
  };

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Quản lý kho hàng" 
        description="Quản lý tồn kho thực tế, xuất nhập kho và đồng bộ với website"
      />
      
      <Card>
        <div className="p-4">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Tìm sản phẩm..."
                  className="pl-8 w-full md:w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={refreshData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={showDataSourceInfo}>
                <Info className="mr-2 h-4 w-4" />
                Thông tin dữ liệu
              </Button>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleCreateStockAdjustment}>
                <Plus className="mr-2 h-4 w-4" />
                Điều chỉnh tồn kho
              </Button>
              <Button variant="outline" onClick={handleSyncStock} disabled={syncStockMutation.isPending}>
                {syncStockMutation.isPending ? (
                  <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RotateCw className="mr-2 h-4 w-4" />
                )}
                Đồng bộ với website
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue="all" className="mt-4" value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all">Tất cả</TabsTrigger>
              <TabsTrigger value="instock">Còn hàng</TabsTrigger>
              <TabsTrigger value="lowstock">Sắp hết</TabsTrigger>
              <TabsTrigger value="outofstock">Hết hàng</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              <StockTable 
                stockItems={filteredStockItems} 
                isLoading={isLoading}
                hasError={hasError}
                getStockStatusBadge={getStockStatusBadge}
              />
            </TabsContent>
            <TabsContent value="instock" className="mt-4">
              <StockTable 
                stockItems={filteredStockItems} 
                isLoading={isLoading}
                hasError={hasError}
                getStockStatusBadge={getStockStatusBadge}
              />
            </TabsContent>
            <TabsContent value="lowstock" className="mt-4">
              <StockTable 
                stockItems={filteredStockItems} 
                isLoading={isLoading}
                hasError={hasError}
                getStockStatusBadge={getStockStatusBadge}
              />
            </TabsContent>
            <TabsContent value="outofstock" className="mt-4">
              <StockTable 
                stockItems={filteredStockItems} 
                isLoading={isLoading}
                hasError={hasError}
                getStockStatusBadge={getStockStatusBadge}
              />
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
}

interface StockTableProps {
  stockItems: any[] | undefined;
  isLoading: boolean;
  hasError: boolean;
  getStockStatusBadge: (quantity: number) => JSX.Element;
}

function StockTable({ stockItems, isLoading, hasError, getStockStatusBadge }: StockTableProps) {
  if (hasError) {
    return (
      <div className="py-12 text-center">
        <div className="text-xl font-semibold text-red-500 mb-4">Lỗi kết nối API</div>
        <p className="text-muted-foreground mb-6">Không thể kết nối đến API tùy chỉnh.</p>
        <p className="text-muted-foreground mb-6">Vui lòng kiểm tra kết nối mạng hoặc cấu hình API.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Mã</TableHead>
          <TableHead>Sản phẩm</TableHead>
          <TableHead>
            <div className="flex items-center">
              Tồn kho thực tế
              <ArrowUpDown className="ml-1 h-4 w-4" />
            </div>
          </TableHead>
          <TableHead>
            <div className="flex items-center">
              Có thể bán
              <ArrowUpDown className="ml-1 h-4 w-4" />
            </div>
          </TableHead>
          <TableHead>
            <div className="flex items-center">
              Tồn kho web
              <ArrowUpDown className="ml-1 h-4 w-4" />
            </div>
          </TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead>Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center">
              <div className="flex items-center justify-center py-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            </TableCell>
          </TableRow>
        ) : stockItems?.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center">
              Không tìm thấy dữ liệu tồn kho nào
            </TableCell>
          </TableRow>
        ) : (
          stockItems?.map((item) => (
            <TableRow key={item.product_id} className="group hover:bg-muted/50">
              <TableCell className="font-medium">{item.product_sku || "-"}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {item.product_image && (
                    <img 
                      src={item.product_image} 
                      alt={item.product_name} 
                      className="h-8 w-8 rounded object-cover" 
                    />
                  )}
                  <span>{item.product_name}</span>
                </div>
              </TableCell>
              <TableCell>{item.ton_thuc_te}</TableCell>
              <TableCell>{item.co_the_ban}</TableCell>
              <TableCell>{item.ton_website || 0}</TableCell>
              <TableCell>{getStockStatusBadge(item.ton_thuc_te)}</TableCell>
              <TableCell>
                <Button 
                  variant="ghost" 
                  size="icon"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
