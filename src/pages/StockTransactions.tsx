import { useState } from "react";
import { useGetStockTransactions } from "@/hooks/api-hooks";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { getTransactionTypeDisplay, formatTransactionForDisplay, exportToCSV } from "@/lib/api-utils";
import { Loader2, Search, Download, RefreshCw } from "lucide-react";

export default function StockTransactions() {
  const [page, setPage] = useState<string>("1");
  const [perPage, setPerPage] = useState<string>("20");
  const [searchTerm, setSearchTerm] = useState("");
  const [transactionType, setTransactionType] = useState("");
  
  const { data: stockTransactionsData, isLoading, refetch } = useGetStockTransactions({
    page: page,
    per_page: perPage
  });
  
  const filteredTransactions = stockTransactionsData?.transactions
    .filter(transaction => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          (transaction.product_name || '').toLowerCase().includes(searchLower) ||
          transaction.reference_id?.toString().includes(searchLower) ||
          (transaction.notes || '').toLowerCase().includes(searchLower)
        );
      }
      return true;
    })
    .filter(transaction => {
      if (transactionType) {
        return transaction.transaction_type === transactionType;
      }
      return true;
    })
    .map(transaction => formatTransactionForDisplay(transaction)) || [];
  
  const handleExport = () => {
    if (filteredTransactions && filteredTransactions.length > 0) {
      exportToCSV('stock-transactions', filteredTransactions);
    }
  };
  
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Giao dịch tồn kho"
        description="Quản lý và xem lịch sử giao dịch tồn kho"
      />
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Lịch sử giao dịch</CardTitle>
              <CardDescription>
                Xem tất cả giao dịch tồn kho trong hệ thống
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Tải lại
              </Button>
              <Button onClick={handleExport} disabled={filteredTransactions.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Xuất CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo sản phẩm, số tham chiếu..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="w-full md:w-64">
              <Select value={transactionType} onValueChange={setTransactionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Loại giao dịch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả loại</SelectItem>
                  <SelectItem value="initialization">Khởi tạo tồn kho</SelectItem>
                  <SelectItem value="adjustment">Điều chỉnh tồn kho</SelectItem>
                  <SelectItem value="goods_receipt">Nhập hàng</SelectItem>
                  <SelectItem value="return">Trả hàng</SelectItem>
                  <SelectItem value="damaged">Hàng hỏng</SelectItem>
                  <SelectItem value="sync">Đồng bộ tồn kho</SelectItem>
                  <SelectItem value="order_processing">Đơn hàng xử lý</SelectItem>
                  <SelectItem value="order_completed">Đơn hàng hoàn thành</SelectItem>
                  <SelectItem value="order_cancelled">Đơn hàng bị hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-32">
              <Select value={perPage} onValueChange={(value) => setPerPage(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Số mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 mục</SelectItem>
                  <SelectItem value="20">20 mục</SelectItem>
                  <SelectItem value="50">50 mục</SelectItem>
                  <SelectItem value="100">100 mục</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Không tìm thấy giao dịch tồn kho nào
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Loại giao dịch</TableHead>
                    <TableHead className="text-right">Số lượng</TableHead>
                    <TableHead className="text-right">Tồn cũ</TableHead>
                    <TableHead className="text-right">Tồn mới</TableHead>
                    <TableHead>Tham chiếu</TableHead>
                    <TableHead>Ghi chú</TableHead>
                    <TableHead>Thời gian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.id}</TableCell>
                      <TableCell>{transaction.product_name || `Sản phẩm #${transaction.product_id}`}</TableCell>
                      <TableCell>{getTransactionTypeDisplay(transaction.type || '')}</TableCell>
                      <TableCell className={`text-right font-medium ${transaction.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.quantity_formatted}
                      </TableCell>
                      <TableCell className="text-right">{transaction.previous_stock}</TableCell>
                      <TableCell className="text-right">{transaction.new_stock}</TableCell>
                      <TableCell>
                        {transaction.reference_id && transaction.reference_type ? (
                          <span>
                            {transaction.reference_type_display} #{transaction.reference_id}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate" title={transaction.notes}>
                          {transaction.notes || "-"}
                        </div>
                      </TableCell>
                      <TableCell>{transaction.created_at_formatted}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {stockTransactionsData && stockTransactionsData.total_pages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setPage(String(Math.max(parseInt(page) - 1, 1)))} 
                      className={parseInt(page) <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {[...Array(stockTransactionsData.total_pages)].map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        isActive={parseInt(page) === i + 1}
                        onClick={() => setPage(String(i + 1))}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setPage(String(Math.min(parseInt(page) + 1, stockTransactionsData.total_pages)))}
                      className={parseInt(page) >= stockTransactionsData.total_pages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
