
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { GoodsReceipt } from "@/types/models";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { AlertTriangle } from "lucide-react";

interface GoodsReceiptsTableProps {
  goodsReceipts: GoodsReceipt[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onViewReceipt: (id: number) => void;
}

export default function GoodsReceiptsTable({
  goodsReceipts,
  isLoading,
  isError,
  onRetry,
  onViewReceipt
}: GoodsReceiptsTableProps) {
  // Get badge color based on status
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed':
        return <Badge className="bg-green-500">Hoàn thành</Badge>;
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

  if (isLoading) {
    return (
      <div className="mt-8 flex items-center justify-center">
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-lg">
        <AlertTriangle className="h-10 w-10 text-yellow-500 mb-2" />
        <h3 className="text-lg font-medium">Không thể tải dữ liệu</h3>
        <p className="text-muted-foreground mt-1 mb-4">
          Đã xảy ra lỗi khi tải dữ liệu nhập hàng từ API. Vui lòng kiểm tra kết nối đến plugin HMM Custom API.
        </p>
        <Button variant="outline" onClick={onRetry}>
          Thử lại
        </Button>
      </div>
    );
  }
  
  if (goodsReceipts.length === 0) {
    return (
      <div className="mt-8 flex items-center justify-center p-8 border border-dashed rounded-lg">
        <div className="text-center">
          <h3 className="text-lg font-medium">Chưa có phiếu nhập hàng</h3>
          <p className="text-muted-foreground mt-1">
            Tạo phiếu nhập hàng mới để quản lý việc nhập hàng từ nhà cung cấp
          </p>
        </div>
      </div>
    );
  }
  
  return (
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
          {goodsReceipts.map((item) => (
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
                  onClick={() => onViewReceipt(item.id)}
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
