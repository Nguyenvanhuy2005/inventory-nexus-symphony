
import { useState } from "react";
import { useGetSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from "@/hooks/api-hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Edit, Trash, Phone, Mail, MapPin } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { formatCurrency } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Supplier } from "@/types/models";

// Validation schema for supplier form
const supplierSchema = z.object({
  name: z.string().min(1, "Tên nhà cung cấp không được để trống"),
  phone: z.string().optional(),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  address: z.string().optional(),
  initial_debt: z.coerce.number().default(0),
  current_debt: z.coerce.number().default(0),
  notes: z.string().optional()
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

export default function Suppliers() {
  const { data: suppliers, isLoading } = useGetSuppliers();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  
  // Setup form
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      initial_debt: 0,
      current_debt: 0,
      notes: ""
    }
  });
  
  // Filter suppliers based on search term
  const filteredSuppliers = suppliers?.filter(supplier => {
    return supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           supplier.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase()));
  });
  
  // Open dialog for creating/editing supplier
  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      form.reset({
        name: supplier.name,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        initial_debt: supplier.initial_debt,
        current_debt: supplier.current_debt,
        notes: supplier.notes || ""
      });
    } else {
      setEditingSupplier(null);
      form.reset({
        name: "",
        phone: "",
        email: "",
        address: "",
        initial_debt: 0,
        current_debt: 0,
        notes: ""
      });
    }
    setOpenDialog(true);
  };
  
  // Handle form submission
  const onSubmit = (data: SupplierFormValues) => {
    if (editingSupplier) {
      updateSupplier.mutate({
        id: editingSupplier.id,
        ...data
      });
    } else {
      createSupplier.mutate(data);
    }
    setOpenDialog(false);
  };
  
  // Handle supplier deletion
  const handleDeleteSupplier = (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa nhà cung cấp này?")) {
      deleteSupplier.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Quản lý nhà cung cấp" 
        description="Quản lý thông tin và công nợ của nhà cung cấp"
      />
      
      <Card>
        <div className="p-4">
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
            <Button className="shrink-0" onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm nhà cung cấp
            </Button>
          </div>
          
          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead>Tên nhà cung cấp</TableHead>
                <TableHead>Liên hệ</TableHead>
                <TableHead>Địa chỉ</TableHead>
                <TableHead>Nợ ban đầu</TableHead>
                <TableHead>Nợ hiện tại</TableHead>
                <TableHead>Ghi chú</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    <div className="flex items-center justify-center py-4">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredSuppliers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Không tìm thấy nhà cung cấp nào
                  </TableCell>
                </TableRow>
              ) : (
                filteredSuppliers?.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                          {supplier.phone}
                        </div>
                        {supplier.email && (
                          <div className="flex items-center">
                            <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                            {supplier.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                        {supplier.address || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(supplier.initial_debt.toString())}</TableCell>
                    <TableCell>{formatCurrency(supplier.current_debt.toString())}</TableCell>
                    <TableCell>{supplier.notes || "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(supplier)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteSupplier(supplier.id)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      
      {/* Supplier Form Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? "Cập nhật nhà cung cấp" : "Thêm nhà cung cấp mới"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
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
                  control={form.control}
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
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="initial_debt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nợ ban đầu</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="current_debt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nợ hiện tại</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ghi chú</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                  Hủy
                </Button>
                <Button type="submit">
                  {editingSupplier ? "Cập nhật" : "Tạo mới"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
