
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Plus, FileDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useGetGoodsReceipts, useCreateGoodsReceipt } from "@/hooks/api-hooks";
import { useGetSuppliers } from "@/hooks/use-mock-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { exportToCSV } from "@/lib/api-utils";
import CreateGoodsReceiptForm from "@/components/inventory/CreateGoodsReceiptForm";
import { toast } from "sonner";
import GoodsReceiptsTable from "@/components/goods-receipts/GoodsReceiptsTable";
import { GoodsReceipt as GoodsReceiptType } from "@/types/models";

export default function GoodsReceipt() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedReceiptId, setSelectedReceiptId] = useState<number | null>(null);
  
  // Get goods receipts data
  const { data: goodsReceipts = [], isLoading, isError, refetch } = useGetGoodsReceipts();
  
  // Filter goods receipts based on search term
  const filteredReceipts = goodsReceipts.filter(item => 
    item.receipt_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleCreateReceipt = () => {
    // Show dialog for creating new goods receipt
    setOpenDialog(true);
  };

  const handleViewReceipt = (id: number) => {
    setSelectedReceiptId(id);
    // Will handle viewing detailed goods receipt
  };
  
  const handleExportReport = () => {
    if (filteredReceipts.length === 0) {
      toast.error("Không có dữ liệu để xuất báo cáo");
      return;
    }
    
    // Format data for CSV export
    const reportData = filteredReceipts.map(receipt => ({
      'Mã phiếu': receipt.receipt_id,
      'Ngày': receipt.date,
      'Nhà cung cấp': receipt.supplier_name,
      'Tổng tiền': receipt.total_amount,
      'Đã thanh toán': receipt.payment_amount,
      'Còn nợ': receipt.total_amount - receipt.payment_amount,
      'Trạng thái thanh toán': receipt.payment_status === 'paid' ? 'Đã thanh toán' : 
                              receipt.payment_status === 'partial' ? 'Một phần' : 'Chờ thanh toán',
      'Trạng thái': receipt.status === 'completed' ? 'Hoàn thành' : 
                   receipt.status === 'pending' ? 'Chờ xử lý' : 'Đã hủy',
      'Ghi chú': receipt.notes || ''
    }));
    
    // Export to CSV
    exportToCSV('phieu-nhap-hang', reportData);
  };

  // Handle after successful creation
  const handleCreateSuccess = () => {
    setOpenDialog(false);
    refetch();
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
            <Button variant="outline" onClick={handleExportReport}>
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
              <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                  <DialogTitle>Tạo phiếu nhập hàng mới</DialogTitle>
                </DialogHeader>
                <CreateGoodsReceiptForm onSuccess={handleCreateSuccess} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <GoodsReceiptsTable
          goodsReceipts={filteredReceipts as GoodsReceiptType[]}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => navigate(0)}
          onViewReceipt={handleViewReceipt}
        />
      </Card>

      {/* View Receipt Dialog */}
      {selectedReceiptId && (
        <Dialog open={!!selectedReceiptId} onOpenChange={() => setSelectedReceiptId(null)}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Chi tiết phiếu nhập hàng</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-center text-muted-foreground">
                Đang tải chi tiết phiếu nhập hàng...
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
