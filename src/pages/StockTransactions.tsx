import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, FileDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useGetStockTransactions } from "@/hooks/api-hooks";
import { AlertTriangle } from "lucide-react";
import { StockTransaction } from "@/types/models";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function StockTransactions() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");

  // Get stock transactions data
  const { data: transactions = [], isLoading, isError, refetch, error } = useGetStockTransactions();

  // Filter transactions based on search term and selected type
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || transaction.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Quản lý giao dịch kho"
        description="Xem và quản lý các giao dịch kho"
      />

      <Card className="p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm giao dịch..."
              className="pl-8 w-full md:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select onValueChange={setSelectedType} defaultValue={selectedType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Chọn loại giao dịch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="goods_receipt">Nhập hàng</SelectItem>
                <SelectItem value="return">Trả hàng</SelectItem>
                <SelectItem value="sale">Bán hàng</SelectItem>
                <SelectItem value="adjustment">Điều chỉnh</SelectItem>
                <SelectItem value="damaged">Hàng hỏng</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <FileDown className="mr-2 h-4 w-4" />
              Xuất báo cáo
            </Button>
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
              Đã xảy ra lỗi khi tải dữ liệu giao dịch kho từ API. Vui lòng kiểm tra kết nối đến plugin HMM Custom API.
              {error instanceof Error && <span className="block mt-2 text-xs">{error.message}</span>}
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Thử lại
            </Button>
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="mt-6 rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Mã giao dịch</TableHead>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Loại giao dịch</TableHead>
                  <TableHead>Số lượng</TableHead>
                  <TableHead>Số lượng trước</TableHead>
                  <TableHead>Số lượng hiện tại</TableHead>
                  <TableHead>Tham chiếu</TableHead>
                  <TableHead>Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction: StockTransaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.created_at)}</TableCell>
                    <TableCell>{transaction.transaction_id}</TableCell>
                    <TableCell>{transaction.product_name}</TableCell>
                    <TableCell>
                      {transaction.type === 'goods_receipt' ? 'Nhập hàng' :
                        transaction.type === 'return' ? 'Trả hàng' :
                          transaction.type === 'sale' ? 'Bán hàng' :
                            transaction.type === 'adjustment' ? 'Điều chỉnh' :
                              transaction.type === 'damaged' ? 'Hàng hỏng' : 'Không xác định'}
                    </TableCell>
                    <TableCell>{transaction.quantity}</TableCell>
                    <TableCell>{transaction.previous_quantity}</TableCell>
                    <TableCell>{transaction.current_quantity}</TableCell>
                    <TableCell>{transaction.reference_id}</TableCell>
                    <TableCell>{transaction.notes || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="mt-8 flex items-center justify-center p-8 border border-dashed rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-medium">Không có giao dịch kho</h3>
              <p className="text-muted-foreground mt-1">
                Không tìm thấy giao dịch kho nào phù hợp với tìm kiếm của bạn.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
