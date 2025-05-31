
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Plus, FileDown, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { useGetDamagedStock, useCreateDamagedStock } from "@/hooks/api-hooks";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { getAllProducts } from "@/lib/woocommerce";
import { exportToCSV } from "@/lib/api-utils";

// Form schema for damaged stock report
const damagedStockSchema = z.object({
  product_id: z.number().min(1, "Vui lòng chọn sản phẩm"),
  quantity: z.number().min(1, "Số lượng phải lớn hơn 0"),
  reason: z.string().min(3, "Vui lòng nhập lý do"),
  estimated_loss: z.number().min(0, "Giá trị thiệt hại không được âm"),
  notes: z.string().optional(),
});

type DamagedStockFormValues = z.infer<typeof damagedStockSchema>;

export default function DamagedStock() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  
  // Get damaged stock data
  const { data: damagedStockItems = [], isLoading, isError, refetch } = useGetDamagedStock();
  const createDamagedStock = useCreateDamagedStock();

  // Fetch products data
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const data = await getAllProducts({ per_page: "100" });
      console.log("Fetched products:", data);
      return data;
    }
  });
  
  // Filter damaged stock items based on search term
  const filteredItems = damagedStockItems.filter(item => 
    item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.damage_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Setup form
  const form = useForm<DamagedStockFormValues>({
    resolver: zodResolver(damagedStockSchema),
    defaultValues: {
      product_id: 0,
      quantity: 1,
      reason: "",
      estimated_loss: 0,
      notes: "",
    }
  });
  
  // Handle form submission
  const onSubmit = (data: DamagedStockFormValues) => {
    const selectedProduct = products.find(p => p.id === data.product_id);
    
    if (!selectedProduct) {
      toast.error("Không thể tìm thấy sản phẩm đã chọn");
      return;
    }
    
    const newDamagedStock = {
      product_id: data.product_id,
      product_name: selectedProduct.name,
      quantity: data.quantity,
      reason: data.reason,
      estimated_loss: data.estimated_loss,
      notes: data.notes || "",
      date: new Date().toISOString()
    };
    
    createDamagedStock.mutate(newDamagedStock, {
      onSuccess: () => {
        setOpenDialog(false);
        form.reset();
      }
    });
  };

  const handleExportReport = () => {
    if (filteredItems.length === 0) {
      toast.error("Không có dữ liệu để xuất báo cáo");
      return;
    }
    
    // Format data for CSV export
    const reportData = filteredItems.map(item => ({
      'Mã báo cáo': item.damage_id,
      'Ngày': formatDate(item.date),
      'Sản phẩm': item.product_name,
      'Số lượng': item.quantity,
      'Lý do': item.reason,
      'Thiệt hại ước tính': item.estimated_loss,
      'Trạng thái': item.status === 'reported' ? 'Đã báo cáo' : 
                   item.status === 'processed' ? 'Đã xử lý' : 'Đã xóa khỏi kho',
      'Ghi chú': item.notes || ''
    }));
    
    // Export to CSV
    exportToCSV('bao-cao-hang-hong', reportData);
  };
  
  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Quản lý hàng hỏng" 
        description="Theo dõi sản phẩm bị hỏng, giảm tồn kho tương ứng"
      />
      
      <Card className="p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm báo cáo hàng hỏng..."
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
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Báo cáo hàng hỏng
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Báo cáo hàng hỏng mới</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="product_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sản phẩm</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(Number(value))}
                            defaultValue={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn sản phẩm" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-80">
                              {isLoadingProducts ? (
                                <div className="flex items-center justify-center p-4">
                                  <p>Đang tải sản phẩm...</p>
                                </div>
                              ) : products.length > 0 ? (
                                products.map((product) => (
                                  <SelectItem key={product.id} value={product.id.toString()}>
                                    {product.name} {product.sku ? `(${product.sku})` : ''}
                                  </SelectItem>
                                ))
                              ) : (
                                <div className="flex items-center justify-center p-4">
                                  <p>Không có sản phẩm nào</p>
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Số lượng</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lý do</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estimated_loss"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Thiệt hại ước tính (VND)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ghi chú</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button type="submit" disabled={createDamagedStock.isPending}>
                        {createDamagedStock.isPending ? "Đang xử lý..." : "Lưu báo cáo"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
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
              Đã xảy ra lỗi khi tải dữ liệu hàng hỏng từ API. Vui lòng kiểm tra kết nối đến plugin HMM API Bridge.
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Thử lại
            </Button>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="mt-6 rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã báo cáo</TableHead>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Số lượng</TableHead>
                  <TableHead>Lý do</TableHead>
                  <TableHead>Thiệt hại ước tính</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.damage_id}</TableCell>
                    <TableCell>{formatDate(item.date)}</TableCell>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.reason}</TableCell>
                    <TableCell>{item.estimated_loss?.toLocaleString('vi-VN')} VND</TableCell>
                    <TableCell>
                      {item.status === 'reported' ? 'Đã báo cáo' : 
                       item.status === 'processed' ? 'Đã xử lý' : 'Đã xóa khỏi kho'}
                    </TableCell>
                    <TableCell>{item.notes || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="mt-8 flex items-center justify-center p-8 border border-dashed rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-medium">Chưa có báo cáo hàng hỏng</h3>
              <p className="text-muted-foreground mt-1">
                Tạo báo cáo hàng hỏng mới để theo dõi sản phẩm bị hỏng và cập nhật tồn kho
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
