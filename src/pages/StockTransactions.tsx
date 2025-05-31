
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useGetStockTransactions } from "@/hooks/api-hooks";
import { StockTransaction } from "@/types/models";

export default function StockTransactions() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  
  const { data: stockData = [], isLoading, isError, error, refetch } = useGetStockTransactions();
  
  // Handle both array and paginated response format
  const stockTransactions = Array.isArray(stockData) ? stockData : stockData.transactions || [];
  
  const filteredTransactions = stockTransactions.filter((transaction: StockTransaction) => {
    const matchesSearch = transaction.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          transaction.product_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (typeFilter === "all") return matchesSearch;
    return transaction.type === typeFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Giao dịch kho" 
        description="Theo dõi tất cả các giao dịch xuất nhập kho"
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
            <Select onValueChange={setTypeFilter} defaultValue={typeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Chọn loại giao dịch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="goods_receipt">Nhập hàng</SelectItem>
                <SelectItem value="return">Trả hàng</SelectItem>
                <SelectItem value="sale">Bán hàng</SelectItem>
                <SelectItem value="adjustment">Điều chỉnh</SelectItem>
                <SelectItem value="damaged">Hỏng hóc</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stock Transactions Table */}
        <div className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-lg">
              <AlertTriangle className="h-10 w-10 text-yellow-500 mb-2" />
              <h3 className="text-lg font-medium">Không thể tải dữ liệu</h3>
              <p className="text-muted-foreground mt-1 mb-4">
                Đã xảy ra lỗi khi tải dữ liệu giao dịch kho: {error?.message || 'Lỗi không xác định'}
              </p>
              <Button variant="outline" onClick={() => refetch?.()}>
                Thử lại
              </Button>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex items-center justify-center p-8 border border-dashed rounded-lg">
              <div className="text-center">
                <h3 className="text-lg font-medium">Chưa có giao dịch nào</h3>
                <p className="text-muted-foreground mt-1">
                  Các giao dịch kho sẽ xuất hiện ở đây
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã giao dịch</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Số lượng</TableHead>
                    <TableHead>Trước đó</TableHead>
                    <TableHead>Hiện tại</TableHead>
                    <TableHead>Tham chiếu</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {transaction.transaction_id}
                      </TableCell>
                      <TableCell>{transaction.product_name}</TableCell>
                      <TableCell>
                        <Badge variant={
                          transaction.type === 'goods_receipt' ? 'default' :
                          transaction.type === 'sale' ? 'destructive' :
                          transaction.type === 'return' ? 'secondary' :
                          transaction.type === 'adjustment' ? 'outline' :
                          'default'
                        }>
                          {transaction.type === 'goods_receipt' ? 'Nhập hàng' :
                           transaction.type === 'sale' ? 'Bán hàng' :
                           transaction.type === 'return' ? 'Trả hàng' :
                           transaction.type === 'adjustment' ? 'Điều chỉnh' :
                           transaction.type === 'damaged' ? 'Hỏng hóc' :
                           transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={transaction.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                          {transaction.quantity > 0 ? '+' : ''}{transaction.quantity}
                        </span>
                      </TableCell>
                      <TableCell>{transaction.previous_quantity}</TableCell>
                      <TableCell>{transaction.current_quantity}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {transaction.reference_type}: {transaction.reference_id}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(transaction.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
