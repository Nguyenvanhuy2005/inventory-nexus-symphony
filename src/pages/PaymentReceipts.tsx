
import { useState } from "react";
import { useGetPaymentReceipts, useCreatePaymentReceipt } from "@/hooks/api-hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Download, Eye, AlertTriangle } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PaymentReceipt } from "@/types/models";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function PaymentReceipts() {
  const { data: paymentReceipts = [], isLoading, isError } = useGetPaymentReceipts();
  const [searchTerm, setSearchTerm] = useState("");
  const [tab, setTab] = useState("all");
  const [openDialog, setOpenDialog] = useState(false);
  
  // Filter payment receipts based on tab and search term
  const filteredReceipts = paymentReceipts?.filter(receipt => {
    const matchesSearch = 
      receipt.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (receipt.receipt_id && receipt.receipt_id.toLowerCase().includes(searchTerm.toLowerCase()));
      
    if (tab === "all") return matchesSearch;
    if (tab === "income") return receipt.type === "income" && matchesSearch;
    if (tab === "expense") return receipt.type === "expense" && matchesSearch;
    return matchesSearch;
  });

  const handleCreateReceipt = () => {
    setOpenDialog(true);
  };

  const handleViewReceipt = (id: number) => {
    toast.info(`Xem chi tiết phiếu thu chi #${id}`);
    // Sẽ xử lý xem chi tiết phiếu thu chi
  };
  
  // Get payment method display text
  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash': return 'Tiền mặt';
      case 'bank_transfer': return 'Chuyển khoản';
      case 'credit_card': return 'Thẻ tín dụng';
      default: return method || 'Khác';
    }
  };
  
  // Get entity type display text
  const getEntityTypeText = (type: string) => {
    switch (type) {
      case 'customer': return 'Khách hàng';
      case 'supplier': return 'Nhà cung cấp';
      default: return type || 'Khác';
    }
  };
  
  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Quản lý thu chi" 
        description="Quản lý các khoản thu và chi của doanh nghiệp"
      />
      
      <Card>
        <div className="p-4">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Tìm phiếu thu chi..."
                  className="pl-8 w-full md:w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button className="shrink-0" onClick={handleCreateReceipt}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo phiếu thu chi
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                  <DialogTitle>Tạo phiếu thu chi mới</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-center text-muted-foreground">
                    Chức năng tạo phiếu thu chi đang được phát triển và sẽ sẵn sàng trong phiên bản tiếp theo.
                  </p>
                </div>
                <DialogFooter>
                  <Button onClick={() => setOpenDialog(false)}>Đóng</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <Tabs defaultValue="all" className="mt-4" value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all">Tất cả</TabsTrigger>
              <TabsTrigger value="income">Phiếu thu</TabsTrigger>
              <TabsTrigger value="expense">Phiếu chi</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              <PaymentReceiptsTable 
                receipts={filteredReceipts} 
                isLoading={isLoading}
                isError={isError}
                getPaymentMethodText={getPaymentMethodText}
                getEntityTypeText={getEntityTypeText}
                onViewReceipt={handleViewReceipt}
              />
            </TabsContent>
            <TabsContent value="income" className="mt-4">
              <PaymentReceiptsTable 
                receipts={filteredReceipts} 
                isLoading={isLoading}
                isError={isError}
                getPaymentMethodText={getPaymentMethodText}
                getEntityTypeText={getEntityTypeText}
                onViewReceipt={handleViewReceipt}
              />
            </TabsContent>
            <TabsContent value="expense" className="mt-4">
              <PaymentReceiptsTable 
                receipts={filteredReceipts} 
                isLoading={isLoading}
                isError={isError}
                getPaymentMethodText={getPaymentMethodText}
                getEntityTypeText={getEntityTypeText}
                onViewReceipt={handleViewReceipt}
              />
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
}

interface PaymentReceiptsTableProps {
  receipts: PaymentReceipt[] | undefined;
  isLoading: boolean;
  isError: boolean;
  getPaymentMethodText: (method: string) => string;
  getEntityTypeText: (type: string) => string;
  onViewReceipt: (id: number) => void;
}

function PaymentReceiptsTable({ 
  receipts, 
  isLoading,
  isError,
  getPaymentMethodText,
  getEntityTypeText,
  onViewReceipt
}: PaymentReceiptsTableProps) {
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
          Đã xảy ra lỗi khi tải dữ liệu thu chi từ API. Vui lòng kiểm tra kết nối đến plugin HMM Custom API.
        </p>
      </div>
    );
  }
  
  if (!receipts || receipts.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 border border-dashed rounded-lg">
        <div className="text-center">
          <h3 className="text-lg font-medium">Chưa có phiếu thu chi</h3>
          <p className="text-muted-foreground mt-1">
            Tạo phiếu thu chi mới để quản lý các khoản thu và chi
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Mã phiếu</TableHead>
          <TableHead>Ngày</TableHead>
          <TableHead>Loại</TableHead>
          <TableHead>Đối tượng</TableHead>
          <TableHead>Ghi chú</TableHead>
          <TableHead>Số tiền</TableHead>
          <TableHead>Phương thức</TableHead>
          <TableHead className="text-right">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {receipts?.map((receipt) => (
          <TableRow key={receipt.id}>
            <TableCell className="font-medium">{receipt.receipt_id || `PR-${receipt.id}`}</TableCell>
            <TableCell>{formatDate(receipt.date)}</TableCell>
            <TableCell>
              {receipt.type === 'income' ? (
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Thu</Badge>
              ) : (
                <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Chi</Badge>
              )}
            </TableCell>
            <TableCell>
              <div>
                <div>{receipt.entity_name}</div>
                <div className="text-xs text-muted-foreground">{getEntityTypeText(receipt.entity)}</div>
              </div>
            </TableCell>
            <TableCell>{receipt.notes || '—'}</TableCell>
            <TableCell className="font-medium">
              {receipt.type === 'income' ? (
                <span className="text-green-600">+{formatCurrency(receipt.amount.toString())}</span>
              ) : (
                <span className="text-red-600">-{formatCurrency(receipt.amount.toString())}</span>
              )}
            </TableCell>
            <TableCell>{getPaymentMethodText(receipt.payment_method)}</TableCell>
            <TableCell className="text-right">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => onViewReceipt(receipt.id)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
