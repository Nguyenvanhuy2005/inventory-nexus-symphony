
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Return } from "@/types/models";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { AlertTriangle } from "lucide-react";

interface ReturnsTableProps {
  returns: Return[];
  isLoading: boolean;
  isError: boolean;
  getStatusBadge: (status: string) => JSX.Element;
  getTypeBadge: (type: string) => JSX.Element;
  onRetry: () => void;
  onViewReturn: (id: number) => void;
}

export default function ReturnsTable({ 
  returns, 
  isLoading, 
  isError, 
  getStatusBadge, 
  getTypeBadge,
  onRetry,
  onViewReturn
}: ReturnsTableProps) {
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
          Đã xảy ra lỗi khi tải dữ liệu trả hàng từ API. Vui lòng kiểm tra kết nối đến plugin HMM Custom API.
        </p>
        <Button variant="outline" onClick={onRetry}>
          Thử lại
        </Button>
      </div>
    );
  }
  
  if (returns.length === 0) {
    return (
      <div className="mt-8 flex items-center justify-center p-8 border border-dashed rounded-lg">
        <div className="text-center">
          <h3 className="text-lg font-medium">Chưa có phiếu trả hàng</h3>
          <p className="text-muted-foreground mt-1">
            Tạo phiếu trả hàng mới để quản lý việc trả hàng
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
            <TableHead>Tên đối tác</TableHead>
            <TableHead>Tổng tiền</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {returns.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.return_id}</TableCell>
              <TableCell>{formatDate(item.date)}</TableCell>
              <TableCell>{getTypeBadge(item.type)}</TableCell>
              <TableCell>{item.entity_name}</TableCell>
              <TableCell>{formatCurrency(item.total_amount.toString())}</TableCell>
              <TableCell>{getStatusBadge(item.status)}</TableCell>
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
