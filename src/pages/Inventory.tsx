
import { useState } from "react";
import { useGetProducts } from "@/hooks/use-mock-data";
import { useGetStockLevels } from "@/hooks/api-hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, ArrowUpDown, Eye, ExternalLink, RefreshCw } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Product } from "@/lib/woocommerce";
import { toast } from "sonner";

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
  const { data: products, isLoading: isLoadingProducts } = useGetProducts();
  const { data: stockLevels, isLoading: isLoadingStockLevels } = useGetStockLevels();
  const [tab, setTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Combine products with stock levels
  const productsWithStock = products?.map(product => {
    const stockLevel = stockLevels?.find(sl => sl.product_id === product.id);
    return {
      ...product,
      // Tồn kho thực tế: lấy từ bảng hmm_stock_levels nếu có, không thì lấy từ WooCommerce
      real_stock: stockLevel?.ton_thuc_te !== undefined ? stockLevel.ton_thuc_te : product.stock_quantity,
      // Đơn đang xử lý: số lượng đặt hàng đang chờ xử lý, lấy từ meta_data hoặc mặc định là 0
      pending_orders: product.meta_data?.find(meta => meta.key === 'pending_orders')?.value || 0,
      // Có thể bán: lấy từ bảng hmm_stock_levels nếu có, không thì tính bằng tồn kho - đơn đang xử lý
      available_to_sell: stockLevel?.co_the_ban !== undefined 
        ? stockLevel.co_the_ban 
        : (product.stock_quantity || 0) - (product.meta_data?.find(meta => meta.key === 'pending_orders')?.value || 0)
    };
  });
  
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
              <Button variant="outline" size="icon" onClick={showDataSourceInfo}>
                <RefreshCw className="h-4 w-4" />
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
                getStockStatusBadge={getStockStatusBadge}
                getWooProductUrl={getWooProductUrl}
              />
            </TabsContent>
            <TabsContent value="instock" className="mt-4">
              <ProductsTable 
                products={filteredProducts} 
                isLoading={isLoading}
                getStockStatusBadge={getStockStatusBadge}
                getWooProductUrl={getWooProductUrl}
              />
            </TabsContent>
            <TabsContent value="lowstock" className="mt-4">
              <ProductsTable 
                products={filteredProducts} 
                isLoading={isLoading}
                getStockStatusBadge={getStockStatusBadge}
                getWooProductUrl={getWooProductUrl}
              />
            </TabsContent>
            <TabsContent value="outofstock" className="mt-4">
              <ProductsTable 
                products={filteredProducts} 
                isLoading={isLoading}
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
  getStockStatusBadge: (product: Product & { real_stock?: number, available_to_sell?: number, pending_orders?: number }) => JSX.Element;
  getWooProductUrl: (productId: number) => string;
}

function ProductsTable({ products, isLoading, getStockStatusBadge, getWooProductUrl }: ProductsTableProps) {
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
                  <a href={getWooProductUrl(product.id)} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="mr-1 h-4 w-4" />
                      Chi tiết
                    </Button>
                  </a>
                  <a href={`/inventory/product/${product.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="mr-1 h-4 w-4" />
                      Xem kho
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
