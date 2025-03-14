
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { 
  DollarSign, 
  ShoppingCart, 
  AlertCircle, 
  Package 
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { StatsCard } from "@/components/dashboard/StatsCard";
import RecentActivities from "@/components/dashboard/RecentActivities";
import { useGetSalesData, useGetInventoryByCategoryData, useGetProducts, useGetOrders } from "@/hooks/use-mock-data";
import { toast } from "sonner";

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0
  }).format(value);
};

// Colors for the pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

// Dashboard component
export default function Dashboard() {
  // Get data
  const { data: salesData, isLoading: isSalesDataLoading } = useGetSalesData();
  const { data: inventoryData, isLoading: isInventoryDataLoading } = useGetInventoryByCategoryData();
  const { data: products, isLoading: isProductsLoading } = useGetProducts();
  const { data: orders, isLoading: isOrdersLoading } = useGetOrders();

  // Calculate stats
  const totalRevenue = salesData?.reduce((sum, item) => sum + item.revenue, 0) || 0;
  const totalOrders = orders?.length || 0;
  const lowStockProducts = products?.filter(product => 
    product.stock_status === 'instock' && 
    (product.stock_quantity <= 5 || product.available_to_sell <= 5)
  ).length || 0;
  const outOfStockProducts = products?.filter(product => product.stock_status === 'outofstock').length || 0;

  // Show toast if data is using mock
  useEffect(() => {
    if (products && !isProductsLoading) {
      toast.info('Đang sử dụng dữ liệu mẫu do không thể kết nối đến API.', {
        duration: 5000,
      });
    }
  }, [products, isProductsLoading]);

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Tổng quan" 
        description="Xem tổng quan về tình trạng kinh doanh và kho hàng"
      />
      
      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Doanh thu"
          value={formatCurrency(totalRevenue)}
          description="Doanh thu 15 ngày gần đây"
          icon={DollarSign}
          trendValue={8.2}
          trendLabel="so với tuần trước"
          iconColor="text-green-500"
        />
        <StatsCard
          title="Đơn hàng"
          value={totalOrders}
          description="Tổng số đơn hàng"
          icon={ShoppingCart}
          trendValue={4.5}
          trendLabel="so với tuần trước"
          iconColor="text-blue-500"
        />
        <StatsCard
          title="Sắp hết hàng"
          value={lowStockProducts}
          description="Sản phẩm sắp hết hàng"
          icon={AlertCircle}
          trendValue={0}
          trendLabel="cần nhập thêm"
          iconColor="text-yellow-500"
        />
        <StatsCard
          title="Hết hàng"
          value={outOfStockProducts}
          description="Sản phẩm đã hết hàng"
          icon={Package}
          trendValue={-2.3}
          trendLabel="giảm so với tuần trước"
          iconColor="text-red-500"
        />
      </div>

      {/* Charts and activity */}
      <div className="grid grid-cols-12 gap-4">
        {/* Revenue chart */}
        <Card className="col-span-12 p-4 lg:col-span-8">
          <h3 className="mb-4 text-base font-medium">Doanh thu theo ngày</h3>
          <div className="h-[300px]">
            {isSalesDataLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={salesData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tickMargin={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    tickFormatter={(value) => 
                      new Intl.NumberFormat('vi-VN', {
                        notation: 'compact',
                        compactDisplay: 'short',
                      }).format(value)
                    }
                  />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Doanh thu']}
                    labelFormatter={(label) => `Ngày ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0ea5e9"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Recent activities */}
        <RecentActivities />

        {/* Inventory by category chart */}
        <Card className="col-span-12 p-4 lg:col-span-6">
          <h3 className="mb-4 text-base font-medium">Tồn kho theo danh mục</h3>
          <div className="h-[300px]">
            {isInventoryDataLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inventoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {inventoryData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} sản phẩm`, 'Số lượng']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Low stock products card */}
        <Card className="col-span-12 p-4 lg:col-span-6">
          <h3 className="mb-4 text-base font-medium">Sản phẩm sắp hết hàng</h3>
          <div className="h-[300px] overflow-auto">
            {isProductsLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left text-sm font-medium">Sản phẩm</th>
                    <th className="pb-2 text-right text-sm font-medium">Tồn kho</th>
                    <th className="pb-2 text-right text-sm font-medium">Có thể bán</th>
                  </tr>
                </thead>
                <tbody>
                  {products
                    ?.filter(product => 
                      product.stock_status === 'instock' && 
                      (product.stock_quantity <= 10 || product.available_to_sell <= 10)
                    )
                    .slice(0, 10)
                    .map(product => (
                      <tr key={product.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 text-sm">{product.name}</td>
                        <td className="py-2 text-right text-sm">
                          {product.real_stock || product.stock_quantity}
                        </td>
                        <td className="py-2 text-right text-sm">
                          <span className={product.available_to_sell <= 5 ? 'text-red-500 font-medium' : ''}>
                            {product.available_to_sell || product.stock_quantity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  {products?.filter(product => 
                    product.stock_status === 'instock' && 
                    (product.stock_quantity <= 10 || product.available_to_sell <= 10)
                  ).length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-10 text-center text-muted-foreground">
                        Không có sản phẩm nào sắp hết hàng
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
