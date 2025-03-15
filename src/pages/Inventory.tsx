
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, ArrowUpDown, ExternalLink, RefreshCw, PlusCircle } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Product } from "@/types/models";
import { toast } from "sonner";
import { fetchWooCommerce, fetchCustomAPI, fetchStockLevels, syncProductsWithStockLevels } from "@/lib/api-utils";
import { Link } from "react-router-dom";

// Format currency
const formatCurrency = (value: string | undefined) => {
  if (!value) return "0 ₫";
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0
  }).format(Number(value));
};

export default function Inventory() {
  // Use useQuery to fetch products from WooCommerce
  const { data: products, isLoading: isLoadingProducts, refetch: refetchProducts, error: productsError } = useQuery({
    queryKey: ['woocommerce-products'],
    queryFn: async () => {
      try {
        // Fetch products with proper pagination, sorting, etc.
        const response = await fetchWooCommerce('/products', {
          params: { 
            per_page: '100',
            status: 'publish'
          }
        });
        console.log("WooCommerce products fetched:", response);
        return response as Product[];
      } catch (error) {
        console.error("Error fetching WooCommerce products:", error);
        toast.error("Không thể lấy dữ liệu sản phẩm từ WooCommerce");
        throw error;
      }
    },
    retry: 1
  });
  
  // Use useQuery to fetch stock levels from custom API
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
  
  const [tab, setTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Combine products with stock levels
  const productsWithStock = syncProductsWithStockLevels(products, stockLevels);
  
  // Filter products based on tab and search term
  const filteredProducts = productsWithStock?.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
      
    if (tab === "all") return matchesSearch;
    if (tab === "instock") return product.stock_status === "instock" && matchesSearch;
    if (tab === "outofstock") return product.stock_status === "outofstock" && matchesSearch;
    if (tab === "lowstock") {
      return product.stock_status === "instock" && 
        ((product.real_stock !== undefined && product.real_stock <= 5) || 
         (product.available_to_sell !== undefined && product.available_to_sell <= 5)) && 
        matchesSearch;
    }
    return matchesSearch;
  });
  
  const isLoading = isLoadingProducts || isLoadingStockLevels;
  const hasError = !!productsError || !!stockLevelsError;

  // Function to refresh data
  const refreshData = async () => {
    toast.info("Đang tải lại dữ liệu...");
    try {
      await Promise.all([refetchProducts(), refetchStockLevels()]);
      toast.success("Dữ liệu đã được tải lại thành công");
    } catch (error) {
      toast.error("Không thể tải lại dữ liệu");
    }
  };

  // Show detailed explanation of data
  const showDataSourceInfo = () => {
    toast.info(
      <div className="space-y-2">
        <p className="font-medium">Nguồn dữ liệu tồn kho:</p>
        <ul className="list-disc pl-5 text-sm">
          <li><strong>Tồn kho thực tế:</strong> Lấy từ bảng <code>hmm_stock_levels</code> trong trường <code>ton_thuc_te</code>. Nếu không có, sẽ dùng <code>stock_quantity</code> từ WooCommerce.</li>
          <li><strong>Đơn đang xử lý:</strong> Số lượng sản phẩm trong đơn hàng có trạng thái "đang xử lý", "tạm giữ", "chờ thanh toán". Lấy từ trường <code>meta_data</code> với key <code>pending_orders</code>.</li>
          <li><strong>Có thể bán:</strong> Lấy từ bảng <code>hmm_stock_levels</code> trong trường <code>co_the_ban</code>. Nếu không có, sẽ tính bằng công thức: <code>Tồn kho thực tế - Đơn đang xử lý</code>.</li>
        </ul>
      </div>
    );
  };
  
  // Generate stock status badge
  const getStockStatusBadge = (product: Product & { real_stock?: number, available_to_sell?: number, pending_orders?: number }) => {
    if (product.stock_status === "outofstock") {
      return <Badge variant="outline" className="border-red-500 text-red-500">Hết hàng</Badge>;
    }
    if (product.available_to_sell !== undefined && product.available_to_sell <= 5) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Sắp hết</Badge>;
    }
    return <Badge variant="outline" className="border-green-500 text-green-500">Còn hàng</Badge>;
  };

  // Get WooCommerce product URL
  const getWooProductUrl = (productId: number) => {
    return `https://hmm.vn/wp-admin/post.php?post=${productId}&action=edit`;
  };

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Quản lý kho" 
        description="Xem và quản lý tồn kho sản phẩm"
      />
      
      <Card>
        <div className="p-4">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
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
                Thông tin dữ liệu
              </Button>
            </div>
            <div className="flex justify-end space-x-2">
              <Link to="/inventory/add-product">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Thêm sản phẩm mới
                </Button>
              </Link>
              <Button variant="outline" onClick={() => window.open("https://hmm.vn/wp-admin/post-new.php?post_type=product")}>
                <ExternalLink className="mr-2 h-4 w-4" />
                WooCommerce
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
              <ProductsTable 
                products={filteredProducts} 
                isLoading={isLoading}
                hasError={hasError}
                getStockStatusBadge={getStockStatusBadge}
                getWooProductUrl={getWooProductUrl}
              />
            </TabsContent>
            <TabsContent value="instock" className="mt-4">
              <ProductsTable 
                products={filteredProducts} 
                isLoading={isLoading}
                hasError={hasError}
                getStockStatusBadge={getStockStatusBadge}
                getWooProductUrl={getWooProductUrl}
              />
            </TabsContent>
            <TabsContent value="lowstock" className="mt-4">
              <ProductsTable 
                products={filteredProducts} 
                isLoading={isLoading}
                hasError={hasError}
                getStockStatusBadge={getStockStatusBadge}
                getWooProductUrl={getWooProductUrl}
              />
            </TabsContent>
            <TabsContent value="outofstock" className="mt-4">
              <ProductsTable 
                products={filteredProducts} 
                isLoading={isLoading}
                hasError={hasError}
                getStockStatusBadge={getStockStatusBadge}
                getWooProductUrl={getWooProductUrl}
              />
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
}

interface ProductsTableProps {
  products: (Product & { real_stock?: number, available_to_sell?: number, pending_orders?: number })[] | undefined;
  isLoading: boolean;
  hasError: boolean;
  getStockStatusBadge: (product: Product & { real_stock?: number, available_to_sell?: number, pending_orders?: number }) => JSX.Element;
  getWooProductUrl: (productId: number) => string;
}

function ProductsTable({ products, isLoading, hasError, getStockStatusBadge, getWooProductUrl }: ProductsTableProps) {
  if (hasError) {
    return (
      <div className="py-12 text-center">
        <div className="text-xl font-semibold text-red-500 mb-4">Lỗi kết nối API</div>
        <p className="text-muted-foreground mb-6">Không thể kết nối đến API WooCommerce hoặc API tùy chỉnh.</p>
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
              Tồn kho thực
              <ArrowUpDown className="ml-1 h-4 w-4" />
            </div>
          </TableHead>
          <TableHead>
            <div className="flex items-center">
              Đơn đang xử lý
              <ArrowUpDown className="ml-1 h-4 w-4" />
            </div>
          </TableHead>
          <TableHead>
            <div className="flex items-center">
              Có thể bán
              <ArrowUpDown className="ml-1 h-4 w-4" />
            </div>
          </TableHead>
          <TableHead>Giá</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead className="text-right">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center">
              <div className="flex items-center justify-center py-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            </TableCell>
          </TableRow>
        ) : products?.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center">
              Không tìm thấy sản phẩm nào
            </TableCell>
          </TableRow>
        ) : (
          products?.map((product) => (
            <TableRow key={product.id} className="group hover:bg-muted/50">
              <TableCell className="font-medium">{product.sku || "-"}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {product.images?.[0] && (
                    <img 
                      src={product.images[0].src} 
                      alt={product.name} 
                      className="h-8 w-8 rounded object-cover" 
                    />
                  )}
                  <span>{product.name}</span>
                </div>
              </TableCell>
              <TableCell>{product.real_stock !== undefined ? product.real_stock : product.stock_quantity || 0}</TableCell>
              <TableCell>{product.pending_orders || 0}</TableCell>
              <TableCell>{product.available_to_sell !== undefined ? product.available_to_sell : product.stock_quantity || 0}</TableCell>
              <TableCell>{formatCurrency(product.price)}</TableCell>
              <TableCell>{getStockStatusBadge(product)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Link to={`/inventory/product/${product.id}`}>
                    <Button variant="ghost" size="sm">
                      Sửa
                    </Button>
                  </Link>
                  <a href={getWooProductUrl(product.id)} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
