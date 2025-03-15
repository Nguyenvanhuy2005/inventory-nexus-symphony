import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2 } from 'lucide-react';

import { useGetProductWithVariations, useUpdateProduct, useCreateProduct, useGetProductCategories } from '@/hooks/api-hooks';
import { Product, ProductVariation } from '@/types/models';

// Define the form schema using Zod
const productFormSchema = z.object({
  name: z.string().min(2, {
    message: "Tên sản phẩm phải có ít nhất 2 ký tự.",
  }),
  sku: z.string().optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, {
    message: "Giá phải là một số hợp lệ.",
  }),
  regular_price: z.string().regex(/^\d+(\.\d{1,2})?$/, {
    message: "Giá gốc phải là một số hợp lệ.",
  }).optional(),
  sale_price: z.string().regex(/^\d+(\.\d{1,2})?$/, {
    message: "Giá khuyến mãi phải là một số hợp lệ.",
  }).optional(),
  stock_quantity: z.number().optional(),
  stock_status: z.string().optional(),
  description: z.string().optional(),
  short_description: z.string().optional(),
  categories: z.array(z.string()).optional(),
  manage_stock: z.boolean().default(false),
  featured: z.boolean().default(false),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function AddEditProduct() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch product data with variations
  const productWithVariations = useGetProductWithVariations(productId);
  const productData = productWithVariations?.data?.product || null;

  // Fetch product categories
  const { data: categoriesData } = useGetProductCategories();
  const categories = categoriesData || [];

  // Initialize form with react-hook-form
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: productData?.name || "",
      sku: productData?.sku || "",
      price: productData?.price || "",
      regular_price: productData?.regular_price || "",
      sale_price: productData?.sale_price || "",
      stock_quantity: productData?.stock_quantity || 0,
      stock_status: productData?.stock_status || "instock",
      description: productData?.description || "",
      short_description: productData?.short_description || "",
      categories: productData?.categories?.map(cat => cat.id.toString()) || [],
      manage_stock: productData?.manage_stock || false,
      featured: productData?.featured || false,
    },
    mode: "onChange",
  });

  // Update form default values when product data changes
  useEffect(() => {
    if (productData) {
      form.reset({
        name: productData.name || "",
        sku: productData.sku || "",
        price: productData.price || "",
        regular_price: productData.regular_price || "",
        sale_price: productData.sale_price || "",
        stock_quantity: productData.stock_quantity || 0,
        stock_status: productData.stock_status || "instock",
        description: productData.description || "",
        short_description: productData.short_description || "",
        categories: productData.categories?.map(cat => cat.id.toString()) || [],
        manage_stock: productData.manage_stock || false,
        featured: productData.featured || false,
      });
    }
  }, [productData, form]);

  // Access the updateProduct and createProduct mutations
  const updateProduct = useUpdateProduct();
  const createProduct = useCreateProduct();

  // Handle form submission
  const handleSubmit = async (data: ProductFormValues) => {
    try {
      setIsSubmitting(true);
    
      // Prepare the data for API
      const productData = {
        name: data.name,
        sku: data.sku,
        price: data.price,
        regular_price: data.regular_price,
        sale_price: data.sale_price,
        stock_quantity: data.stock_quantity,
        stock_status: data.stock_status,
        description: data.description,
        short_description: data.short_description,
        categories: data.categories ? data.categories.map(catId => parseInt(catId)) : [],
        manage_stock: data.manage_stock,
        featured: data.featured,
      };
    
      if (productId) {
        // Update existing product
        await updateProduct.mutateAsync({ 
          id: parseInt(productId as string),
          data: productData  // Make sure to use the 'data' property here
        });
        navigate(`/products/${productId}`);
      } else {
        // Create new product
        const result = await createProduct.mutateAsync(productData);
        navigate(`/products/${result.id}`);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Có lỗi xảy ra khi lưu sản phẩm');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>{productId ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</CardTitle>
          <CardDescription>Nhập thông tin chi tiết về sản phẩm.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên sản phẩm</FormLabel>
                    <FormControl>
                      <Input placeholder="Ví dụ: Gạch ốp lát cao cấp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mã sản phẩm (SKU)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ví dụ: GLCC-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giá bán</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="Ví dụ: 250000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="regular_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giá gốc</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="Ví dụ: 300000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sale_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giá khuyến mãi</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="Ví dụ: 200000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stock_quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số lượng tồn kho</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ví dụ: 100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả sản phẩm</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Mô tả chi tiết về sản phẩm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="short_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả ngắn</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Mô tả ngắn gọn về sản phẩm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Danh mục sản phẩm</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange([value])}
                      defaultValue={field.value?.[0]}
                      multiple
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn danh mục" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center space-x-2">
                <FormField
                  control={form.control}
                  name="manage_stock"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Quản lý kho</FormLabel>
                        <FormDescription>Cho phép quản lý số lượng tồn kho.</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Sản phẩm nổi bật</FormLabel>
                        <FormDescription>Hiển thị sản phẩm trên trang chủ.</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <CardFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {productId ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
