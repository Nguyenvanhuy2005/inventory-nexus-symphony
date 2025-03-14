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
import { useGetPaymentReceipts, useCreatePaymentReceipt } from "@/hooks/api-hooks";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { exportToCSV } from "@/lib/api-utils";
import CreatePaymentReceiptForm from "@/components/finance/CreatePaymentReceiptForm";
import { toast } from "sonner";

export default function PaymentReceipts() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [tab, setTab] = useState("all");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedReceiptId, setSelectedReceiptId] = useState<number | null>(null);
  
  // Get payment receipts data
  const { data: paymentReceipts = [], isLoading, isError } = useGetPaymentReceipts();
  
  // Filter payment receipts based on search term and tab
  const filteredReceipts = paymentReceipts.filter(item => {
    const matchesSearch = (item.receipt_id && item.receipt_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          item.entity_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (tab === "all") return matchesSearch;
    if (tab === "income") return item.type === "income" && matchesSearch;
    if (tab === "expense") return item.type === "expense" && matchesSearch;
    
    return matchesSearch;
  });
  
  // Get type badge
  const getTypeBadge = (type: string) => {
    switch(type) {
      case 'income':
        return <Badge className="bg-green-500">Thu</Badge>;
      case 'expense':
        return <Badge className="bg-red-500">Chi</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };
  
  // Get entity type badge
  const getEntityBadge = (entity: string) => {
    switch(entity) {
      case 'customer':
        return <Badge variant="outline">Khách hàng</Badge>;
      case 'supplier':
        return <Badge variant="outline">Nhà cung cấp</Badge>;
      case 'other':
        return <Badge variant="outline">Khác</Badge>;
      default:
        return <Badge variant="outline">{entity}</Badge>;
    }
  };

  const handleCreateReceipt = () => {
    setOpenDialog(true);
  };

  const handleViewReceipt = (id: number) => {
    setSelectedReceiptId(id);
  };
  
  const handleExportReport = () => {
    if (filteredReceipts.length === 0) {
      toast.error("Không có dữ liệu để xuất báo cáo");
      return;
    }
    
    // Format data for CSV export
    const reportData = filteredReceipts.map(item => ({
      'Mã phiếu': item.receipt_id || "",
      'Ngày': formatDate(item.date),
      'Loại': item.type === 'income' ? 'Thu' : 'Chi',
      'Đối tượng': item.entity === 'customer' ? 'Khách hàng' : 
                 item.entity === 'supplier' ? 'Nhà cung cấp' : 'Khác',
      'Tên': item.entity_name,
      'Số tiền': item.amount,
      'Phương thức': item.payment_method === 'cash' ? 'Tiền mặt' : 
                    item.payment_method === 'bank_transfer' ? 'Chuyển khoản' : 
                    item.payment_method === 'credit_card' ? 'Thẻ tín dụng' : 'Khác',
      'Lý do': item.description || '',
      'Người tạo': item.created_by || '',
      'Ghi chú': item.notes || ''
    }));
    
    // Export to CSV
    exportToCSV('phieu-thu-chi', reportData);
  };
  
  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Quản lý thu chi" 
        description="Quản lý các khoản thu và chi của doanh nghiệp"
      />
      
      <Card className="p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportReport}>
              <FileDown className="mr-2 h-4 w-4" />
              Xuất báo cáo
            </Button>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button onClick={handleCreateReceipt}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo phiếu thu chi
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Tạo phiếu thu chi mới</DialogTitle>
                  <DialogDescription>
                    Nhập thông tin phiếu thu chi cho doanh nghiệp
                  </DialogDescription>
                </DialogHeader>
                <CreatePaymentReceiptForm onSuccess={() => setOpenDialog(false)} />
              </DialogContent>
            </Dialog>
          </div>
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
              getTypeBadge={getTypeBadge}
              getEntityBadge={getEntityBadge}
              onRetry={() => navigate(0)}
              onViewReceipt={handleViewReceipt}
            />
          </TabsContent>
          
          <TabsContent value="income" className="mt-4">
            <PaymentReceiptsTable 
              receipts={filteredReceipts} 
              isLoading={isLoading} 
              isError={isError}
              getTypeBadge={getTypeBadge}
              getEntityBadge={getEntityBadge}
              onRetry={() => navigate(0)}
              onViewReceipt={handleViewReceipt}
            />
          </TabsContent>
          
          <TabsContent value="expense" className="mt-4">
            <PaymentReceiptsTable 
              receipts={filteredReceipts} 
              isLoading={isLoading} 
              isError={isError}
              getTypeBadge={getTypeBadge}
              getEntityBadge={getEntityBadge}
              onRetry={() => navigate(0)}
              onViewReceipt={handleViewReceipt}
            />
          </TabsContent>
        </Tabs>
      </Card>

      {/* View Receipt Dialog */}
      {selectedReceiptId && (
        <Dialog open={!!selectedReceiptId} onOpenChange={() => setSelectedReceiptId(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Chi tiết phiếu thu chi</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-center text-muted-foreground">
                Đang tải chi tiết phiếu thu chi...
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setSelectedReceiptId(null)}>Đóng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Table component for Payment Receipts
interface PaymentReceiptsTableProps {
  receipts: any[];
  isLoading: boolean;
  isError: boolean;
  getTypeBadge: (type: string) => JSX.Element;
  getEntityBadge: (entity: string) => JSX.Element;
  onRetry: () => void;
  onViewReceipt: (id: number) => void;
}

function PaymentReceiptsTable({ 
  receipts, 
  isLoading, 
  isError, 
  getTypeBadge, 
  getEntityBadge,
  onRetry,
  onViewReceipt
}: PaymentReceiptsTableProps) {
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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã phiếu</TableHead>
            <TableHead>Ngày</TableHead>
            <TableHead>Loại</TableHead>
            <TableHead>Đối tượng</TableHead>
            <TableHead>Tên</TableHead>
            <TableHead>Số tiền</TableHead>
            <TableHead>Phương thức</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {receipts.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.receipt_id || "-"}</TableCell>
              <TableCell>{formatDate(item.date)}</TableCell>
              <TableCell>{getTypeBadge(item.type)}</TableCell>
              <TableCell>{getEntityBadge(item.entity)}</TableCell>
              <TableCell>{item.entity_name}</TableCell>
              <TableCell>{formatCurrency(item.amount.toString())}</TableCell>
              <TableCell>
                {item.payment_method === 'cash' ? 'Tiền mặt' : 
                 item.payment_method === 'bank_transfer' ? 'Chuyển khoản' : 
                 item.payment_method === 'credit_card' ? 'Thẻ tín dụng' : item.payment_method}
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
