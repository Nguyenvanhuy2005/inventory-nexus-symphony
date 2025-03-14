
import { useState, useEffect } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileDown, Calendar, ArrowUpDown, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { 
  getAllProducts, getTopSellingProducts, getSalesByDate, normalizeProduct,
  getProductVariations, normalizeVariation
} from "@/lib/woocommerce";
import { useGetSuppliers, useGetCustomerDebts } from "@/hooks/api-hooks";
import { exportToCSV } from "@/lib/api-utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Màu sắc cho biểu đồ
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Reports() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  });
  const [reportPeriod, setReportPeriod] = useState<'week' | 'month' | 'year'>('month');

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Báo cáo thống kê" 
        description="Cung cấp báo cáo về tồn kho, doanh thu, công nợ khách hàng và nhà cung cấp"
      />
      
      <Card className="p-6">
        <Tabs defaultValue="inventory">
          <TabsList className="mb-4">
            <TabsTrigger value="inventory">Báo cáo tồn kho</TabsTrigger>
            <TabsTrigger value="sales">Báo cáo doanh thu</TabsTrigger>
            <TabsTrigger value="customer-debts">Công nợ khách hàng</TabsTrigger>
            <TabsTrigger value="supplier-debts">Công nợ nhà cung cấp</TabsTrigger>
          </TabsList>
          
          <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
            <div className="flex items-center gap-2">
              <DatePickerWithRange dateRange={dateRange} onDateRangeChange={setDateRange} />
              <Select value={reportPeriod} onValueChange={(value: 'week' | 'month' | 'year') => setReportPeriod(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Chọn kỳ báo cáo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Theo tuần</SelectItem>
                  <SelectItem value="month">Theo tháng</SelectItem>
                  <SelectItem value="year">Theo năm</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline">
              <FileDown className="mr-2 h-4 w-4" />
              Xuất báo cáo
            </Button>
          </div>
          
          <TabsContent value="inventory" className="mt-4">
            <InventoryReport dateRange={dateRange} />
          </TabsContent>
          
          <TabsContent value="sales" className="mt-4">
            <SalesReport dateRange={dateRange} period={reportPeriod} />
          </TabsContent>
          
          <TabsContent value="customer-debts" className="mt-4">
            <CustomerDebtsReport />
          </TabsContent>
          
          <TabsContent value="supplier-debts" className="mt-4">
            <SupplierDebtsReport />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

function InventoryReport({ dateRange }: { dateRange?: DateRange }) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch products data
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products-for-report'],
    queryFn: async () => {
      const productsData = await getAllProducts();
      return productsData.map(product => normalizeProduct(product));
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
  
  // Tính toán dữ liệu cho biểu đồ phân loại sản phẩm theo trạng thái
  const stockStatusData = [
    { name: 'Còn hàng', value: products.filter(p => p.stock_status === 'instock').length },
    { name: 'Hết hàng', value: products.filter(p => p.stock_status === 'outofstock').length },
    { name: 'Đặt trước', value: products.filter(p => p.stock_status === 'onbackorder').length }
  ];
  
  // Lọc sản phẩm theo từ khóa tìm kiếm
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Hàm xuất dữ liệu tồn kho ra CSV
  const handleExportInventory = () => {
    const exportData = filteredProducts.map(product => ({
      SKU: product.sku || '',
      'Tên sản phẩm': product.name,
      'Loại': product.type,
      'Tồn kho thực': product.real_stock || product.stock_quantity,
      'Đơn đang xử lý': product.pending_orders || 0,
      'Có thể bán': product.available_to_sell || product.stock_quantity,
      'Giá': product.price,
      'Trạng thái': product.stock_status === 'instock' ? 'Còn hàng' : 'Hết hàng'
    }));
    
    exportToCSV('bao-cao-ton-kho', exportData);
  };
  
  return (
    <div className="space-y-6">
      {/* Tổng quan về tồn kho */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-2">Tổng sản phẩm</h3>
          <p className="text-3xl font-bold">{products.length}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-2">Sản phẩm còn hàng</h3>
          <p className="text-3xl font-bold text-green-600">
            {products.filter(p => p.stock_status === 'instock').length}
          </p>
        </Card>
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-2">Sản phẩm hết hàng</h3>
          <p className="text-3xl font-bold text-red-600">
            {products.filter(p => p.stock_status === 'outofstock').length}
          </p>
        </Card>
      </div>
      
      {/* Biểu đồ phân bố trạng thái hàng */}
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Phân bố trạng thái hàng</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stockStatusData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {stockStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} sản phẩm`, '']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
      
      {/* Danh sách sản phẩm và trạng thái tồn kho */}
      <Card className="p-4">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
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
          <Button variant="outline" onClick={handleExportInventory}>
            <FileDown className="mr-2 h-4 w-4" />
            Xuất báo cáo tồn kho
          </Button>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">SKU</TableHead>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Không tìm thấy sản phẩm nào
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map(product => (
                  <TableRow key={product.id}>
                    <TableCell>{product.sku || "-"}</TableCell>
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
                    <TableCell>{product.real_stock || product.stock_quantity}</TableCell>
                    <TableCell>{product.pending_orders || 0}</TableCell>
                    <TableCell>{product.available_to_sell || product.stock_quantity}</TableCell>
                    <TableCell>{formatCurrency(product.price)}</TableCell>
                    <TableCell>
                      <span 
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.stock_status === 'instock' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {product.stock_status === 'instock' ? 'Còn hàng' : 'Hết hàng'}
                      </span>
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

function SalesReport({ dateRange, period }: { dateRange?: DateRange, period: 'week' | 'month' | 'year' }) {
  // Fetch sales data
  const { data: salesData = [], isLoading: isLoadingSales } = useQuery({
    queryKey: ['sales-report', period, dateRange],
    queryFn: async () => {
      // Format dates for API
      const formatDate = (date?: Date) => {
        if (!date) return undefined;
        return date.toISOString().split('T')[0];
      };
      
      return await getSalesByDate(
        period, 
        formatDate(dateRange?.from), 
        formatDate(dateRange?.to)
      );
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
  
  // Fetch top selling products
  const { data: topProducts = [], isLoading: isLoadingTopProducts } = useQuery({
    queryKey: ['top-selling-products', period],
    queryFn: async () => {
      return await getTopSellingProducts(period);
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
  
  // Tính tổng doanh thu
  const totalSales = salesData.reduce((sum, item) => sum + parseFloat(item.total), 0);
  
  // Format data for chart
  const chartData = salesData.map(item => ({
    date: new Date(item.date).toLocaleDateString('vi-VN'),
    sales: parseFloat(item.total)
  }));
  
  // Hàm xuất dữ liệu doanh thu ra CSV
  const handleExportSales = () => {
    const exportData = salesData.map(item => ({
      'Ngày': new Date(item.date).toLocaleDateString('vi-VN'),
      'Doanh thu': formatCurrency(item.total)
    }));
    
    exportToCSV('bao-cao-doanh-thu', exportData);
  };
  
  return (
    <div className="space-y-6">
      {/* Tổng quan về doanh thu */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-2">Tổng doanh thu</h3>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalSales.toString())}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-2">Doanh thu trung bình mỗi ngày</h3>
          <p className="text-3xl font-bold text-blue-600">
            {salesData.length > 0 
              ? formatCurrency((totalSales / salesData.length).toString()) 
              : formatCurrency('0')}
          </p>
        </Card>
      </div>
      
      {/* Biểu đồ doanh thu */}
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Biểu đồ doanh thu</h3>
        <div className="h-[300px]">
          {isLoadingSales ? (
            <div className="flex justify-center items-center h-full">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [formatCurrency(value.toString()), 'Doanh thu']} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  name="Doanh thu" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-full">
              <p>Không có dữ liệu doanh thu trong khoảng thời gian này</p>
            </div>
          )}
        </div>
      </Card>
      
      {/* Top sản phẩm bán chạy */}
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Top sản phẩm bán chạy</h3>
          <Button variant="outline" onClick={handleExportSales}>
            <FileDown className="mr-2 h-4 w-4" />
            Xuất báo cáo doanh thu
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Biểu đồ top sản phẩm */}
          <div className="h-[300px]">
            {isLoadingTopProducts ? (
              <div className="flex justify-center items-center h-full">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts.slice(0, 5).map(p => ({ name: p.name, total: p.total }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, 'Số lượng']} />
                  <Legend />
                  <Bar dataKey="total" name="Đã bán" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-full">
                <p>Không có dữ liệu sản phẩm bán chạy</p>
              </div>
            )}
          </div>
          
          {/* Bảng top sản phẩm */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead className="text-right">Đã bán</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingTopProducts ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-4">
                      <div className="flex justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : topProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-4">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  topProducts.map((product, index) => (
                    <TableRow key={product.product_id} className={index < 3 ? "bg-blue-50" : ""}>
                      <TableCell className="font-medium">
                        {index < 3 && <span className="text-blue-600 mr-1">#{index + 1}</span>}
                        {product.name}
                      </TableCell>
                      <TableCell className="text-right">{product.total}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>
    </div>
  );
}

function CustomerDebtsReport() {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch customer debts
  const { data: customerDebts = [], isLoading } = useGetCustomerDebts();
  
  // Lọc dữ liệu theo từ khóa tìm kiếm
  const filteredDebts = customerDebts.filter(debt => 
    debt.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Tính tổng công nợ
  const totalDebts = filteredDebts.reduce((sum, debt) => sum + parseFloat(debt.amount), 0);
  
  // Hàm xuất dữ liệu công nợ khách hàng ra CSV
  const handleExportDebts = () => {
    const exportData = filteredDebts.map(debt => ({
      'Khách hàng': debt.customer_name,
      'Công nợ': formatCurrency(debt.amount.toString()),
      'Ngày cập nhật': new Date(debt.updated_at).toLocaleDateString('vi-VN')
    }));
    
    exportToCSV('bao-cao-cong-no-khach-hang', exportData);
  };
  
  return (
    <div className="space-y-6">
      {/* Tổng quan về công nợ khách hàng */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-2">Tổng công nợ khách hàng</h3>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalDebts.toString())}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-2">Số khách hàng có công nợ</h3>
          <p className="text-3xl font-bold">{filteredDebts.length}</p>
        </Card>
      </div>
      
      {/* Danh sách công nợ khách hàng */}
      <Card className="p-4">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm khách hàng..."
              className="pl-8 w-full md:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={handleExportDebts}>
            <FileDown className="mr-2 h-4 w-4" />
            Xuất báo cáo công nợ
          </Button>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Số điện thoại</TableHead>
                <TableHead className="text-right">Công nợ</TableHead>
                <TableHead>Ngày cập nhật</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredDebts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Không có dữ liệu công nợ khách hàng
                  </TableCell>
                </TableRow>
              ) : (
                filteredDebts.map(debt => (
                  <TableRow key={debt.id}>
                    <TableCell className="font-medium">{debt.customer_name}</TableCell>
                    <TableCell>{debt.customer_email || "—"}</TableCell>
                    <TableCell>{debt.customer_phone || "—"}</TableCell>
                    <TableCell className="text-right font-medium text-red-600">
                      {formatCurrency(debt.amount.toString())}
                    </TableCell>
                    <TableCell>{new Date(debt.updated_at).toLocaleDateString('vi-VN')}</TableCell>
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

function SupplierDebtsReport() {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch suppliers
  const { data: suppliers = [], isLoading } = useGetSuppliers();
  
  // Lọc dữ liệu theo từ khóa tìm kiếm
  const filteredSuppliers = suppliers.filter(supplier => 
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Tính tổng công nợ
  const totalDebts = filteredSuppliers.reduce((sum, supplier) => 
    sum + parseFloat(supplier.current_debt || '0'), 0
  );
  
  // Hàm xuất dữ liệu công nợ nhà cung cấp ra CSV
  const handleExportSupplierDebts = () => {
    const exportData = filteredSuppliers.map(supplier => ({
      'Nhà cung cấp': supplier.name,
      'Email': supplier.email || "—",
      'Số điện thoại': supplier.phone || "—",
      'Công nợ': formatCurrency(supplier.current_debt || '0'),
      'Ngày cập nhật': supplier.updated_at 
        ? new Date(supplier.updated_at).toLocaleDateString('vi-VN')
        : "—"
    }));
    
    exportToCSV('bao-cao-cong-no-nha-cung-cap', exportData);
  };
  
  return (
    <div className="space-y-6">
      {/* Tổng quan về công nợ nhà cung cấp */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-2">Tổng công nợ nhà cung cấp</h3>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalDebts.toString())}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-2">Số nhà cung cấp có công nợ</h3>
          <p className="text-3xl font-bold">
            {filteredSuppliers.filter(s => parseFloat(s.current_debt || '0') > 0).length}
          </p>
        </Card>
      </div>
      
      {/* Danh sách công nợ nhà cung cấp */}
      <Card className="p-4">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm nhà cung cấp..."
              className="pl-8 w-full md:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={handleExportSupplierDebts}>
            <FileDown className="mr-2 h-4 w-4" />
            Xuất báo cáo công nợ
          </Button>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nhà cung cấp</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Số điện thoại</TableHead>
                <TableHead className="text-right">Công nợ</TableHead>
                <TableHead>Ngày cập nhật</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Không có dữ liệu công nợ nhà cung cấp
                  </TableCell>
                </TableRow>
              ) : (
                filteredSuppliers.map(supplier => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.email || "—"}</TableCell>
                    <TableCell>{supplier.phone || "—"}</TableCell>
                    <TableCell className="text-right font-medium text-red-600">
                      {formatCurrency(supplier.current_debt || '0')}
                    </TableCell>
                    <TableCell>
                      {supplier.updated_at 
                        ? new Date(supplier.updated_at).toLocaleDateString('vi-VN')
                        : "—"
                      }
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
