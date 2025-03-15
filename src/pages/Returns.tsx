
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Plus, FileDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import { useGetReturns } from "@/hooks/api-hooks";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { exportToCSV } from "@/lib/api-utils";
import CreateReturnForm from "@/components/inventory/CreateReturnForm";
import { toast } from "sonner";
import ReturnsTable from "@/components/returns/ReturnsTable";

export default function Returns() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [tab, setTab] = useState("all");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedReturnId, setSelectedReturnId] = useState<number | null>(null);
  
  // Get returns data
  const { data: returns = [], isLoading, isError, refetch } = useGetReturns();
  
  // Filter returns based on search term and tab
  const filteredReturns = returns.filter(item => {
    const matchesSearch = item.return_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.entity_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (tab === "all") return matchesSearch;
    if (tab === "customer") return item.type === "customer" && matchesSearch;
    if (tab === "supplier") return item.type === "supplier" && matchesSearch;
    
    return matchesSearch;
  });
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed':
        return <Badge className="bg-green-500">Hoàn thành</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Chờ xử lý</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500">Đã hủy</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Get type badge
  const getTypeBadge = (type: string) => {
    switch(type) {
      case 'customer':
        return <Badge variant="outline">Khách hàng</Badge>;
      case 'supplier':
        return <Badge variant="outline">Nhà cung cấp</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const handleCreateReturn = () => {
    setOpenDialog(true);
  };

  const handleViewReturn = (id: number) => {
    setSelectedReturnId(id);
  };
  
  const handleExportReport = () => {
    if (filteredReturns.length === 0) {
      toast.error("Không có dữ liệu để xuất báo cáo");
      return;
    }
    
    // Format data for CSV export
    const reportData = filteredReturns.map(item => ({
      'Mã phiếu': item.return_id,
      'Ngày': formatDate(item.date),
      'Loại': item.type === 'customer' ? 'Khách hàng' : 'Nhà cung cấp',
      'Tên đối tác': item.entity_name,
      'Tổng tiền': item.total_amount,
      'Trạng thái': item.status === 'completed' ? 'Hoàn thành' : 
                   item.status === 'pending' ? 'Chờ xử lý' : 'Đã hủy',
      'Lý do': item.reason || '',
      'Ghi chú': item.notes || ''
    }));
    
    // Export to CSV
    exportToCSV('phieu-tra-hang', reportData);
  };

  // Handle after successful creation
  const handleCreateSuccess = () => {
    setOpenDialog(false);
    refetch();
  };
  
  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Quản lý trả hàng" 
        description="Quản lý việc trả hàng từ khách hàng hoặc trả hàng cho nhà cung cấp"
      />
      
      <Card className="p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm phiếu trả hàng..."
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
                <Button onClick={handleCreateReturn}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo phiếu trả hàng
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                  <DialogTitle>Tạo phiếu trả hàng mới</DialogTitle>
                </DialogHeader>
                <CreateReturnForm onSuccess={handleCreateSuccess} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <Tabs defaultValue="all" className="mt-4" value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="customer">Khách hàng</TabsTrigger>
            <TabsTrigger value="supplier">Nhà cung cấp</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            <ReturnsTable 
              returns={filteredReturns} 
              isLoading={isLoading} 
              isError={isError}
              getStatusBadge={getStatusBadge}
              getTypeBadge={getTypeBadge}
              onRetry={() => refetch()}
              onViewReturn={handleViewReturn}
            />
          </TabsContent>
          
          <TabsContent value="customer" className="mt-4">
            <ReturnsTable 
              returns={filteredReturns} 
              isLoading={isLoading} 
              isError={isError}
              getStatusBadge={getStatusBadge}
              getTypeBadge={getTypeBadge}
              onRetry={() => refetch()}
              onViewReturn={handleViewReturn}
            />
          </TabsContent>
          
          <TabsContent value="supplier" className="mt-4">
            <ReturnsTable 
              returns={filteredReturns} 
              isLoading={isLoading} 
              isError={isError}
              getStatusBadge={getStatusBadge}
              getTypeBadge={getTypeBadge}
              onRetry={() => refetch()}
              onViewReturn={handleViewReturn}
            />
          </TabsContent>
        </Tabs>
      </Card>

      {/* View Return Dialog */}
      {selectedReturnId && (
        <Dialog open={!!selectedReturnId} onOpenChange={() => setSelectedReturnId(null)}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Chi tiết phiếu trả hàng</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-center text-muted-foreground">
                Đang tải chi tiết phiếu trả hàng...
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setSelectedReturnId(null)}>Đóng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
