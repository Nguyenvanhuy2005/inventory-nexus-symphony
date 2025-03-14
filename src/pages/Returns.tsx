
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Plus, FileDown, AlertTriangle, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useGetReturns, useCreateReturn } from "@/hooks/api-hooks";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Returns() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [openDialog, setOpenDialog] = useState(false);
  
  // Get returns data
  const { data: returns = [], isLoading, isError } = useGetReturns();
  
  // Filter returns based on search term and active tab
  const filteredReturns = returns.filter(item => {
    const matchesSearch = 
      item.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.return_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    return matchesSearch && item.type === (activeTab === "customer" ? "customer" : "supplier");
  });
  
  // Get badge color based on status
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed':
        return <Badge className="bg-green-500">Hoàn thành</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500">Đang xử lý</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Chờ xử lý</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500">Đã hủy</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Get payment status badge
  const getPaymentBadge = (status: string) => {
    switch(status) {
      case 'paid':
        return <Badge className="bg-green-500">Đã thanh toán</Badge>;
      case 'refunded':
        return <Badge className="bg-purple-500">Đã hoàn tiền</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-500">Một phần</Badge>;
      case 'pending':
        return <Badge className="bg-gray-500">Chờ thanh toán</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleCreateReturn = () => {
    setOpenDialog(true);
  };

  const handleViewReturn = (id: number) => {
    toast.info(`Xem chi tiết phiếu trả hàng #${id}`);
    // Sẽ xử lý xem chi tiết phiếu trả hàng
  };
  
  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Quản lý trả hàng" 
        description="Quản lý việc trả hàng từ khách hàng hoặc trả hàng cho nhà cung cấp"
      />
      
      <Card className="p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm phiếu trả hàng..."
              className="pl-8 w-full md:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <FileDown className="mr-2 h-4 w-4" />
              Xuất báo cáo
            </Button>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button onClick={handleCreateReturn}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo phiếu trả hàng
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                  <DialogTitle>Tạo phiếu trả hàng mới</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-center text-muted-foreground">
                    Chức năng tạo phiếu trả hàng đang được phát triển và sẽ sẵn sàng trong phiên bản tiếp theo.
                  </p>
                </div>
                <DialogFooter>
                  <Button onClick={() => setOpenDialog(false)}>Đóng</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <Tabs defaultValue="all" className="mt-6" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="customer">Khách hàng</TabsTrigger>
            <TabsTrigger value="supplier">Nhà cung cấp</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            {renderReturnsTable(filteredReturns, isLoading, isError, navigate, getStatusBadge, getPaymentBadge, handleViewReturn)}
          </TabsContent>
          
          <TabsContent value="customer" className="mt-4">
            {renderReturnsTable(filteredReturns, isLoading, isError, navigate, getStatusBadge, getPaymentBadge, handleViewReturn)}
          </TabsContent>
          
          <TabsContent value="supplier" className="mt-4">
            {renderReturnsTable(filteredReturns, isLoading, isError, navigate, getStatusBadge, getPaymentBadge, handleViewReturn)}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

function renderReturnsTable(filteredReturns, isLoading, isError, navigate, getStatusBadge, getPaymentBadge, onViewReturn) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-lg">
        <AlertTriangle className="h-10 w-10 text-yellow-500 mb-2" />
        <h3 className="text-lg font-medium">Không thể tải dữ liệu</h3>
        <p className="text-muted-foreground mt-1 mb-4">
          Đã xảy ra lỗi khi tải dữ liệu trả hàng từ API. Vui lòng kiểm tra kết nối đến plugin HMM Custom API.
        </p>
        <Button variant="outline" onClick={() => navigate(0)}>
          Thử lại
        </Button>
      </div>
    );
  }
  
  if (filteredReturns.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 border border-dashed rounded-lg">
        <div className="text-center">
          <h3 className="text-lg font-medium">Chưa có phiếu trả hàng</h3>
          <p className="text-muted-foreground mt-1">
            Tạo phiếu trả hàng mới để quản lý việc trả hàng từ khách hàng hoặc trả hàng cho nhà cung cấp
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã phiếu</TableHead>
            <TableHead>Ngày</TableHead>
            <TableHead>Loại</TableHead>
            <TableHead>Đối tượng</TableHead>
            <TableHead>Tổng tiền</TableHead>
            <TableHead>Thanh toán</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredReturns.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.return_id}</TableCell>
              <TableCell>{formatDate(item.date)}</TableCell>
              <TableCell>
                {item.type === 'customer' ? 'Khách hàng' : 'Nhà cung cấp'}
              </TableCell>
              <TableCell>{item.entity_name}</TableCell>
              <TableCell>{formatCurrency(item.total_amount.toString())}</TableCell>
              <TableCell>
                {getPaymentBadge(item.payment_status || 'pending')}
              </TableCell>
              <TableCell>
                {getStatusBadge(item.status)}
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => onViewReturn(item.id)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
