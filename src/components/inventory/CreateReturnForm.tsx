
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
import { Card } from "@/components/ui/card";
import { DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import { useGetSuppliers } from "@/hooks/use-mock-data";
import { useCreateReturn } from "@/hooks/api-hooks";
import { searchProducts, normalizeProduct, getProductVariations, normalizeVariation } from "@/lib/woocommerce";
import { Supplier } from "@/types/models";
import { Product, Variation } from "@/lib/woocommerce";
import { getAllCustomers } from "@/lib/woocommerce";

// Form schema for returns
const formSchema = z.object({
  type: z.enum(["customer", "supplier"], {
    required_error: "Vui lòng chọn loại phiếu trả hàng",
  }),
  entity_id: z.string().min(1, "Vui lòng chọn đối tác"),
  date: z.string().min(1, "Vui lòng chọn ngày"),
  reason: z.string().min(1, "Vui lòng nhập lý do trả hàng"),
  payment_amount: z.string().optional(),
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

interface CreateReturnFormProps {
  onSuccess: () => void;
}

export default function CreateReturnForm({ onSuccess }: CreateReturnFormProps) {
  const { data: suppliers = [] } = useGetSuppliers();
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedVariations, setSelectedVariations] = useState<{[key: number]: Variation[]}>({});
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const createMutation = useCreateReturn();

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
      type: "customer",
      date: new Date().toISOString().split('T')[0],
      reason: "",
      payment_amount: "0",
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
  const formType = form.watch("type");
  
  // Calculate total amount
  const totalAmount = formValues.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);

  // Generate return_id
  const generateReturnId = () => {
    return `RT-${Math.floor(Date.now() / 1000)}`;
  };

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
    // Find entity name based on type and id
    let entityName = "";
    if (data.type === "supplier") {
      const supplier = suppliers.find(s => s.id.toString() === data.entity_id);
      entityName = supplier?.name || "";
    } else {
      const customer = customers.find(c => c.id.toString() === data.entity_id);
      entityName = customer ? `${customer.first_name} ${customer.last_name}` : "";
    }
    
    // Prepare data for API
    const returnData = {
      return_id: generateReturnId(),
      type: data.type,
      entity_id: parseInt(data.entity_id),
      entity_name: entityName,
      date: data.date,
      reason: data.reason,
      total_amount: totalAmount,
      payment_amount: parseFloat(data.payment_amount || "0"),
      payment_status: "not_refunded" as const,
      status: "completed" as const,
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
      await createMutation.mutateAsync(returnData);
      onSuccess();
    } catch (error) {
      console.error("Error creating return:", error);
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
              <FormLabel>Loại trả hàng</FormLabel>
              <FormControl>
                <RadioGroup
                  className="flex space-x-4"
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="customer" id="customer" />
                    <label htmlFor="customer" className="text-sm font-medium">
                      Khách hàng trả hàng
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="supplier" id="supplier" />
                    <label htmlFor="supplier" className="text-sm font-medium">
                      Trả hàng cho nhà cung cấp
                    </label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="entity_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{formType === "supplier" ? "Nhà cung cấp" : "Khách hàng"}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={formType === "supplier" ? "Chọn nhà cung cấp" : "Chọn khách hàng"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {formType === "supplier" ? (
                      suppliers.map((supplier: Supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.name}
                        </SelectItem>
                      ))
                    ) : isLoadingCustomers ? (
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
          
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ngày trả hàng</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lý do trả hàng</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Nhập lý do trả hàng" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
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
                      <FormLabel>Giá</FormLabel>
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
        </div>
        
        <DialogFooter>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Đang lưu..." : "Lưu phiếu trả hàng"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
