
import { useState } from "react";
import { useGetOrders } from "@/hooks/use-mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Filter, Eye, FileDown } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Order } from "@/lib/woocommerce";

export default function Sales() {
  const { data: orders, isLoading } = useGetOrders();
  const [searchTerm, setSearchTerm] = useState("");
  const [tab, setTab] = useState("all");
  
  // Filter orders based on tab and search term
  const filteredOrders = orders?.filter(order => {
    const searchFields = [
      order.id.toString(),
      order.billing?.first_name,
      order.billing?.last_name,
      order.billing?.email,
      order.billing?.phone
    ].filter(Boolean).join(" ").toLowerCase();
    
    const matchesSearch = searchFields.includes(searchTerm.toLowerCase());
      
    if (tab === "all") return matchesSearch;
    if (tab === "processing") return order.status === "processing" && matchesSearch;
    if (tab === "completed") return order.status === "completed" && matchesSearch;
    if (tab === "cancelled") return (order.status === "cancelled" || order.status === "failed") && matchesSearch;
    return matchesSearch;
  });
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Hoàn thành</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Đang xử lý</Badge>;
      case 'on-hold':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Đang giữ</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Đã hủy</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Thất bại</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Quản lý bán hàng" 
        description="Quản lý đơn hàng và theo dõi trạng thái đơn hàng"
      />
      
      <Card>
        <div className="p-4">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Tìm đơn hàng..."
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
              Tạo đơn hàng
            </Button>
          </div>
          
          <Tabs defaultValue="all" className="mt-4" value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all">Tất cả</TabsTrigger>
              <TabsTrigger value="processing">Đang xử lý</TabsTrigger>
              <TabsTrigger value="completed">Hoàn thành</TabsTrigger>
              <TabsTrigger value="cancelled">Đã hủy</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              <OrdersTable 
                orders={filteredOrders} 
                isLoading={isLoading}
                getStatusBadge={getStatusBadge}
              />
            </TabsContent>
            <TabsContent value="processing" className="mt-4">
              <OrdersTable 
                orders={filteredOrders} 
                isLoading={isLoading}
                getStatusBadge={getStatusBadge}
              />
            </TabsContent>
            <TabsContent value="completed" className="mt-4">
              <OrdersTable 
                orders={filteredOrders} 
                isLoading={isLoading}
                getStatusBadge={getStatusBadge}
              />
            </TabsContent>
            <TabsContent value="cancelled" className="mt-4">
              <OrdersTable 
                orders={filteredOrders} 
                isLoading={isLoading}
                getStatusBadge={getStatusBadge}
              />
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
}

interface OrdersTableProps {
  orders: Order[] | undefined;
  isLoading: boolean;
  getStatusBadge: (status: string) => JSX.Element;
}

function OrdersTable({ orders, isLoading, getStatusBadge }: OrdersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Mã đơn</TableHead>
          <TableHead>Ngày tạo</TableHead>
          <TableHead>Khách hàng</TableHead>
          <TableHead>Số lượng SP</TableHead>
          <TableHead>Tổng tiền</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead className="text-right">Thao tác</TableHead>
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
        ) : orders?.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center">
              Không tìm thấy đơn hàng nào
            </TableCell>
          </TableRow>
        ) : (
          orders?.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">#{order.id}</TableCell>
              <TableCell>{formatDate(order.date_created)}</TableCell>
              <TableCell>
                <div>
                  <div>{order.billing?.first_name} {order.billing?.last_name}</div>
                  <div className="text-xs text-muted-foreground">{order.billing?.email}</div>
                </div>
              </TableCell>
              <TableCell>{order.line_items.reduce((sum, item) => sum + item.quantity, 0)}</TableCell>
              <TableCell className="font-medium">{formatCurrency(order.total)}</TableCell>
              <TableCell>{getStatusBadge(order.status)}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <FileDown className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
