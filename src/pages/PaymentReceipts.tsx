import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Plus, FileDown, AlertTriangle, Eye, Paperclip } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useGetPaymentReceipts, useGetPaymentReceipt } from "@/hooks/api-hooks";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { exportToCSV } from "@/lib/api-utils";
import CreatePaymentReceiptForm from "@/components/finance/CreatePaymentReceiptForm";
import { toast } from "sonner";
import { PaymentReceipt } from "@/types/models";

export default function PaymentReceipts() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [tab, setTab] = useState("all");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedReceiptId, setSelectedReceiptId] = useState<number | null>(null);
  
  const { data: paymentReceipts = [], isLoading, isError } = useGetPaymentReceipts();
  
  const { 
    data: selectedReceipt, 
    isLoading: isLoadingReceipt 
  } = useGetPaymentReceipt(selectedReceiptId || 0);
  
  const filteredReceipts = paymentReceipts.filter(item => {
    const matchesSearch = (item.receipt_id && item.receipt_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          item.entity_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (tab === "all") return matchesSearch;
    if (tab === "income") return item.type === "income" && matchesSearch;
    if (tab === "expense") return item.type === "expense" && matchesSearch;
    
    return matchesSearch;
  });
  
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
  
  const getEntityBadge = (entityType: string) => {
    switch(entityType) {
      case 'customer':
        return <Badge variant="outline">Khách hàng</Badge>;
      case 'supplier':
        return <Badge variant="outline">Nhà cung cấp</Badge>;
      case 'other':
        return <Badge variant="outline">Khác</Badge>;
      default:
        return <Badge variant="outline">{entityType}</Badge>;
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
    
    const reportData = filteredReceipts.map(item => ({
      'Mã phiếu': item.receipt_id || "",
      'Ngày': formatDate(item.date),
      'Loại': item.type === 'income' ? 'Thu' : 'Chi',
      'Đối tượng': item.entity_type === 'customer' ? 'Khách hàng' : 
                 item.entity_type === 'supplier' ? 'Nhà cung cấp' : 'Khác',
      'Tên': item.entity_name,
      'Số tiền': item.amount,
      'Lý do': item.description || '',
      'Người tạo': item.created_by || '',
      'Ghi chú': item.notes || ''
    }));
    
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

      {selectedReceiptId && (
        <Dialog open={!!selectedReceiptId} onOpenChange={() => setSelectedReceiptId(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Chi tiết phiếu thu chi</DialogTitle>
            </DialogHeader>
            {isLoadingReceipt ? (
              <div className="space-y-4">
                <p className="text-center text-muted-foreground">
                  Đang tải chi tiết phiếu thu chi...
                </p>
              </div>
            ) : selectedReceipt ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Mã phiếu</p>
                    <p>{selectedReceipt.receipt_id || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ngày</p>
                    <p>{formatDate(selectedReceipt.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Loại phiếu</p>
                    <p>{getTypeBadge(selectedReceipt.type)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Đối tượng</p>
                    <p>{getEntityBadge(selectedReceipt.entity_type)} {selectedReceipt.entity_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Số tiền</p>
                    <p className="font-medium">{formatCurrency(selectedReceipt.amount.toString())}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Người tạo</p>
                    <p>{selectedReceipt.created_by}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Lý do</p>
                  <p>{selectedReceipt.description}</p>
                </div>
                
                {selectedReceipt.notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ghi chú</p>
                    <p>{selectedReceipt.notes}</p>
                  </div>
                )}
                
                {selectedReceipt.attachment_url && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Đính kèm</p>
                    <div className="mt-2">
                      {selectedReceipt.attachment_url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                        <img 
                          src={selectedReceipt.attachment_url} 
                          alt="Receipt attachment" 
                          className="max-h-60 rounded-md object-contain"
                        />
                      ) : (
                        <div className="flex items-center p-2 bg-gray-50 rounded-md">
                          <Paperclip className="h-4 w-4 mr-2" />
                          <a 
                            href={selectedReceipt.attachment_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            Xem tập tin đính kèm
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                Không tìm thấy thông tin phiếu thu chi
              </p>
            )}
            <DialogFooter>
              <Button onClick={() => setSelectedReceiptId(null)}>Đóng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface PaymentReceiptsTableProps {
  receipts: PaymentReceipt[];
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
            <TableHead>Đính kèm</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {receipts.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.receipt_id || "-"}</TableCell>
              <TableCell>{formatDate(item.date)}</TableCell>
              <TableCell>{getTypeBadge(item.type)}</TableCell>
              <TableCell>{getEntityBadge(item.entity_type)}</TableCell>
              <TableCell>{item.entity_name}</TableCell>
              <TableCell>{formatCurrency(item.amount.toString())}</TableCell>
              <TableCell>
                {item.attachment_url ? (
                  <Badge variant="outline">
                    <Paperclip className="h-3 w-3 mr-1" />
                    Có
                  </Badge>
                ) : "-"}
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
