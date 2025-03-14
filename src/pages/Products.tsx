
import { useState } from "react";
import { useGetProducts } from "@/hooks/use-mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter, ArrowUpDown, Edit, Trash } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/lib/woocommerce";

export default function Products() {
  const { data: products, isLoading } = useGetProducts();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter products based on search term
  const filteredProducts = products?.filter(product => {
    return product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Quản lý sản phẩm" 
        description="Quản lý thông tin sản phẩm, giá bán, thuộc tính và biến thể"
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
            </div>
            <Button className="shrink-0">
              <Plus className="mr-2 h-4 w-4" />
              Sản phẩm mới
            </Button>
          </div>
          
          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Mã</TableHead>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Giá Sale</TableHead>
                <TableHead>Tồn kho</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">
                    <div className="flex items-center justify-center py-4">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredProducts?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">
                    Không tìm thấy sản phẩm nào
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts?.map((product) => (
                  <TableRow key={product.id} className="group">
                    <TableCell className="font-medium">{product.sku || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {product.images[0] && (
                          <img 
                            src={product.images[0].src} 
                            alt={product.name} 
                            className="h-8 w-8 rounded object-cover" 
                          />
                        )}
                        <span>{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {product.type === 'simple' ? 'Đơn giản' : 
                         product.type === 'variable' ? 'Biến thể' : product.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {product.categories.length > 0 
                        ? product.categories.map(cat => cat.name).join(', ') 
                        : '-'}
                    </TableCell>
                    <TableCell>{formatCurrency(product.regular_price || product.price)}</TableCell>
                    <TableCell>{product.sale_price ? formatCurrency(product.sale_price) : '-'}</TableCell>
                    <TableCell>{product.stock_quantity}</TableCell>
                    <TableCell>
                      {product.stock_status === 'instock' ? (
                        <Badge variant="outline" className="border-green-500 text-green-500">Còn hàng</Badge>
                      ) : (
                        <Badge variant="outline" className="border-red-500 text-red-500">Hết hàng</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
