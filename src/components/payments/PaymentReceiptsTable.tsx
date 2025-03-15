
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PaymentReceipt } from "@/types/models";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { AlertTriangle } from "lucide-react";

interface PaymentReceiptsTableProps {
  receipts: PaymentReceipt[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onViewReceipt: (id: number) => void;
}

export default function PaymentReceiptsTable({
  receipts,
  isLoading,
  isError,
  onRetry,
  onViewReceipt
}: PaymentReceiptsTableProps) {
  // Get badge for receipt type
  const getTypeBadge = (type: string) => {
    switch(type) {
      case 'payment':
        return <Badge variant="destructive">Chi tiền</Badge>;
      case 'receipt':
        return <Badge variant="default">Thu tiền</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Get badge for entity type
  const getEntityTypeBadge = (type: string) => {
    switch(type) {
      case 'customer':
        return <Badge variant="outline">Khách hàng</Badge>;
      case 'supplier':
        return <Badge variant="outline">Nhà cung cấp</Badge>;
      case 'other':
        return <Badge variant="outline">Khác</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
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
          Đã xảy ra lỗi khi tải dữ liệu thu chi từ API. Vui lòng kiểm tra kết nối đến plugin HMM Custom API.
        </p>
        <Button variant="outline" onClick={onRetry}>
          Thử lại
        </Button>
      </div>
    );
  }
  
  if (receipts.length === 0) {
    return (
      <div className="mt-8 flex items-center justify-center p-8 border border-dashed rounded-lg">
        <div className="text-center">
          <h3 className="text-lg font-medium">Chưa có phiếu thu chi</h3>
          <p className="text-muted-foreground mt-1">
            Tạo phiếu thu chi mới để quản lý các khoản thu chi
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
            <TableHead>Loại</TableHead>
            <TableHead>Đối tượng</TableHead>
            <TableHead>Số tiền</TableHead>
            <TableHead>Mô tả</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {receipts.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.receipt_id}</TableCell>
              <TableCell>{formatDate(item.date)}</TableCell>
              <TableCell>{getTypeBadge(item.type)}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{item.entity_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {getEntityTypeBadge(item.entity_type)}
                  </span>
                </div>
              </TableCell>
              <TableCell>{formatCurrency(item.amount.toString())}</TableCell>
              <TableCell className="max-w-[200px] truncate">{item.description}</TableCell>
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
