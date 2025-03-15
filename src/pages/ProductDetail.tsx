import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  useGetProductWithVariations, 
  useUpdateStockLevel,
  useCreateStockLevel
} from "@/hooks/api-hooks";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, ExternalLink, InfoIcon, ShoppingCart } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

// Format currency
const formatCurrency = (value: string | undefined) => {
  if (!value) return "0 ₫";
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0
  }).format(Number(value));
};

export default function ProductDetail() {
  const { id } = useParams();
  const productId = parseInt(id || "0");
  const { data, isLoading, error } = useGetProductWithVariations(productId);
  const updateStockLevel = useUpdateStockLevel();
  const createStockLevel = useCreateStockLevel();
  
  const [isUpdateStockOpen, setIsUpdateStockOpen] = useState(false);
  const [realStock, setRealStock] = useState<number>(0);
  const [availableStock, setAvailableStock] = useState<number>(0);

  // Extract product and variations from the data
  const product = data?.product;
  const variations = data?.variations || [];

  // Initialize stock values when product data is loaded
  useEffect(() => {
    if (product) {
      setRealStock(product.real_stock || product.stock_quantity || 0);
      setAvailableStock(product.available_to_sell || product.stock_quantity || 0);
    }
  }, [product]);

  const handleSaveStockUpdate = async () => {
    if (!product) return;
    
    const stockData = {
      product_id: productId,
      ton_thuc_te: realStock,
      co_the_ban: availableStock,
      last_updated: new Date().toISOString()
    };

    try {
      // Determine if we need to create or update
      if (product?.real_stock !== undefined) {
        await updateStockLevel.mutateAsync(stockData);
      } else {
        await createStockLevel.mutateAsync(stockData);
      }
      setIsUpdateStockOpen(false);
    } catch (error) {
      console.error("Error updating stock:", error);
    }
  };
  
  // Get WooCommerce product URL
  const getWooProductUrl = (productId: number) => {
    return `https://hmm.vn/wp-admin/post.php?post=${productId}&action=edit`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="space-y-4">
        <div className="flex items-center">
          <Link to="/inventory">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/inventory">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại danh sách
          </Button>
        </Link>
        <a href={getWooProductUrl(product.id)} target="_blank" rel="noopener noreferrer">
          <Button>
            <ExternalLink className="mr-2 h-4 w-4" />
            Chỉnh sửa trong WooCommerce
          </Button>
        </a>
      </div>

      <DashboardHeader
        title={product.name}
        description={`Mã sản phẩm: ${product.sku || 'Chưa có mã'}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Thông tin sản phẩm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Ảnh sản phẩm</h3>
                  {product.images && product.images.length > 0 ? (
                    <div className="mt-2 rounded-lg overflow-hidden border">
                      <img 
                        src={product.images[0].src} 
                        alt={product.name} 
                        className="w-full aspect-square object-contain" 
                      />
                    </div>
                  ) : (
                    <div className="mt-2 h-40 rounded-lg border flex items-center justify-center bg-muted/50">
                      <p className="text-muted-foreground">Không có ảnh</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Mô tả ngắn</h3>
                  <div className="mt-2">
                    {product.short_description ? (
                      <div dangerouslySetInnerHTML={{ __html: product.short_description }} />
                    ) : (
                      <p className="text-muted-foreground">Không có mô tả ngắn</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Thông tin cơ bản</h3>
                  <dl className="mt-2 divide-y divide-gray-100">
                    <div className="flex justify-between py-2">
                      <dt className="text-sm font-medium">Tên sản phẩm</dt>
                      <dd className="text-sm">{product.name}</dd>
                    </div>
                    <div className="flex justify-between py-2">
                      <dt className="text-sm font-medium">Mã sản phẩm</dt>
                      <dd className="text-sm">{product.sku || 'Chưa có mã'}</dd>
                    </div>
                    <div className="flex justify-between py-2">
                      <dt className="text-sm font-medium">Loại sản phẩm</dt>
                      <dd className="text-sm capitalize">{product.type || 'simple'}</dd>
                    </div>
                    <div className="flex justify-between py-2">
                      <dt className="text-sm font-medium">Giá bán</dt>
                      <dd className="text-sm font-semibold">{formatCurrency(product.price)}</dd>
                    </div>
                    <div className="flex justify-between py-2">
                      <dt className="text-sm font-medium">Giá gốc</dt>
                      <dd className="text-sm">{formatCurrency(product.regular_price)}</dd>
                    </div>
                    <div className="flex justify-between py-2">
                      <dt className="text-sm font-medium">Giá khuyến mãi</dt>
                      <dd className="text-sm">{formatCurrency(product.sale_price)}</dd>
                    </div>
                    <div className="flex justify-between py-2">
                      <dt className="text-sm font-medium">Quản lý tồn kho</dt>
                      <dd className="text-sm">{product.manage_stock ? 'Có' : 'Không'}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Danh mục</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {product.categories && product.categories.length > 0 ? (
                      product.categories.map(category => (
                        <Badge key={category.id} variant="secondary">{category.name}</Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground">Không có danh mục</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Thuộc tính sản phẩm</h3>
                  <div className="mt-2">
                    {product.attributes && product.attributes.length > 0 ? (
                      <dl className="divide-y divide-gray-100">
                        {product.attributes.map((attr, index) => (
                          <div key={index} className="flex justify-between py-2">
                            <dt className="text-sm font-medium">{attr.name}</dt>
                            <dd className="text-sm">{Array.isArray(attr.options) ? attr.options.join(', ') : attr.options}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <p className="text-muted-foreground">Không có thuộc tính</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quản lý tồn kho</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Trạng thái</h3>
                <div className="mt-2">
                  {product.stock_status === 'instock' ? (
                    <Badge variant="outline" className="border-green-500 text-green-500">Còn hàng</Badge>
                  ) : (
                    <Badge variant="outline" className="border-red-500 text-red-500">Hết hàng</Badge>
                  )}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-muted-foreground">Tồn kho</h3>
                  <Dialog open={isUpdateStockOpen} onOpenChange={setIsUpdateStockOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">Cập nhật tồn kho</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Cập nhật tồn kho</DialogTitle>
                        <DialogDescription>
                          Nhập số lượng tồn kho thực tế và có thể bán cho sản phẩm này.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="real-stock">Tồn kho thực tế</Label>
                          <Input 
                            id="real-stock" 
                            type="number" 
                            value={realStock} 
                            onChange={(e) => setRealStock(parseInt(e.target.value) || 0)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Số lượng sản phẩm thực tế có trong kho (bao gồm cả hàng có thể bị lỗi).
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="available-stock">Có thể bán</Label>
                          <Input 
                            id="available-stock" 
                            type="number" 
                            value={availableStock} 
                            onChange={(e) => setAvailableStock(parseInt(e.target.value) || 0)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Số lượng sản phẩm có thể bán ngay (không bao gồm hàng lỗi, hàng đang giao v.v).
                          </p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUpdateStockOpen(false)}>Hủy</Button>
                        <Button onClick={handleSaveStockUpdate}>Lưu thay đổi</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <dl className="divide-y divide-gray-100">
                  <div className="flex justify-between py-2">
                    <dt className="text-sm font-medium">Tồn kho thực tế</dt>
                    <dd className="text-sm">{product.real_stock || product.stock_quantity || 0}</dd>
                  </div>
                  <div className="flex justify-between py-2">
                    <dt className="text-sm font-medium">
                      <div className="flex items-center">
                        <span>Đơn đang xử lý</span>
                        <div className="relative ml-1 group">
                          <InfoIcon className="h-4 w-4 text-muted-foreground" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-black text-white text-xs rounded w-60 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            Số lượng sản phẩm đang trong đơn hàng có trạng thái "đang xử lý", "tạm giữ", "chờ thanh toán", chưa hoàn thành.
                          </div>
                        </div>
                      </div>
                    </dt>
                    <dd className="text-sm">{product.pending_orders || 0}</dd>
                  </div>
                  <div className="flex justify-between py-2">
                    <dt className="text-sm font-medium">Có thể bán</dt>
                    <dd className="text-sm">{product.available_to_sell || product.stock_quantity || 0}</dd>
                  </div>
                </dl>
              </div>
              
              <Separator />
              
              <Button className="w-full" variant="secondary" asChild>
                <a href={getWooProductUrl(product.id)} target="_blank" rel="noopener noreferrer">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Xem chi tiết trên WooCommerce
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {product.type === 'variable' && variations && variations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Biến thể sản phẩm</CardTitle>
            <CardDescription>
              Sản phẩm này có {variations.length} biến thể
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Mã</TableHead>
                  <TableHead>Biến thể</TableHead>
                  <TableHead>Thuộc tính</TableHead>
                  <TableHead>Tồn kho</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variations.map((variation) => (
                  <TableRow key={variation.id}>
                    <TableCell className="font-medium">{variation.sku || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {variation.image ? (
                          <img 
                            src={variation.image.src} 
                            alt={variation.sku || "Biến thể"} 
                            className="h-8 w-8 rounded object-cover" 
                          />
                        ) : product.images?.[0] && (
                          <img 
                            src={product.images[0].src} 
                            alt={variation.sku || "Biến thể"} 
                            className="h-8 w-8 rounded object-cover" 
                          />
                        )}
                        <span>{variation.sku || `Biến thể #${variation.id}`}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {variation.attributes && variation.attributes.length > 0
                        ? variation.attributes.map(attr => `${attr.name}: ${attr.option}`).join(', ')
                        : '-'
                      }
                    </TableCell>
                    <TableCell>{variation.stock_quantity || 0}</TableCell>
                    <TableCell>{formatCurrency(variation.price)}</TableCell>
                    <TableCell>
                      {variation.stock_status === 'instock' ? (
                        <Badge variant="outline" className="border-green-500 text-green-500">Còn hàng</Badge>
                      ) : (
                        <Badge variant="outline" className="border-red-500 text-red-500">Hết hàng</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <a 
                        href={`${getWooProductUrl(product.id)}&variation_id=${variation.id}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Chỉnh sửa
                        </Button>
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {product.description && (
        <Card>
          <CardHeader>
            <CardTitle>Mô tả sản phẩm</CardTitle>
          </CardHeader>
          <CardContent>
            <div dangerouslySetInnerHTML={{ __html: product.description }} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
