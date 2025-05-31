import React, { useState, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, PaperclipIcon } from 'lucide-react';
import { useCreatePaymentReceiptDB } from '@/hooks/api-hooks';
import { uploadAttachment } from '@/lib/api-utils';

// Form validation schema
const formSchema = z.object({
  entity_type: z.enum(['customer', 'supplier'], {
    required_error: 'Vui lòng chọn đối tượng',
  }),
  entity_id: z.number({
    required_error: 'Vui lòng chọn đối tượng',
  }),
  entity_name: z.string().min(1, {
    message: 'Vui lòng nhập tên đối tượng',
  }),
  date: z.date({
    required_error: 'Vui lòng chọn ngày',
  }),
  amount: z.number({
    required_error: 'Vui lòng nhập số tiền',
  }).positive({
    message: 'Số tiền phải lớn hơn 0',
  }),
  payment_method: z.enum(['cash', 'bank_transfer', 'card', 'other'], {
    required_error: 'Vui lòng chọn phương thức thanh toán',
  }),
  type: z.enum(['income', 'expense'], {
    required_error: 'Vui lòng chọn loại phiếu',
  }),
  notes: z.string().optional(),
  description: z.string().optional(),
  attachment_url: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Props interface
interface CreatePaymentReceiptFormProps {
  entityOptions?: { id: number; name: string }[];
  initialEntity?: 'customer' | 'supplier';
  initialEntityId?: number;
  initialEntityName?: string;
  onSuccess?: () => void;
  initialType?: 'income' | 'expense';
}

export default function CreatePaymentReceiptForm({
  entityOptions = [],
  initialEntity,
  initialEntityId,
  initialEntityName,
  onSuccess,
  initialType = 'income',
}: CreatePaymentReceiptFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Setup form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entity_type: initialEntity || 'customer',
      entity_id: initialEntityId || 0,
      entity_name: initialEntityName || '',
      date: new Date(),
      amount: 0,
      payment_method: 'cash',
      type: initialType,
      notes: '',
      description: '',
      attachment_url: '',
    },
  });
  
  // Create payment receipt mutation
  const { mutate: createPaymentReceipt, isPending } = useCreatePaymentReceiptDB();
  
  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const uploadedFile = await uploadAttachment(file);
      if (uploadedFile && uploadedFile.source_url) {
        form.setValue('attachment_url', uploadedFile.source_url);
        toast.success('Tải lên tệp đính kèm thành công');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Không thể tải lên tệp đính kèm');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle form submission
  const onSubmit = (data: FormValues) => {
    createPaymentReceipt({
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      entity_name: data.entity_name,
      date: format(data.date, 'yyyy-MM-dd'),
      amount: data.amount,
      payment_method: data.payment_method,
      type: data.type,
      description: data.description || '',
      notes: data.notes || '',
      attachment_url: data.attachment_url || '',
      status: 'completed',
      created_by: 'Admin', // TODO: Get from auth context
    }, {
      onSuccess: () => {
        form.reset();
        if (onSuccess) onSuccess();
      }
    });
  };
  
  // Helper to get entity label
  const getEntityLabel = () => {
    return form.watch('entity_type') === 'customer' ? 'Khách hàng' : 'Nhà cung cấp';
  };
  
  // Helper to get receipt type label
  const getReceiptTypeLabel = () => {
    return form.watch('type') === 'income' ? 'Phiếu thu' : 'Phiếu chi';
  };
  
  return (
    <Card className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Receipt Type */}
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
                      <SelectItem value="income">Phiếu thu</SelectItem>
                      <SelectItem value="expense">Phiếu chi</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Entity Type */}
            <FormField
              control={form.control}
              name="entity_type"
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
                      <SelectItem value="customer">Khách hàng</SelectItem>
                      <SelectItem value="supplier">Nhà cung cấp</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Entity Name */}
            <FormField
              control={form.control}
              name="entity_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên {getEntityLabel()}</FormLabel>
                  <FormControl>
                    <Input placeholder={`Nhập tên ${getEntityLabel().toLowerCase()}`} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Date */}
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
                          className="w-full pl-3 text-left font-normal"
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Chọn ngày</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
            
            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số tiền</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Nhập số tiền" 
                      {...field} 
                      onChange={e => field.onChange(parseFloat(e.target.value))} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Payment Method */}
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
                      <SelectItem value="card">Thẻ tín dụng</SelectItem>
                      <SelectItem value="other">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mô tả</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Nhập mô tả" 
                    className="resize-none" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ghi chú</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Nhập ghi chú nội bộ" 
                    className="resize-none" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* File Attachment */}
          <FormField
            control={form.control}
            name="attachment_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tệp đính kèm</FormLabel>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        Đang tải lên...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <PaperclipIcon className="h-4 w-4" />
                        Đính kèm tệp
                      </span>
                    )}
                  </Button>
                  {field.value && (
                    <a 
                      href={field.value} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline"
                    >
                      Xem tệp đã tải lên
                    </a>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            disabled={isPending}
            className="w-full md:w-auto"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Đang xử lý...
              </span>
            ) : (
              `Tạo ${getReceiptTypeLabel()}`
            )}
          </Button>
        </form>
      </Form>
    </Card>
  );
}
