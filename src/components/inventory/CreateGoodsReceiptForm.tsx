
import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import { useGetSuppliers } from "@/hooks/use-mock-data";
import { useCreateGoodsReceipt } from "@/hooks/api-hooks";
import { searchProducts, normalizeProduct, getProductVariations, normalizeVariation } from "@/lib/woocommerce";
import { Supplier } from "@/types/models";
import { Product, Variation } from "@/lib/woocommerce";

// Form schema for goods receipt
const formSchema = z.object({
  supplier_id: z.string().min(1, "Vui lòng chọn nhà cung cấp"),
  date: z.string().min(1, "Vui lòng chọn ngày"),
  payment_amount: z.string().optional(),
  payment_method: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      product_id: z.number().min(1, "Vui lòng chọn sản phẩm"),
      variation_id: z.number().optional(),
      name: z.string().min(1, "Tên sản phẩm không được để trống"),
      sku: z.string().optional(),
      quantity: z.number().min(1, "Số lượng tối thiểu là 1"),
      price: z.number().min(0, "Giá không được âm"),
      subtotal: z.number().min(0, "Thành tiền không được âm")
    })
  ).min(1, "Cần có ít nhất một sản phẩm")
});

type FormValues = z.infer<typeof formSchema>;

interface CreateGoodsReceiptFormProps {
  onSuccess: () => void;
}

export default function CreateGoodsReceiptForm({ onSuccess }: CreateGoodsReceiptFormProps) {
  const { data: suppliers = [] } = useGetSuppliers();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedVariations, setSelectedVariations] = useState<{[key: number]: Variation[]}>({});
  const createMutation = useCreateGoodsReceipt();

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      payment_amount: "0",
      payment_method: "cash",
      items: [{ 
        product_id: 0, 
        name: "", 
        sku: "", 
        quantity: 1, 
        price: 0, 
        subtotal: 0 
      }]
    }
  });

  // Watch form values for calculations
  const formValues = form.watch();
  
  // Calculate total amount
  const totalAmount = formValues.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);

  // Handle product search
  const handleSearch = async (term: string) => {
    if (term.length < 2) return;
    
    setIsSearching(true);
    try {
      const results = await searchProducts(term);
      const normalizedResults = results.map(normalizeProduct);
      setSearchResults(normalizedResults);
    } catch (error) {
      console.error("Error searching products:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        handleSearch(searchTerm);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load variations when a variable product is selected
  const loadVariations = async (productId: number) => {
    try {
      const variations = await getProductVariations(productId);
      const normalizedVariations = variations.map(normalizeVariation);
      setSelectedVariations(prev => ({
        ...prev,
        [productId]: normalizedVariations
      }));
    } catch (error) {
      console.error("Error loading variations:", error);
    }
  };

  // Add item to form
  const addItem = () => {
    const currentItems = form.getValues("items");
    form.setValue("items", [
      ...currentItems,
      { product_id: 0, name: "", sku: "", quantity: 1, price: 0, subtotal: 0 }
    ]);
  };

  // Remove item from form
  const removeItem = (index: number) => {
    const currentItems = form.getValues("items");
    if (currentItems.length > 1) {
      form.setValue("items", currentItems.filter((_, i) => i !== index));
    }
  };

  // Handle product selection
  const handleSelectProduct = (index: number, product: Product) => {
    const items = form.getValues("items");
    items[index] = {
      ...items[index],
      product_id: product.id,
      name: product.name,
      sku: product.sku || "",
      price: parseFloat(product.price) || 0,
      subtotal: (items[index].quantity || 1) * (parseFloat(product.price) || 0)
    };
    form.setValue("items", items);
    
    // Load variations if this is a variable product
    if (product.type === "variable") {
      loadVariations(product.id);
    }
  };

  // Handle variation selection
  const handleSelectVariation = (index: number, variation: Variation) => {
    const items = form.getValues("items");
    items[index] = {
      ...items[index],
      variation_id: variation.id,
      name: `${items[index].name} - ${variation.attributes.map(attr => attr.option).join(", ")}`,
      sku: variation.sku || items[index].sku,
      price: parseFloat(variation.price) || items[index].price,
      subtotal: (items[index].quantity || 1) * (parseFloat(variation.price) || items[index].price)
    };
    form.setValue("items", items);
  };

  // Update subtotal when quantity or price changes
  const updateSubtotal = (index: number) => {
    const items = form.getValues("items");
    const quantity = items[index].quantity || 0;
    const price = items[index].price || 0;
    items[index].subtotal = quantity * price;
    form.setValue("items", items);
  };

  // Submit form
  const onSubmit = async (data: FormValues) => {
    // Find supplier name
    const supplier = suppliers.find(s => s.id.toString() === data.supplier_id);
    
    // Prepare data for API
    const goodsReceiptData = {
      supplier_id: parseInt(data.supplier_id),
      supplier_name: supplier?.name || "",
      date: data.date,
      total_amount: totalAmount,
      payment_amount: parseFloat(data.payment_amount || "0"),
      payment_method: data.payment_method,
      payment_status: totalAmount <= parseFloat(data.payment_amount || "0") ? "paid" : 
                     parseFloat(data.payment_amount || "0") > 0 ? "partial" : "pending",
      status: "completed",
      notes: data.notes,
      items: data.items.map(item => ({
        product_id: item.product_id,
        variation_id: item.variation_id || 0,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      }))
    };
    
    try {
      await createMutation.mutateAsync(goodsReceiptData);
      onSuccess();
    } catch (error) {
      console.error("Error creating goods receipt:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="supplier_id"
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
          
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ngày nhập</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Danh sách sản phẩm</h3>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" /> Thêm sản phẩm
            </Button>
          </div>
          
          {form.getValues("items").map((item, index) => (
            <Card key={index} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <FormLabel>Sản phẩm</FormLabel>
                  <div className="relative">
                    <Input
                      placeholder="Tìm sản phẩm..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm.length > 1 && (
                      <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md max-h-48 overflow-auto border">
                        {isSearching ? (
                          <div className="p-2 text-center">Đang tìm...</div>
                        ) : searchResults.length === 0 ? (
                          <div className="p-2 text-center">Không tìm thấy sản phẩm</div>
                        ) : (
                          searchResults.map(product => (
                            <div
                              key={product.id}
                              className="p-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => {
                                handleSelectProduct(index, product);
                                setSearchTerm("");
                              }}
                            >
                              <div className="flex items-center gap-2">
                                {product.images[0] && (
                                  <img
                                    src={product.images[0].src}
                                    alt={product.name}
                                    className="h-8 w-8 rounded object-cover"
                                  />
                                )}
                                <div>
                                  <div>{product.name}</div>
                                  <div className="text-sm text-gray-500">
                                    {product.sku ? `SKU: ${product.sku}` : ""} 
                                    {product.type === "variable" ? " (Có biến thể)" : ""}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  {item.product_id > 0 && (
                    <div className="mt-2 text-sm">
                      Đã chọn: <span className="font-medium">{item.name}</span>
                    </div>
                  )}
                </div>
                
                {item.product_id > 0 && selectedVariations[item.product_id] && (
                  <div>
                    <FormLabel>Biến thể</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const variation = selectedVariations[item.product_id].find(v => v.id === parseInt(value));
                        if (variation) {
                          handleSelectVariation(index, variation);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn biến thể" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedVariations[item.product_id].map(variation => (
                          <SelectItem key={variation.id} value={variation.id.toString()}>
                            {variation.attributes.map(attr => attr.option).join(", ")} - {variation.price}đ
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name={`items.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số lượng</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => {
                            field.onChange(parseInt(e.target.value) || 1);
                            updateSubtotal(index);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name={`items.${index}.price`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giá nhập</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => {
                            field.onChange(parseFloat(e.target.value) || 0);
                            updateSubtotal(index);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name={`items.${index}.subtotal`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thành tiền</FormLabel>
                      <FormControl>
                        <Input
                          readOnly
                          value={field.value.toLocaleString('vi-VN')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {form.getValues("items").length > 1 && (
                <div className="flex justify-end mt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Xóa
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
        
        <Separator />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="payment_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Số tiền thanh toán</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="payment_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phương thức thanh toán</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn phương thức" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="cash">Tiền mặt</SelectItem>
                    <SelectItem value="bank_transfer">Chuyển khoản</SelectItem>
                    <SelectItem value="credit">Ghi nợ</SelectItem>
                  </SelectContent>
                </Select>
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
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-between items-center">
          <div className="text-lg font-medium">
            Tổng tiền: <span className="text-primary">{totalAmount.toLocaleString('vi-VN')}đ</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {parseFloat(formValues.payment_amount || "0") >= totalAmount ? 
              "Đã thanh toán đủ" : 
              `Còn nợ: ${(totalAmount - parseFloat(formValues.payment_amount || "0")).toLocaleString('vi-VN')}đ`}
          </div>
        </div>
        
        <DialogFooter>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Đang lưu..." : "Lưu phiếu nhập hàng"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
