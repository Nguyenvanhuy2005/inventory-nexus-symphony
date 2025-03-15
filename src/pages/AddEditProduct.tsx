import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useGetProductWithVariations, useCreateProduct, useUpdateProduct, useGetProductCategories } from "@/hooks/api-hooks";
import { Product, ProductVariation } from "@/types/models";
import { ImageIcon, ImagePlus, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { uploadAttachment } from "@/lib/api-utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AddEditProduct() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const isEditMode = !!productId;
  
  const [formData, setFormData] = useState<any>({
    name: "",
    description: "",
    short_description: "",
    regular_price: "",
    sale_price: "",
    stock_quantity: 0,
    manage_stock: false,
    categories: [],
    images: [],
    attributes: []
  });
  
  const [selectedCategories, setSelectedCategories] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const { data: productData, isLoading } = useGetProductWithVariations(productId);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const { data: categoryOptions = [] } = useGetProductCategories();
  
  useEffect(() => {
    if (productData && productData.product) {
      const product = productData.product;
      setFormData({
        name: product.name || "",
        description: product.description || "",
        short_description: product.short_description || "",
        regular_price: product.regular_price || "",
        sale_price: product.sale_price || "",
        stock_quantity: product.stock_quantity || 0,
        manage_stock: product.manage_stock || false,
        categories: product.categories || [],
        images: product.images || [],
        attributes: product.attributes || []
      });
      setSelectedCategories(product.categories || []);
    }
  }, [productData]);
  
  const handleInputChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };
  
  const handleImageUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    
    try {
      const uploadedImage = await uploadAttachment(file);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, uploadedImage]
      }));
      toast.success("Đã tải ảnh lên thành công");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Không thể tải ảnh lên");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  
  const handleCategoryChange = (e: any) => {
    const categoryId = parseInt(e.target.value);
    const category = categoryOptions.find(cat => cat.id === categoryId);
    
    if (e.target.checked) {
      setSelectedCategories(prev => [...prev, category]);
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, category]
      }));
    } else {
      setSelectedCategories(prev => prev.filter(cat => cat.id !== categoryId));
      setFormData(prev => ({
        ...prev,
        categories: prev.categories.filter(cat => cat.id !== categoryId)
      }));
    }
  };
  
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    if (isEditMode) {
      updateProduct.mutate({
        id: parseInt(productId!),
        data: formData
      });
    } else {
      createProduct.mutate(formData);
    }
  };
  
  if (isLoading) {
    return <p>Đang tải dữ liệu...</p>;
  }
  
  return (
    <div className="space-y-6">
      <DashboardHeader 
        title={isEditMode ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
        description="Quản lý thông tin sản phẩm"
      />
      
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Tên sản phẩm</Label>
            <Input 
              type="text" 
              id="name" 
              name="name" 
              value={formData.name} 
              onChange={handleInputChange} 
            />
          </div>
          
          <div>
            <Label htmlFor="description">Mô tả sản phẩm</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>
          
          <div>
            <Label htmlFor="short_description">Mô tả ngắn</Label>
            <Textarea
              id="short_description"
              name="short_description"
              value={formData.short_description}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="regular_price">Giá gốc</Label>
              <Input
                type="number"
                id="regular_price"
                name="regular_price"
                value={formData.regular_price}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <Label htmlFor="sale_price">Giá khuyến mãi</Label>
              <Input
                type="number"
                id="sale_price"
                name="sale_price"
                value={formData.sale_price}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Label htmlFor="manage_stock">Quản lý kho</Label>
            <Switch
              id="manage_stock"
              name="manage_stock"
              checked={formData.manage_stock}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, manage_stock: checked }))}
            />
          </div>
          
          {formData.manage_stock && (
            <div>
              <Label htmlFor="stock_quantity">Số lượng tồn kho</Label>
              <Input
                type="number"
                id="stock_quantity"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleInputChange}
              />
            </div>
          )}
          
          <div>
            <Label>Danh mục sản phẩm</Label>
            <Select 
              onValueChange={value => {
                setFormData(prev => ({
                  ...prev,
                  categories: [...selectedCategories, { id: parseInt(value), name: categoryOptions.find(cat => cat.id.toString() === value)?.name || '' }]
                }));
              }}
              defaultValue=""
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map(category => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Ảnh sản phẩm</Label>
            <div className="flex items-center space-x-4">
              {formData.images.map((image: any) => (
                <Avatar key={image.id}>
                  <AvatarImage src={image.source_url || image.src} alt={image.alt_text || "Product Image"} />
                  <AvatarFallback><ImageIcon /></AvatarFallback>
                </Avatar>
              ))}
              
              <div className="relative">
                <Input
                  type="file"
                  id="image_upload"
                  className="absolute w-full h-full opacity-0 cursor-pointer"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
                <Label
                  htmlFor="image_upload"
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary text-muted-foreground hover:bg-secondary/80 cursor-pointer"
                >
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <ImagePlus className="h-6 w-6" />
                  )}
                </Label>
              </div>
            </div>
            
            {isUploading && (
              <Progress value={uploadProgress} className="mt-2" />
            )}
          </div>
          
          <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
            {createProduct.isPending || updateProduct.isPending ? (
              <>
                Đang xử lý...
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              </>
            ) : (
              isEditMode ? "Cập nhật sản phẩm" : "Tạo sản phẩm"
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
