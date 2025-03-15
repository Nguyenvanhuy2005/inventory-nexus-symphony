
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGetProductWithVariations, useCreateProduct, useUpdateProduct, useGetProductCategories } from "@/hooks/api-hooks";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Loader2, Plus, Trash, Upload } from "lucide-react";
import { toast } from "sonner";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Product, ProductAttribute } from "@/types/models";

// Schema for product form validation
const productSchema = z.object({
  name: z.string().min(1, "Tên sản phẩm là bắt buộc"),
  sku: z.string().optional(),
  type: z.enum(["simple", "variable"]),
  regular_price: z.string().optional(),
  sale_price: z.string().optional(),
  description: z.string().optional(),
  short_description: z.string().optional(),
  stock_quantity: z.coerce.number().int().optional(),
  manage_stock: z.boolean().default(true),
  stock_status: z.enum(["instock", "outofstock"]).default("instock"),
  categories: z.array(z.number()).optional(),
  featured: z.boolean().default(false),
  attributes: z.array(
    z.object({
      name: z.string(),
      options: z.array(z.string()),
      position: z.number(),
      visible: z.boolean(),
      variation: z.boolean(),
    })
  ).optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function AddEditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const productId = isEditing ? parseInt(id) : 0;
  
  const { product, isLoading: isLoadingProduct } = useGetProductWithVariations(productId);
  const { data: categories, isLoading: isLoadingCategories } = useGetProductCategories();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  
  const [productImages, setProductImages] = useState<Array<{id?: number, src: string}>>([]);
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [activeTab, setActiveTab] = useState("general");
  
  // Initialize form with default values or existing product data
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sku: "",
      type: "simple",
      regular_price: "",
      sale_price: "",
      description: "",
      short_description: "",
      stock_quantity: 0,
      manage_stock: true,
      stock_status: "instock",
      categories: [],
      featured: false,
      attributes: [],
    }
  });
  
  // Update form when product data is loaded
  useEffect(() => {
    if (isEditing && product) {
      form.reset({
        name: product.name,
        sku: product.sku || "",
        type: product.type as "simple" | "variable" || "simple",
        regular_price: product.regular_price || "",
        sale_price: product.sale_price || "",
        description: product.description || "",
        short_description: product.short_description || "",
        stock_quantity: product.stock_quantity || 0,
        manage_stock: product.manage_stock || true,
        stock_status: product.stock_status as "instock" | "outofstock" || "instock",
        categories: product.categories?.map(c => c.id) || [],
        featured: product.featured || false,
        attributes: product.attributes as ProductAttribute[] || [],
      });
      
      if (product.images && product.images.length > 0) {
        setProductImages(product.images.map(img => ({
          id: img.id,
          src: img.src
        })));
      }
      
      if (product.attributes && product.attributes.length > 0) {
        setAttributes(product.attributes as ProductAttribute[]);
      }
    }
  }, [product, isEditing, form]);
  
  const onSubmit = async (values: ProductFormValues) => {
    // Prepare product data for API
    const productData: Partial<Product> = {
      ...values,
      images: productImages,
      attributes: attributes.length > 0 ? attributes : undefined,
    };
    
    try {
      if (isEditing && productId) {
        // Update existing product
        await updateProductMutation.mutateAsync({
          id: productId,
          ...productData
        });
        toast.success("Sản phẩm đã được cập nhật thành công");
        navigate(`/inventory/product/${productId}`);
      } else {
        // Create new product
        const newProduct = await createProductMutation.mutateAsync(productData);
        toast.success("Sản phẩm đã được tạo thành công");
        navigate(`/inventory/product/${newProduct.id}`);
      }
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Có lỗi xảy ra khi lưu sản phẩm");
    }
  };
  
  const handleAddImage = () => {
    // In a real app, this would open a file picker and upload the image
    const newImage = {
      src: "https://via.placeholder.com/300"
    };
    setProductImages([...productImages, newImage]);
  };
  
  const handleRemoveImage = (index: number) => {
    const newImages = [...productImages];
    newImages.splice(index, 1);
    setProductImages(newImages);
  };
  
  const handleAddAttribute = () => {
    const newAttribute: ProductAttribute = {
      id: Date.now(),
      name: "",
      options: [""],
      position: attributes.length,
      visible: true,
      variation: false,
    };
    setAttributes([...attributes, newAttribute]);
  };
  
  const handleUpdateAttribute = (index: number, field: keyof ProductAttribute, value: any) => {
    const newAttributes = [...attributes];
    newAttributes[index] = {
      ...newAttributes[index],
      [field]: value
    };
    setAttributes(newAttributes);
  };
  
  const handleAddAttributeOption = (attributeIndex: number) => {
    const newAttributes = [...attributes];
    newAttributes[attributeIndex].options.push("");
    setAttributes(newAttributes);
  };
  
  const handleUpdateAttributeOption = (attributeIndex: number, optionIndex: number, value: string) => {
    const newAttributes = [...attributes];
    newAttributes[attributeIndex].options[optionIndex] = value;
    setAttributes(newAttributes);
  };
  
  const handleRemoveAttributeOption = (attributeIndex: number, optionIndex: number) => {
    const newAttributes = [...attributes];
    newAttributes[attributeIndex].options.splice(optionIndex, 1);
    setAttributes(newAttributes);
  };
  
  const handleRemoveAttribute = (index: number) => {
    const newAttributes = [...attributes];
    newAttributes.splice(index, 1);
    setAttributes(newAttributes);
  };
  
  if (isLoadingProduct && isEditing) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link to="/inventory">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
        </Link>
      </div>

      <DashboardHeader
        title={isEditing ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
        description={isEditing ? "Cập nhật thông tin cho sản phẩm" : "Tạo sản phẩm mới trong hệ thống"}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">Thông tin chung</TabsTrigger>
              <TabsTrigger value="inventory">Tồn kho</TabsTrigger>
              <TabsTrigger value="attributes">Thuộc tính</TabsTrigger>
              <TabsTrigger value="variations">Biến thể</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin cơ bản</CardTitle>
                  <CardDescription>
                    Nhập các thông tin cơ bản của sản phẩm
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên sản phẩm *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập tên sản phẩm" {...field} />
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
                          <Input placeholder="Nhập mã sản phẩm" {...field} />
                        </FormControl>
                        <FormDescription>
                          Mã định danh duy nhất cho sản phẩm
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loại sản phẩm</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn loại sản phẩm" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="simple">Sản phẩm đơn giản</SelectItem>
                            <SelectItem value="variable">Sản phẩm có biến thể</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Sản phẩm đơn giản hoặc sản phẩm có nhiều biến thể
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="regular_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Giá gốc</FormLabel>
                          <FormControl>
                            <Input type="text" placeholder="0" {...field} />
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
                            <Input type="text" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="short_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mô tả ngắn</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Nhập mô tả ngắn"
                            className="min-h-[100px]"
                            {...field}
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
                        <FormLabel>Mô tả chi tiết</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Nhập mô tả chi tiết"
                            className="min-h-[200px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Danh mục</CardTitle>
                  <CardDescription>
                    Chọn danh mục cho sản phẩm
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="categories"
                    render={({ field }) => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel>Danh mục sản phẩm</FormLabel>
                          <FormDescription>
                            Chọn một hoặc nhiều danh mục
                          </FormDescription>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {isLoadingCategories ? (
                            <p>Đang tải danh mục...</p>
                          ) : categories && categories.length > 0 ? (
                            categories.map((category) => (
                              <FormItem
                                key={category.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(category.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        field.onChange([...(field.value || []), category.id]);
                                      } else {
                                        field.onChange(
                                          field.value?.filter((id) => id !== category.id) || []
                                        );
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {category.name}
                                </FormLabel>
                              </FormItem>
                            ))
                          ) : (
                            <p>Không có danh mục nào</p>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Hình ảnh sản phẩm</CardTitle>
                  <CardDescription>
                    Thêm hình ảnh cho sản phẩm
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {productImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image.src}
                            alt={`Sản phẩm ${index + 1}`}
                            className="aspect-square object-cover rounded-md border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveImage(index)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        className="aspect-square flex flex-col items-center justify-center border-dashed"
                        onClick={handleAddImage}
                      >
                        <Upload className="h-6 w-6 mb-2" />
                        <span>Thêm ảnh</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="inventory" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quản lý tồn kho</CardTitle>
                  <CardDescription>
                    Cài đặt cách quản lý tồn kho cho sản phẩm
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="manage_stock"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Quản lý tồn kho</FormLabel>
                          <FormDescription>
                            Cho phép theo dõi số lượng sản phẩm trong kho
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("manage_stock") && (
                    <FormField
                      control={form.control}
                      name="stock_quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Số lượng tồn kho</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>
                            Số lượng sản phẩm hiện có trong kho
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="stock_status"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Trạng thái tồn kho</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="instock" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Còn hàng
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="outofstock" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Hết hàng
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="attributes" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Thuộc tính sản phẩm</CardTitle>
                  <CardDescription>
                    Thêm thuộc tính cho sản phẩm (kích thước, màu sắc, v.v.)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {attributes.map((attribute, index) => (
                    <div key={index} className="space-y-4 border rounded-md p-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Thuộc tính #{index + 1}</h3>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAttribute(index)}
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Xóa
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Tên thuộc tính</label>
                          <Input
                            value={attribute.name}
                            onChange={(e) => handleUpdateAttribute(index, "name", e.target.value)}
                            placeholder="Ví dụ: Màu sắc, Kích thước..."
                          />
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`visible-${index}`}
                              checked={attribute.visible}
                              onCheckedChange={(checked) => handleUpdateAttribute(index, "visible", !!checked)}
                            />
                            <label htmlFor={`visible-${index}`} className="text-sm font-medium">
                              Hiển thị
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`variation-${index}`}
                              checked={attribute.variation}
                              onCheckedChange={(checked) => handleUpdateAttribute(index, "variation", !!checked)}
                            />
                            <label htmlFor={`variation-${index}`} className="text-sm font-medium">
                              Dùng cho biến thể
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Giá trị</label>
                        {attribute.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center space-x-2">
                            <Input
                              value={option}
                              onChange={(e) => handleUpdateAttributeOption(index, optionIndex, e.target.value)}
                              placeholder="Giá trị thuộc tính"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveAttributeOption(index, optionIndex)}
                              disabled={attribute.options.length <= 1}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddAttributeOption(index)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Thêm giá trị
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddAttribute}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm thuộc tính
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="variations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Biến thể sản phẩm</CardTitle>
                  <CardDescription>
                    Quản lý các biến thể của sản phẩm
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {form.watch("type") === "variable" ? (
                    <div className="space-y-4">
                      {attributes.some(attr => attr.variation) ? (
                        <div>
                          <p className="text-sm text-muted-foreground mb-4">
                            Biến thể sẽ được tạo từ các thuộc tính được đánh dấu "Dùng cho biến thể".
                            Vui lòng lưu sản phẩm trước để quản lý các biến thể.
                          </p>
                          
                          {isEditing && (
                            <Button
                              type="button"
                              onClick={() => navigate(`/inventory/product/${productId}`)}
                            >
                              Quản lý biến thể
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-md bg-yellow-50 p-4">
                          <div className="flex">
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-yellow-800">Chưa có thuộc tính</h3>
                              <div className="mt-2 text-sm text-yellow-700">
                                <p>Bạn cần thêm ít nhất một thuộc tính và đánh dấu "Dùng cho biến thể" để tạo biến thể cho sản phẩm.</p>
                              </div>
                              <div className="mt-4">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setActiveTab("attributes")}
                                >
                                  Đi đến phần thuộc tính
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-md bg-blue-50 p-4">
                      <div className="flex">
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800">Sản phẩm đơn giản</h3>
                          <div className="mt-2 text-sm text-blue-700">
                            <p>Sản phẩm đơn giản không có biến thể. Nếu muốn thêm biến thể, hãy chọn loại sản phẩm là "Sản phẩm có biến thể" ở mục Thông tin cơ bản.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/inventory")}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={createProductMutation.isPending || updateProductMutation.isPending}
            >
              {(createProductMutation.isPending || updateProductMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditing ? "Cập nhật sản phẩm" : "Tạo sản phẩm"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
