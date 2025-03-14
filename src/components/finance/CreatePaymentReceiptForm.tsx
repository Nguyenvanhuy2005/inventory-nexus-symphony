
import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DialogFooter } from "@/components/ui/dialog";
import { useGetSuppliers } from "@/hooks/use-mock-data";
import { useCreatePaymentReceipt } from "@/hooks/api-hooks";
import { getAllCustomers } from "@/lib/woocommerce";
import { Supplier } from "@/types/models";
import { toast } from "sonner";

// Form schema for payment receipt
const formSchema = z.object({
  type: z.enum(["income", "expense"], {
    required_error: "Vui lòng chọn loại phiếu thu chi",
  }),
  entity: z.enum(["customer", "supplier", "other"], {
    required_error: "Vui lòng chọn đối tượng",
  }),
  entity_id: z.string().min(1, "Vui lòng chọn đối tượng"),
  entity_name: z.string().min(1, "Tên đối tượng không được để trống"),
  date: z.string().min(1, "Vui lòng chọn ngày"),
  amount: z.string().min(1, "Vui lòng nhập số tiền"),
  payment_method: z.string().min(1, "Vui lòng chọn phương thức thanh toán"),
  description: z.string().min(1, "Vui lòng nhập lý do"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreatePaymentReceiptFormProps {
  onSuccess: () => void;
}

export default function CreatePaymentReceiptForm({ onSuccess }: CreatePaymentReceiptFormProps) {
  const { data: suppliers = [] } = useGetSuppliers();
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const createMutation = useCreatePaymentReceipt();

  // Load customers
  useEffect(() => {
    const loadCustomers = async () => {
      setIsLoadingCustomers(true);
      try {
        const result = await getAllCustomers();
        setCustomers(result);
      } catch (error) {
        console.error("Error loading customers:", error);
      } finally {
        setIsLoadingCustomers(false);
      }
    };
    
    loadCustomers();
  }, []);

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "income",
      entity: "customer",
      entity_id: "",
      entity_name: "",
      date: new Date().toISOString().split('T')[0],
      amount: "",
      payment_method: "cash",
      description: "",
      notes: ""
    }
  });

  // Watch form values for entity changes
  const formEntity = form.watch("entity");
  const formEntityId = form.watch("entity_id");
  
  // Update entity name when entity and entity_id change
  useEffect(() => {
    if (formEntity === "customer" && formEntityId) {
      const customer = customers.find(c => c.id.toString() === formEntityId);
      if (customer) {
        form.setValue("entity_name", `${customer.first_name} ${customer.last_name}`);
      }
    } else if (formEntity === "supplier" && formEntityId) {
      const supplier = suppliers.find(s => s.id.toString() === formEntityId);
      if (supplier) {
        form.setValue("entity_name", supplier.name);
      }
    } else if (formEntity === "other") {
      form.setValue("entity_name", "");
    }
  }, [formEntity, formEntityId, customers, suppliers, form]);

  // Submit form
  const onSubmit = async (data: FormValues) => {
    try {
      const paymentReceiptData = {
        type: data.type,
        entity: data.entity,
        entity_id: data.entity === "other" ? 0 : parseInt(data.entity_id),
        entity_name: data.entity_name,
        date: data.date,
        amount: parseFloat(data.amount),
        payment_method: data.payment_method,
        description: data.description,
        status: "completed" as const,
        created_by: "Admin", // Default created by
        notes: data.notes
      };
      
      await createMutation.mutateAsync(paymentReceiptData);
      toast.success("Phiếu thu chi đã được tạo thành công");
      onSuccess();
    } catch (error) {
      console.error("Error creating payment receipt:", error);
      toast.error("Không thể tạo phiếu thu chi");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Loại phiếu</FormLabel>
              <FormControl>
                <RadioGroup
                  className="flex space-x-4"
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="income" id="income" />
                    <label htmlFor="income" className="text-sm font-medium">
                      Phiếu thu
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="expense" id="expense" />
                    <label htmlFor="expense" className="text-sm font-medium">
                      Phiếu chi
                    </label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="entity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Đối tượng</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn đối tượng" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="customer">Khách hàng</SelectItem>
                  <SelectItem value="supplier">Nhà cung cấp</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {formEntity === "customer" && (
          <FormField
            control={form.control}
            name="entity_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Khách hàng</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn khách hàng" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingCustomers ? (
                      <SelectItem value="loading" disabled>
                        Đang tải danh sách khách hàng...
                      </SelectItem>
                    ) : customers.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        Không có khách hàng
                      </SelectItem>
                    ) : (
                      customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.first_name} {customer.last_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        {formEntity === "supplier" && (
          <FormField
            control={form.control}
            name="entity_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nhà cung cấp</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn nhà cung cấp" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {suppliers.map((supplier: Supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        {formEntity === "other" && (
          <FormField
            control={form.control}
            name="entity_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tên đối tượng</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nhập tên đối tượng" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ngày</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Số tiền</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    step="1000" 
                    {...field} 
                    placeholder="Nhập số tiền" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="payment_method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phương thức thanh toán</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn phương thức thanh toán" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="cash">Tiền mặt</SelectItem>
                  <SelectItem value="bank_transfer">Chuyển khoản</SelectItem>
                  <SelectItem value="credit_card">Thẻ tín dụng</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lý do</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Nhập lý do thu/chi" />
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
                <Textarea {...field} placeholder="Nhập ghi chú (nếu có)" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <DialogFooter>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Đang lưu..." : "Lưu phiếu thu chi"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
