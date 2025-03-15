
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateStockAdjustment } from "@/hooks/api-hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ProductSelectAutoComplete from "./ProductSelectAutoComplete";

const stockAdjustmentSchema = z.object({
  product_id: z.number({
    required_error: "Vui lòng chọn sản phẩm",
  }),
  product_name: z.string().optional(),
  quantity_change: z.number({
    required_error: "Vui lòng nhập số lượng thay đổi",
  }).refine(val => val !== 0, {
    message: "Số lượng thay đổi không thể bằng 0",
  }),
  date: z.date({
    required_error: "Vui lòng chọn ngày",
  }),
  reason: z.string().min(1, "Vui lòng nhập lý do"),
  notes: z.string().optional(),
});

type StockAdjustmentFormValues = z.infer<typeof stockAdjustmentSchema>;

interface StockAdjustmentFormProps {
  onSuccess?: () => void;
}

export default function StockAdjustmentForm({ onSuccess }: StockAdjustmentFormProps) {
  const [selectedProduct, setSelectedProduct] = useState<{ id: number; name: string } | null>(null);
  
  const form = useForm<StockAdjustmentFormValues>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      date: new Date(),
      quantity_change: 0,
      reason: "",
      notes: "",
    },
  });
  
  const { mutate: createStockAdjustment, isPending } = useCreateStockAdjustment();
  
  function onSubmit(data: StockAdjustmentFormValues) {
    if (!selectedProduct) {
      toast.error("Vui lòng chọn sản phẩm");
      return;
    }
    
    createStockAdjustment({
      product_id: data.product_id,
      product_name: selectedProduct.name,
      quantity_change: data.quantity_change,
      date: format(data.date, "yyyy-MM-dd"),
      reason: data.reason,
      notes: data.notes || "",
    }, {
      onSuccess: () => {
        form.reset();
        setSelectedProduct(null);
        if (onSuccess) onSuccess();
      }
    });
  }
  
  const handleProductChange = (product: { id: number; name: string }) => {
    setSelectedProduct(product);
    form.setValue("product_id", product.id);
    form.setValue("product_name", product.name);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="product">Sản phẩm</Label>
            <ProductSelectAutoComplete
              onSelect={handleProductChange}
              selectedProduct={selectedProduct}
            />
            {form.formState.errors.product_id && (
              <p className="text-sm font-medium text-destructive mt-1">
                {form.formState.errors.product_id.message}
              </p>
            )}
          </div>
          
          <FormField
            control={form.control}
            name="quantity_change"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Số lượng thay đổi</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Nhập số dương để tăng, số âm để giảm"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <p className="text-sm text-muted-foreground">
                  Nhập số dương để tăng tồn kho, số âm để giảm tồn kho
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ngày điều chỉnh</FormLabel>
                <FormControl>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "dd/MM/yyyy") : "Chọn ngày"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
                <FormLabel>Lý do điều chỉnh</FormLabel>
                <FormControl>
                  <Input placeholder="Nhập lý do điều chỉnh tồn kho" {...field} />
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
                  <Textarea 
                    placeholder="Nhập ghi chú thêm (không bắt buộc)" 
                    {...field} 
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Tạo điều chỉnh tồn kho
        </Button>
      </form>
    </Form>
  );
}
