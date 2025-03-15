import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Plus, FileDown, AlertTriangle, Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { 
  useGetSuppliers, 
  useCreateSupplier, 
  useUpdateSupplier, 
  useDeleteSupplier 
} from "@/hooks/api-hooks";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { exportToCSV } from "@/lib/api-utils";
import { toast } from "sonner";
import { Supplier } from "@/types/models";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Form schema for supplier
const supplierFormSchema = z.object({
  name: z.string().min(2, { message: "Tên nhà cung cấp phải có ít nhất 2 ký tự" }),
  contact_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email({ message: "Email không đúng định dạng" }).optional().or(z.literal('')),
  address: z.string().optional(),
  initial_debt: z.coerce.number().default(0),
  notes: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

type SupplierFormValues = z.infer<typeof supplierFormSchema>;

export default function Suppliers() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [deleteSupplierDialog, setDeleteSupplierDialog] = useState<{ open: boolean, supplier: Supplier | null }>({
    open: false,
    supplier: null
  });
  
  // Get suppliers data
  const { data: suppliers = [], isLoading, isError, refetch, error } = useGetSuppliers();
  
  console.log("Suppliers data:", suppliers);
  console.log("API error:", error);
  
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();
  
  // Filter suppliers based on search term
  const filteredSuppliers = suppliers.filter(supplier => 
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.contact_name && supplier.contact_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (supplier.phone && supplier.phone.includes(searchTerm)) ||
    (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Form for create
  const createForm = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: "",
      contact_name: "",
      phone: "",
      email: "",
      address: "",
      initial_debt: 0,
      notes: "",
      status: "active",
    }
  });
  
  // Form for edit
  const editForm = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: "",
      contact_name: "",
      phone: "",
      email: "",
      address: "",
      initial_debt: 0,
      notes: "",
      status: "active",
    }
  });
  
  // Set edit form values when a supplier is selected
  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    editForm.reset({
      name: supplier.name,
      contact_name: supplier.contact_name || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      initial_debt: supplier.initial_debt || 0,
      notes: supplier.notes || "",
      status: supplier.status,
    });
    setOpenEditDialog(true);
  };
  
  // Handle form submission for creating a supplier
  const onCreateSubmit = (data: SupplierFormValues) => {
    createSupplier.mutate({
      ...data,
      total_debt: data.initial_debt, // Initially, total debt is the same as initial debt
      current_debt: data.initial_debt, // Set current debt to initial debt
    }, {
      onSuccess: () => {
        setOpenCreateDialog(false);
        createForm.reset();
        refetch();
      }
    });
  };
  
  // Handle form submission for editing a supplier
  const onEditSubmit = (data: SupplierFormValues) => {
    if (!selectedSupplier) return;
    
    updateSupplier.mutate({
      id: selectedSupplier.id,
      data: {
        ...data,
        // Keep the current_debt and total_debt values unless initial_debt has changed
        current_debt: data.initial_debt !== selectedSupplier.initial_debt ? 
          (selectedSupplier.current_debt || 0) - (selectedSupplier.initial_debt || 0) + data.initial_debt : 
          selectedSupplier.current_debt,
        total_debt: data.initial_debt !== selectedSupplier.initial_debt ? 
          (selectedSupplier.total_debt || 0) - (selectedSupplier.initial_debt || 0) + data.initial_debt : 
          selectedSupplier.total_debt
      }
    }, {
      onSuccess: () => {
        setOpenEditDialog(false);
        setSelectedSupplier(null);
        refetch();
      }
    });
  };
  
  // Handle supplier deletion
  const handleDeleteSupplier = () => {
    if (!deleteSupplierDialog.supplier) return;
    
    deleteSupplier.mutate(deleteSupplierDialog.supplier.id, {
      onSuccess: () => {
        setDeleteSupplierDialog({ open: false, supplier: null });
        refetch();
      }
    });
  };
  
  // Handle export to CSV
  const handleExportCSV = () => {
    if (filteredSuppliers.length === 0) {
      toast.error("Không có dữ liệu để xuất");
      return;
    }
    
    const data = filteredSuppliers.map(supplier => ({
      'Tên nhà cung cấp': supplier.name,
      'Người liên hệ': supplier.contact_name || '',
      'Số điện thoại': supplier.phone || '',
      'Email': supplier.email || '',
      'Địa chỉ': supplier.address || '',
      'Nợ ban đầu': supplier.initial_debt || 0,
      'Nợ hiện tại': supplier.current_debt || 0,
      'Tổng nợ': supplier.total_debt || 0,
      'Trạng thái': supplier.status === 'active' ? 'Đang hoạt động' : 'Ngừng hoạt động',
      'Ghi chú': supplier.notes || ''
    }));
    
    exportToCSV('danh-sach-nha-cung-cap', data);
  };
  
  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Quản lý nhà cung cấp" 
        description="Quản lý thông tin và công nợ của nhà cung cấp"
      />
      
      <Card className="p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm nhà cung cấp..."
              className="pl-8 w-full md:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <FileDown className="mr-2 h-4 w-4" />
              Xuất báo cáo
            </Button>
            <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm nhà cung cấp
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Thêm nhà cung cấp mới</DialogTitle>
                </DialogHeader>
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                    <FormField
                      control={createForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tên nhà cung cấp *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={createForm.control}
                        name="contact_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Người liên hệ</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={createForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Số điện thoại</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={createForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={createForm.control}
                        name="initial_debt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nợ ban đầu</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0"
                                {...field}
                                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={createForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Địa chỉ</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trạng thái</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn trạng thái" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Đang hoạt động</SelectItem>
                              <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
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
                      <Button type="submit" disabled={createSupplier.isPending}>
                        {createSupplier.isPending ? "Đang xử lý..." : "Lưu nhà cung cấp"}
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
              Đã xảy ra lỗi khi tải dữ liệu nhà cung cấp từ API. Vui lòng kiểm tra kết nối đến plugin HMM Custom API.
              {error instanceof Error && <span className="block mt-2 text-xs">{error.message}</span>}
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Thử lại
            </Button>
          </div>
        ) : filteredSuppliers.length > 0 ? (
          <div className="mt-6 rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên nhà cung cấp</TableHead>
                  <TableHead>Liên hệ</TableHead>
                  <TableHead>Địa chỉ</TableHead>
                  <TableHead>Nợ ban đầu</TableHead>
                  <TableHead>Nợ hiện tại</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        {supplier.contact_name && <span>{supplier.contact_name}</span>}
                        {supplier.phone && <span className="text-sm text-muted-foreground">{supplier.phone}</span>}
                        {supplier.email && <span className="text-sm text-muted-foreground">{supplier.email}</span>}
                      </div>
                    </TableCell>
                    <TableCell>{supplier.address || "—"}</TableCell>
                    <TableCell>{formatCurrency((supplier.initial_debt || 0).toString())}</TableCell>
                    <TableCell>{formatCurrency((supplier.current_debt || 0).toString())}</TableCell>
                    <TableCell>{supplier.notes || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                        {supplier.status === 'active' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditSupplier(supplier)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog
                          open={deleteSupplierDialog.open && deleteSupplierDialog.supplier?.id === supplier.id}
                          onOpenChange={(open) => 
                            setDeleteSupplierDialog({ open, supplier: open ? supplier : null })
                          }
                        >
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xác nhận xóa nhà cung cấp</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bạn có chắc chắn muốn xóa nhà cung cấp "{supplier.name}"?
                                Hành động này không thể hoàn tác.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleDeleteSupplier}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {deleteSupplier.isPending ? "Đang xử lý..." : "Xóa"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="mt-8 flex items-center justify-center p-8 border border-dashed rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-medium">Chưa có nhà cung cấp</h3>
              <p className="text-muted-foreground mt-1">
                Tạo nhà cung cấp mới để quản lý thông tin và công nợ
              </p>
            </div>
          </div>
        )}
      </Card>
      
      {/* Edit Supplier Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa nhà cung cấp</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên nhà cung cấp *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Người liên hệ</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số điện thoại</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="initial_debt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nợ ban đầu</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Địa chỉ</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trạng thái</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Đang hoạt động</SelectItem>
                        <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
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
                <Button type="button" variant="outline" onClick={() => setOpenEditDialog(false)}>Hủy</Button>
                <Button type="submit" disabled={updateSupplier.isPending}>
                  {updateSupplier.isPending ? "Đang xử lý..." : "Lưu thay đổi"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
