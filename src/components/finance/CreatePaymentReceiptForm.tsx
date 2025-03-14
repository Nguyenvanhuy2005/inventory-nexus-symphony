
import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Supplier } from "@/types/models";
import { useNavigate } from "react-router-dom";
import { fetchCustomAPI, uploadAttachment } from "@/lib/api-utils";
import { useQuery } from "@tanstack/react-query";

const formSchema = z.object({
  entity: z.enum(["supplier", "customer", "other"]),
  entity_id: z.coerce.number().optional(),
  entity_name: z.string().min(1, {
    message: "Tên đối tác là bắt buộc",
  }),
  date: z.date(),
  type: z.enum(["payment", "receipt"]),
  amount: z.string().min(1, {
    message: "Số tiền là bắt buộc",
  }),
  description: z.string().optional(),
});

export default function CreatePaymentReceiptForm() {
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUploading, setFileUploading] = useState(false);

  // Fetch suppliers data
  const { data: suppliersData, isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      try {
        const data = await fetchCustomAPI("/suppliers");
        return data as Supplier[];
      } catch (error) {
        console.error("Error fetching suppliers:", error);
        return [];
      }
    }
  });

  useEffect(() => {
    if (suppliersData) {
      setSuppliers(suppliersData);
    }
  }, [suppliersData]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entity: "supplier",
      entity_name: "",
      date: new Date(),
      type: "payment",
      amount: "",
      description: "",
    },
  });

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setLoading(true);
    
    try {
      // First, upload the file if one is selected
      let attachmentUrl = '';
      
      if (selectedFile) {
        setFileUploading(true);
        try {
          // Upload now but don't link to entity yet since we don't have the ID
          attachmentUrl = await uploadAttachment(selectedFile, "payment_receipt");
          setFileUploading(false);
        } catch (error) {
          console.error("Error uploading file:", error);
          toast.error("Lỗi khi tải lên tập tin đính kèm");
          setFileUploading(false);
          // Continue without attachment
        }
      }
      
      // Submit the form data to create the payment receipt
      const response = await fetchCustomAPI("/payment-receipts", {
        method: "POST",
        body: {
          entity: data.entity,
          entity_id: data.entity_id || 0,
          entity_name: data.entity_name,
          date: format(data.date, "yyyy-MM-dd HH:mm:ss"),
          type: data.type,
          amount: parseFloat(data.amount),
          payment_method: "cash" as const,
          notes: data.description || "",
          attachment_url: attachmentUrl,
        },
      });
      
      // If we have a file and it was uploaded successfully, now link it to the entity
      if (selectedFile && attachmentUrl && response.id) {
        try {
          await uploadAttachment(selectedFile, "payment_receipt", response.id);
        } catch (error) {
          console.error("Error linking attachment:", error);
          // We already have the attachment URL saved in the receipt, so continue
        }
      }
      
      toast.success(
        data.type === "payment"
          ? "Đã tạo phiếu chi thành công"
          : "Đã tạo phiếu thu thành công"
      );
      
      navigate("/payment-receipts");
    } catch (error) {
      console.error("Error creating payment receipt:", error);
      toast.error("Lỗi khi tạo phiếu thu chi");
    } finally {
      setLoading(false);
    }
  };

  const selectedEntity = form.watch("entity");
  const selectedEntityId = form.watch("entity_id");

  useEffect(() => {
    if (selectedEntity === "supplier" && selectedEntityId) {
      const supplier = suppliers.find((s) => s.id === selectedEntityId);
      if (supplier) {
        form.setValue("entity_name", supplier.name);
      }
    }
  }, [selectedEntity, selectedEntityId, suppliers, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loại phiếu</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại phiếu" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="payment">Phiếu chi</SelectItem>
                    <SelectItem value="receipt">Phiếu thu</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Ngày</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy")
                        ) : (
                          <span>Chọn ngày</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="entity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Đối tượng</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn đối tượng" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="supplier">Nhà cung cấp</SelectItem>
                    <SelectItem value="customer">Khách hàng</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedEntity === "supplier" && (
            <FormField
              control={form.control}
              name="entity_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chọn nhà cung cấp</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString() || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn nhà cung cấp" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingSuppliers ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="ml-2">Đang tải...</span>
                        </div>
                      ) : (
                        suppliers.map((supplier) => (
                          <SelectItem
                            key={supplier.id}
                            value={supplier.id.toString()}
                          >
                            {supplier.name}
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

          {(selectedEntity !== "supplier" ||
            (selectedEntity === "supplier" && !selectedEntityId)) && (
            <FormField
              control={form.control}
              name="entity_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {selectedEntity === "supplier"
                      ? "Tên nhà cung cấp"
                      : selectedEntity === "customer"
                      ? "Tên khách hàng"
                      : "Tên đối tượng"}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tên" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <Card className="bg-accent/50">
          <CardContent className="pt-6">
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số tiền</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nhập số tiền"
                        {...field}
                        type="number"
                        min="0"
                        step="1000"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ghi chú</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Nhập ghi chú cho phiếu thu chi"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Tập tin đính kèm</FormLabel>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    onChange={onFileChange}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    className="max-w-sm"
                  />
                  {selectedFile && (
                    <div className="text-sm text-muted-foreground">
                      {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            className="w-full md:w-auto"
            disabled={loading || fileUploading}
          >
            {(loading || fileUploading) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Plus className="mr-2 h-4 w-4" />
            {form.watch("type") === "payment"
              ? "Tạo phiếu chi"
              : "Tạo phiếu thu"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
