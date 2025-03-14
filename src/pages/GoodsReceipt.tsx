
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Plus, FileDown, AlertTriangle, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useGetGoodsReceipts, useCreateGoodsReceipt } from "@/hooks/api-hooks";
import { useGetSuppliers } from "@/hooks/use-mock-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function GoodsReceipt() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  
  // Get goods receipts data
  const { data: goodsReceipts = [], isLoading, isError } = useGetGoodsReceipts();
  
  // Filter goods receipts based on search term
  const filteredReceipts = goodsReceipts.filter(item => 
    item.receipt_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
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
      case 'partial':
        return <Badge className="bg-yellow-500">Một phần</Badge>;
      case 'pending':
        return <Badge className="bg-gray-500">Chờ thanh toán</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleCreateReceipt = () => {
    // Hiện thị dialog tạo phiếu nhập hàng
    setOpenDialog(true);
  };

  const handleViewReceipt = (id: number) => {
    toast.info(`Xem chi tiết phiếu nhập hàng #${id}`);
    // Sẽ xử lý xem chi tiết phiếu nhập hàng
  };
  
  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Quản lý nhập hàng" 
        description="Quản lý việc nhập hàng từ nhà cung cấp, cập nhật tồn kho khi nhập hàng"
      />
      
      <Card className="p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm phiếu nhập hàng..."
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
                <Button onClick={handleCreateReceipt}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo phiếu nhập hàng
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                  <DialogTitle>Tạo phiếu nhập hàng mới</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-center text-muted-foreground">
                    Chức năng tạo phiếu nhập hàng đang được phát triển và sẽ sẵn sàng trong phiên bản tiếp theo.
                  </p>
                </div>
                <DialogFooter>
                  <Button onClick={() => setOpenDialog(false)}>Đóng</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {isLoading ? (
          <div className="mt-8 flex items-center justify-center">
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : isError ? (
          <div className="mt-8 flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-lg">
            <AlertTriangle className="h-10 w-10 text-yellow-500 mb-2" />
            <h3 className="text-lg font-medium">Không thể tải dữ liệu</h3>
            <p className="text-muted-foreground mt-1 mb-4">
              Đã xảy ra lỗi khi tải dữ liệu nhập hàng từ API. Vui lòng kiểm tra kết nối đến plugin HMM Custom API.
            </p>
            <Button variant="outline" onClick={() => navigate(0)}>
              Thử lại
            </Button>
          </div>
        ) : filteredReceipts.length > 0 ? (
          <div className="mt-6 rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã phiếu</TableHead>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Nhà cung cấp</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Đã thanh toán</TableHead>
                  <TableHead>Trạng thái TT</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceipts.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.receipt_id}</TableCell>
                    <TableCell>{formatDate(item.date)}</TableCell>
                    <TableCell>{item.supplier_name}</TableCell>
                    <TableCell>{formatCurrency(item.total_amount.toString())}</TableCell>
                    <TableCell>{formatCurrency(item.payment_amount.toString())}</TableCell>
                    <TableCell>
                      {getPaymentBadge(item.payment_status)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(item.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleViewReceipt(item.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="mt-8 flex items-center justify-center p-8 border border-dashed rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-medium">Chưa có phiếu nhập hàng</h3>
              <p className="text-muted-foreground mt-1">
                Tạo phiếu nhập hàng mới để quản lý việc nhập hàng từ nhà cung cấp
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
