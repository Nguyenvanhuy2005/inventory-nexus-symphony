import React, { useState, useEffect } from 'react';
import { useGetProducts } from '@/hooks/api-hooks';
import { Product as ModelProduct } from '@/types/models';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/components/ui/use-toast";
import { useCreateReturn } from "@/hooks/api-hooks";
import { useGetSuppliers } from "@/hooks/api-hooks";
import { useGetCustomers } from "@/hooks/api-hooks";
import { Supplier, Return, ReturnItem } from "@/types/models";
import { Trash2, Plus, Package, User, Truck, Search } from "lucide-react";
import { format } from "date-fns";
import { generateId } from "@/lib/utils";

// Add a conversion function to help with type compatibility between WooCommerce Product and our model Product
const convertWooCommerceProduct = (product: any): ModelProduct => {
  return {
    id: product.id,
    name: product.name || '',
    slug: product.slug || '',
    sku: product.sku || '',
    price: product.price || '',
    regular_price: product.regular_price || '',
    sale_price: product.sale_price || '',
    stock_quantity: product.stock_quantity || 0,
    stock_status: product.stock_status || 'instock',
    description: product.description || '',
    short_description: product.short_description || '',
    categories: product.categories || [],
    manage_stock: product.manage_stock || false,
    featured: product.featured || false,
    images: (product.images || []).map((img: any) => ({
      id: img.id,
      src: img.src,
      name: img.name || img.alt || 'product image',
    })),
    type: product.type || 'simple',
    real_stock: product.stock_quantity || 0,
    available_to_sell: product.stock_quantity || 0,
    pending_orders: 0,
    attributes: product.attributes || [],
    variation_id: product.variation_id || 0,
  };
};

interface CreateReturnFormProps {
  onSuccess?: () => void;
  initialData?: Return;
}

export default function CreateReturnForm({ onSuccess, initialData }: CreateReturnFormProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("customer");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [products, setProducts] = useState<ModelProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ModelProduct[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  
  const [returnData, setReturnData] = useState<Return>({
    return_id: initialData?.return_id || generateId("RTN"),
    type: initialData?.type || "customer",
    entity_id: initialData?.entity_id || 0,
    entity_name: initialData?.entity_name || "",
    date: initialData?.date || format(new Date(), "yyyy-MM-dd"),
    reason: initialData?.reason || "",
    total_amount: initialData?.total_amount || 0,
    payment_amount: initialData?.payment_amount || 0,
    payment_status: initialData?.payment_status || "not_refunded",
    status: initialData?.status || "pending",
    notes: initialData?.notes || "",
    items: initialData?.items || []
  });
  
  const { data: productsData, isLoading: isLoadingProducts } = useGetProducts();
  const { data: suppliersData, isLoading: isLoadingSuppliers } = useGetSuppliers();
  const { data: customersData, isLoading: isLoadingCustomers } = useGetCustomers();
  const createReturn = useCreateReturn();
  
  useEffect(() => {
    if (productsData) {
      const convertedProducts = (productsData || []).map(convertWooCommerceProduct);
      setProducts(convertedProducts);
      setFilteredProducts(convertedProducts);
    }
  }, [productsData]);
  
  useEffect(() => {
    if (suppliersData) {
      setSuppliers(suppliersData);
    }
  }, [suppliersData]);
  
  useEffect(() => {
    if (customersData) {
      setCustomers(customersData);
    }
  }, [customersData]);
  
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);
  
  useEffect(() => {
    if (selectedDate) {
      setReturnData(prev => ({
        ...prev,
        date: format(selectedDate, "yyyy-MM-dd")
      }));
    }
  }, [selectedDate]);
  
  useEffect(() => {
    if (returnData.type === "customer" && initialData?.entity_id) {
      const customer = customers.find(c => c.id === initialData.entity_id);
      if (customer) {
        setSelectedEntity(customer);
      }
    } else if (returnData.type === "supplier" && initialData?.entity_id) {
      const supplier = suppliers.find(s => s.id === initialData.entity_id);
      if (supplier) {
        setSelectedEntity(supplier);
      }
    }
  }, [returnData.type, initialData, customers, suppliers]);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setReturnData(prev => ({
      ...prev,
      type: value as "customer" | "supplier",
      entity_id: 0,
      entity_name: ""
    }));
    setSelectedEntity(null);
  };
  
  const handleEntitySelect = (entity: any) => {
    setSelectedEntity(entity);
    setReturnData(prev => ({
      ...prev,
      entity_id: entity.id,
      entity_name: entity.name || entity.first_name + " " + entity.last_name
    }));
  };
  
  const handleAddItem = (product: ModelProduct) => {
    const existingItemIndex = returnData.items.findIndex(item => 
      item.product_id === product.id
    );
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...returnData.items];
      updatedItems[existingItemIndex].quantity += 1;
      updatedItems[existingItemIndex].total_price = 
        updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unit_price;
      
      setReturnData(prev => ({
        ...prev,
        items: updatedItems,
        total_amount: calculateTotal(updatedItems)
      }));
    } else {
      // Add new item
      const price = parseFloat(product.price || product.regular_price || "0");
      const newItem: ReturnItem = {
        product_id: product.id,
        product_name: product.name,
        sku: product.sku || "",
        quantity: 1,
        unit_price: price,
        total_price: price
      };
      
      const updatedItems = [...returnData.items, newItem];
      
      setReturnData(prev => ({
        ...prev,
        items: updatedItems,
        total_amount: calculateTotal(updatedItems)
      }));
    }
  };
  
  const handleRemoveItem = (index: number) => {
    const updatedItems = returnData.items.filter((_, i) => i !== index);
    setReturnData(prev => ({
      ...prev,
      items: updatedItems,
      total_amount: calculateTotal(updatedItems)
    }));
  };
  
  const handleQuantityChange = (index: number, quantity: number) => {
    if (quantity < 1) quantity = 1;
    
    const updatedItems = [...returnData.items];
    updatedItems[index].quantity = quantity;
    updatedItems[index].total_price = quantity * updatedItems[index].unit_price;
    
    setReturnData(prev => ({
      ...prev,
      items: updatedItems,
      total_amount: calculateTotal(updatedItems)
    }));
  };
  
  const handlePriceChange = (index: number, price: number) => {
    if (price < 0) price = 0;
    
    const updatedItems = [...returnData.items];
    updatedItems[index].unit_price = price;
    updatedItems[index].total_price = updatedItems[index].quantity * price;
    
    setReturnData(prev => ({
      ...prev,
      items: updatedItems,
      total_amount: calculateTotal(updatedItems)
    }));
  };
  
  const calculateTotal = (items: ReturnItem[]) => {
    return items.reduce((sum, item) => sum + item.total_price, 0);
  };
  
  const handlePaymentAmountChange = (amount: number) => {
    if (amount < 0) amount = 0;
    if (amount > returnData.total_amount) amount = returnData.total_amount;
    
    let paymentStatus: "refunded" | "partial_refunded" | "not_refunded" = "not_refunded";
    
    if (amount === 0) {
      paymentStatus = "not_refunded";
    } else if (amount === returnData.total_amount) {
      paymentStatus = "refunded";
    } else {
      paymentStatus = "partial_refunded";
    }
    
    setReturnData(prev => ({
      ...prev,
      payment_amount: amount,
      payment_status: paymentStatus
    }));
  };
  
  const handleSubmit = async () => {
    if (!returnData.entity_id) {
      toast({
        title: "Lỗi",
        description: `Vui lòng chọn ${returnData.type === "customer" ? "khách hàng" : "nhà cung cấp"}`,
        variant: "destructive"
      });
      return;
    }
    
    if (returnData.items.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng thêm ít nhất một sản phẩm",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await createReturn.mutateAsync(returnData);
      toast({
        title: "Thành công",
        description: "Đã tạo phiếu trả hàng thành công",
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error creating return:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tạo phiếu trả hàng. Vui lòng thử lại sau.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="customer" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Khách hàng trả hàng
          </TabsTrigger>
          <TabsTrigger value="supplier" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Trả hàng nhà cung cấp
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="customer" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Mã phiếu trả</Label>
              <Input 
                value={returnData.return_id} 
                onChange={(e) => setReturnData({...returnData, return_id: e.target.value})}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Ngày trả hàng</Label>
              <DatePicker 
                date={selectedDate} 
                setDate={setSelectedDate} 
                className="mt-1"
              />
            </div>
          </div>
          
          <div>
            <Label>Chọn khách hàng</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-1">
              <div className="md:col-span-3">
                <Input
                  placeholder="Tìm kiếm khách hàng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {isLoadingCustomers ? (
                <div className="md:col-span-3 text-center py-4">Đang tải danh sách khách hàng...</div>
              ) : (
                customers
                  .filter(customer => 
                    customer.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    customer.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .slice(0, 6)
                  .map(customer => (
                    <Card 
                      key={customer.id}
                      className={`cursor-pointer hover:border-primary transition-colors ${
                        selectedEntity?.id === customer.id ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => handleEntitySelect(customer)}
                    >
                      <CardContent className="p-4">
                        <div className="font-medium">{customer.first_name} {customer.last_name}</div>
                        <div className="text-sm text-muted-foreground">{customer.email}</div>
                        {customer.billing?.phone && (
                          <div className="text-sm">{customer.billing.phone}</div>
                        )}
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="supplier" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Mã phiếu trả</Label>
              <Input 
                value={returnData.return_id} 
                onChange={(e) => setReturnData({...returnData, return_id: e.target.value})}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Ngày trả hàng</Label>
              <DatePicker 
                date={selectedDate} 
                setDate={setSelectedDate} 
                className="mt-1"
              />
            </div>
          </div>
          
          <div>
            <Label>Chọn nhà cung cấp</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-1">
              <div className="md:col-span-3">
                <Input
                  placeholder="Tìm kiếm nhà cung cấp..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {isLoadingSuppliers ? (
                <div className="md:col-span-3 text-center py-4">Đang tải danh sách nhà cung cấp...</div>
              ) : (
                suppliers
                  .filter(supplier => 
                    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .slice(0, 6)
                  .map(supplier => (
                    <Card 
                      key={supplier.id}
                      className={`cursor-pointer hover:border-primary transition-colors ${
                        selectedEntity?.id === supplier.id ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => handleEntitySelect(supplier)}
                    >
                      <CardContent className="p-4">
                        <div className="font-medium">{supplier.name}</div>
                        {supplier.email && (
                          <div className="text-sm text-muted-foreground">{supplier.email}</div>
                        )}
                        {supplier.phone && (
                          <div className="text-sm">{supplier.phone}</div>
                        )}
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {selectedEntity && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Thông tin trả hàng</CardTitle>
            <CardDescription>
              {returnData.type === "customer" 
                ? `Khách hàng: ${selectedEntity.first_name} ${selectedEntity.last_name}`
                : `Nhà cung cấp: ${selectedEntity.name}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="reason">Lý do trả hàng</Label>
              <Textarea
                id="reason"
                placeholder="Nhập lý do trả hàng..."
                value={returnData.reason}
                onChange={(e) => setReturnData({...returnData, reason: e.target.value})}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>Tìm kiếm sản phẩm</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="Tìm theo tên hoặc SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              {isLoadingProducts ? (
                <div className="col-span-full text-center py-4">Đang tải danh sách sản phẩm...</div>
              ) : (
                filteredProducts.slice(0, 8).map(product => (
                  <Card 
                    key={product.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleAddItem(product)}
                  >
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center mb-2">
                        {product.images && product.images[0] ? (
                          <img 
                            src={product.images[0].src} 
                            alt={product.name} 
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <Package className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="font-medium line-clamp-2">{product.name}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {product.sku ? `SKU: ${product.sku}` : ''}
                      </div>
                      <div className="mt-1 font-medium">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
                          .format(parseFloat(product.price || product.regular_price || "0"))}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2 w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddItem(product);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Thêm
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Danh sách sản phẩm trả</h3>
              
              {returnData.items.length === 0 ? (
                <div className="text-center py-8 border rounded-md bg-muted/30">
                  <Package className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">Chưa có sản phẩm nào được thêm</p>
                  <p className="text-sm text-muted-foreground">Tìm kiếm và chọn sản phẩm để thêm vào phiếu trả</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead className="w-[100px] text-right">Số lượng</TableHead>
                      <TableHead className="w-[150px] text-right">Đơn giá</TableHead>
                      <TableHead className="w-[150px] text-right">Thành tiền</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returnData.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="font-medium">{item.product_name}</div>
                          {item.sku && <div className="text-sm text-muted-foreground">SKU: {item.sku}</div>}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                            className="w-20 ml-auto"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min="0"
                            value={item.unit_price}
                            onChange={(e) => handlePriceChange(index, parseFloat(e.target.value) || 0)}
                            className="w-28 ml-auto"
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
                            .format(item.total_price)}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              
              <div className="mt-4 flex flex-col gap-2 items-end">
                <div className="flex justify-between w-full md:w-1/2 py-2">
                  <span className="font-medium">Tổng tiền hàng:</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
                      .format(returnData.total_amount)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center w-full md:w-1/2 py-2">
                  <span className="font-medium">Số tiền hoàn trả:</span>
                  <Input
                    type="number"
                    min="0"
                    max={returnData.total_amount}
                    value={returnData.payment_amount}
                    onChange={(e) => handlePaymentAmountChange(parseFloat(e.target.value) || 0)}
                    className="w-40"
                  />
                </div>
                
                <div className="flex justify-between w-full md:w-1/2 py-2">
                  <span className="font-medium">Trạng thái thanh toán:</span>
                  <Select
                    value={returnData.payment_status}
                    onValueChange={(value) => setReturnData({
                      ...returnData, 
                      payment_status: value as "refunded" | "partial_refunded" | "not_refunded"
                    })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="refunded">Đã hoàn tiền</SelectItem>
                      <SelectItem value="partial_refunded">Hoàn tiền một phần</SelectItem>
                      <SelectItem value="not_refunded">Chưa hoàn tiền</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                placeholder="Nhập ghi chú nếu có..."
                value={returnData.notes}
                onChange={(e) => setReturnData({...returnData, notes: e.target.value})}
                className="mt-1"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">Hủy</Button>
            <Button onClick={handleSubmit} disabled={createReturn.isPending}>
              {createReturn.isPending ? "Đang xử lý..." : "Tạo phiếu trả hàng"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
