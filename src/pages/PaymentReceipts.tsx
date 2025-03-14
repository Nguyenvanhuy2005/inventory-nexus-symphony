
import { useState } from "react";
import { useGetPaymentReceipts } from "@/hooks/api-hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Download, Eye } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { formatCurrency } from "@/lib/utils";
import { PaymentReceipt } from "@/types/models";

export default function PaymentReceipts() {
  const { data: paymentReceipts, isLoading } = useGetPaymentReceipts();
  const [searchTerm, setSearchTerm] = useState("");
  const [tab, setTab] = useState("all");
  
  // Filter payment receipts based on tab and search term
  const filteredReceipts = paymentReceipts?.filter(receipt => {
    const matchesSearch = 
      receipt.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.description.toLowerCase().includes(searchTerm.toLowerCase());
      
    if (tab === "all") return matchesSearch;
    if (tab === "income") return receipt.type === "income" && matchesSearch;
    if (tab === "expense") return receipt.type === "expense" && matchesSearch;
    return matchesSearch;
  });
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  };
  
  // Get payment method display text
  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash': return 'Tiền mặt';
      case 'bank_transfer': return 'Chuyển khoản';
      case 'credit_card': return 'Thẻ tín dụng';
      default: return 'Khác';
    }
  };
  
  // Get entity type display text
  const getEntityTypeText = (type: string) => {
    switch (type) {
      case 'customer': return 'Khách hàng';
      case 'supplier': return 'Nhà cung cấp';
      default: return 'Khác';
    }
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Hoàn thành</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Đang xử lý</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Đã hủy</Badge>;
      default:
        return <Badge variant="outline">Không xác định</Badge>;
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
            <Button className="shrink-0">
              <Plus className="mr-2 h-4 w-4" />
              Tạo phiếu thu chi
            </Button>
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
                formatDate={formatDate}
                getPaymentMethodText={getPaymentMethodText}
                getEntityTypeText={getEntityTypeText}
                getStatusBadge={getStatusBadge}
              />
            </TabsContent>
            <TabsContent value="income" className="mt-4">
              <PaymentReceiptsTable 
                receipts={filteredReceipts} 
                isLoading={isLoading}
                formatDate={formatDate}
                getPaymentMethodText={getPaymentMethodText}
                getEntityTypeText={getEntityTypeText}
                getStatusBadge={getStatusBadge}
              />
            </TabsContent>
            <TabsContent value="expense" className="mt-4">
              <PaymentReceiptsTable 
                receipts={filteredReceipts} 
                isLoading={isLoading}
                formatDate={formatDate}
                getPaymentMethodText={getPaymentMethodText}
                getEntityTypeText={getEntityTypeText}
                getStatusBadge={getStatusBadge}
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
  formatDate: (date: string) => string;
  getPaymentMethodText: (method: string) => string;
  getEntityTypeText: (type: string) => string;
  getStatusBadge: (status: string) => JSX.Element;
}

function PaymentReceiptsTable({ 
  receipts, 
  isLoading,
  formatDate,
  getPaymentMethodText,
  getEntityTypeText,
  getStatusBadge
}: PaymentReceiptsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Mã phiếu</TableHead>
          <TableHead>Ngày</TableHead>
          <TableHead>Loại</TableHead>
          <TableHead>Đối tượng</TableHead>
          <TableHead>Mô tả</TableHead>
          <TableHead>Số tiền</TableHead>
          <TableHead>Phương thức</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead className="text-right">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center">
              <div className="flex items-center justify-center py-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            </TableCell>
          </TableRow>
        ) : receipts?.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center">
              Không tìm thấy phiếu thu chi nào
            </TableCell>
          </TableRow>
        ) : (
          receipts?.map((receipt) => (
            <TableRow key={receipt.id}>
              <TableCell className="font-medium">PT-{receipt.id}</TableCell>
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
              <TableCell>{receipt.description}</TableCell>
              <TableCell className="font-medium">
                {receipt.type === 'income' ? (
                  <span className="text-green-600">+{formatCurrency(receipt.amount.toString())}</span>
                ) : (
                  <span className="text-red-600">-{formatCurrency(receipt.amount.toString())}</span>
                )}
              </TableCell>
              <TableCell>{getPaymentMethodText(receipt.payment_method)}</TableCell>
              <TableCell>{getStatusBadge(receipt.status)}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
