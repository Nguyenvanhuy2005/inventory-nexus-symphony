
import { useState } from "react";
import { useGetStockAdjustments } from "@/hooks/api";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { exportToCSV } from "@/lib/api/utils";
import { Download, Plus, Loader2 } from "lucide-react";
import StockAdjustmentForm from "@/components/inventory/StockAdjustmentForm";

export default function StockAdjustments() {
  const { data: stockAdjustments, isLoading, refetch } = useGetStockAdjustments();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const handleExport = () => {
    if (stockAdjustments && stockAdjustments.length > 0) {
      exportToCSV('stock-adjustments', stockAdjustments);
    }
  };
  
  const handleSuccess = () => {
    setIsDialogOpen(false);
    refetch();
  };
  
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Điều chỉnh tồn kho"
        description="Tạo và quản lý các điều chỉnh tồn kho"
      />
      
      <div className="flex justify-between items-center">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tạo điều chỉnh
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Tạo điều chỉnh tồn kho</DialogTitle>
              <DialogDescription>
                Điều chỉnh tồn kho sản phẩm trong hệ thống
              </DialogDescription>
            </DialogHeader>
            <StockAdjustmentForm onSuccess={handleSuccess} />
          </DialogContent>
        </Dialog>
        
        <Button variant="outline" onClick={handleExport} disabled={!stockAdjustments || stockAdjustments.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Xuất CSV
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử điều chỉnh</CardTitle>
          <CardDescription>
            Tất cả các điều chỉnh tồn kho thủ công
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !stockAdjustments || stockAdjustments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có điều chỉnh tồn kho nào
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead className="text-right">Tồn cũ</TableHead>
                    <TableHead className="text-right">Thay đổi</TableHead>
                    <TableHead className="text-right">Tồn mới</TableHead>
                    <TableHead>Lý do</TableHead>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Ghi chú</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockAdjustments.map((adjustment) => (
                    <TableRow key={adjustment.id}>
                      <TableCell className="font-medium">{adjustment.id}</TableCell>
                      <TableCell>{adjustment.product_name || `Sản phẩm #${adjustment.product_id}`}</TableCell>
                      <TableCell className="text-right">{adjustment.previous_quantity}</TableCell>
                      <TableCell className={`text-right font-medium ${adjustment.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {adjustment.quantity_change > 0 ? `+${adjustment.quantity_change}` : adjustment.quantity_change}
                      </TableCell>
                      <TableCell className="text-right">{adjustment.new_quantity}</TableCell>
                      <TableCell>{adjustment.reason}</TableCell>
                      <TableCell>{new Date(adjustment.date).toLocaleDateString('vi-VN')}</TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate" title={adjustment.notes}>
                          {adjustment.notes || "-"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
