
// Import necessary libraries and components
import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Product, Supplier, ReturnItem, Return } from "@/types/models";
import { useQuery } from "@tanstack/react-query";
import { fetchCustomAPI, fetchWooCommerce } from "@/lib/api-utils";

// Define the form schema
const formSchema = z.object({
  type: z.enum(["customer", "supplier"]),
  entity_id: z.coerce.number({
    required_error: "Vui lòng chọn đối tượng",
  }),
  date: z.date(),
  reason: z.string().min(1, { message: "Vui lòng nhập lý do trả hàng" }),
  notes: z.string().optional(),
});

export default function CreateReturnForm() {
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<Supplier | null>(null);
  const [items, setItems] = useState<ReturnItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();

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
      type: "supplier",
      date: new Date(),
      reason: "",
      notes: "",
    },
  });

  // Watch the type and entity_id fields
  const type = form.watch("type");
  const entity_id = form.watch("entity_id");

  // Update selected entity when type and entity_id change
  useEffect(() => {
    if (type === "supplier" && entity_id) {
      const supplier = suppliers.find((s) => s.id === entity_id);
      setSelectedEntity(supplier || null);
    } else {
      setSelectedEntity(null);
    }
  }, [type, entity_id, suppliers]);

  // Calculate total amount
  const totalAmount = items.reduce(
    (total, item) => total + item.quantity * (item.unit_price || item.price || 0),
    0
  );

  // Handle product search
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      const results = await fetchWooCommerce("/products", {
        params: {
          search: searchTerm,
          per_page: "10",
        },
      });
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching products:", error);
      toast.error("Lỗi khi tìm kiếm sản phẩm");
    } finally {
      setIsSearching(false);
    }
  };

  // Add product to items
  const addProduct = (product: Product) => {
    // Check if product already exists in items
    const existingItemIndex = items.findIndex(
      (item) => item.product_id === product.id
    );

    if (existingItemIndex >= 0) {
      // Update quantity if product already exists
      const updatedItems = [...items];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + 1,
      };
      setItems(updatedItems);
    } else {
      // Add new product to items
      setItems([
        ...items,
        {
          product_id: product.id,
          variation_id: 0,
          product_name: product.name,
          name: product.name,
          sku: product.sku,
          quantity: 1,
          unit_price: parseFloat(product.price),
          price: parseFloat(product.price),
          total_price: parseFloat(product.price),
          subtotal: parseFloat(product.price),
        },
      ]);
    }

    // Close the dialog
    setIsDialogOpen(false);
    setSearchTerm("");
    setSearchResults([]);
  };

  // Update item quantity
  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) return;

    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity,
    };
    setItems(updatedItems);
  };

  // Update item price
  const updateItemPrice = (index: number, price: number) => {
    if (price < 0) return;

    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      unit_price: price,
      price: price,
    };
    setItems(updatedItems);
  };

  // Update item reason
  const updateItemReason = (index: number, reason: string) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      reason,
    };
    setItems(updatedItems);
  };

  // Remove item
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (items.length === 0) {
      toast.error("Vui lòng thêm ít nhất một sản phẩm");
      return;
    }

    setLoading(true);
    try {
      // Prepare items data for submission
      const itemsData = items.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name || item.name || "",
        quantity: item.quantity,
        unit_price: item.unit_price || item.price || 0,
        reason: item.reason || "",
      }));

      // Find entity name
      let entityName = "";
      if (data.type === "supplier") {
        entityName = suppliers.find((s) => s.id === data.entity_id)?.name || "";
      } else {
        // For customer returns, this would need to be fetched from customers
        entityName = "Customer"; // Placeholder
      }

      // Prepare return data
      const returnData: Omit<Return, 'id' | 'created_at' | 'updated_at'> = {
        return_id: `RTN-${Date.now()}`,
        type: data.type,
        entity_id: data.entity_id,
        entity_name: entityName,
        date: format(data.date, "yyyy-MM-dd HH:mm:ss"),
        reason: data.reason,
        total_amount: totalAmount,
        payment_amount: 0, // No payment by default
        payment_status: "not_refunded",
        status: "completed",
        notes: data.notes || "",
        items: itemsData,
      };

      // Submit the data
      await fetchCustomAPI("/returns", {
        method: "POST",
        body: returnData,
      });

      toast.success("Đã tạo phiếu trả hàng thành công");
      navigate("/returns");
    } catch (error) {
      console.error("Error creating return:", error);
      toast.error("Lỗi khi tạo phiếu trả hàng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loại phiếu trả</FormLabel>
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
                    <SelectItem value="supplier">Trả hàng cho NCC</SelectItem>
                    <SelectItem value="customer">Khách trả hàng</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {type === "supplier" && (
            <FormField
              control={form.control}
              name="entity_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nhà cung cấp</FormLabel>
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

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Ngày trả</FormLabel>
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

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lý do trả hàng</FormLabel>
              <FormControl>
                <Input placeholder="Nhập lý do trả hàng" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Card className="p-4">
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-medium">Sản phẩm</h3>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm sản phẩm
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Tìm kiếm sản phẩm</DialogTitle>
                </DialogHeader>
                <div className="flex gap-2 mt-4">
                  <Input
                    placeholder="Nhập tên hoặc mã sản phẩm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleSearch}
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    <span className="ml-2">Tìm</span>
                  </Button>
                </div>
                <div className="mt-4 max-h-96 overflow-auto">
                  {searchResults.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tên sản phẩm</TableHead>
                          <TableHead>Mã</TableHead>
                          <TableHead>Giá</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {searchResults.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>{product.name}</TableCell>
                            <TableCell>{product.sku}</TableCell>
                            <TableCell>
                              {parseFloat(product.price).toLocaleString()} đ
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => addProduct(product)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : searchTerm && !isSearching ? (
                    <p className="text-center text-muted-foreground py-4">
                      Không tìm thấy sản phẩm nào
                    </p>
                  ) : null}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên sản phẩm</TableHead>
                  <TableHead>Mã</TableHead>
                  <TableHead>Số lượng</TableHead>
                  <TableHead>Đơn giá</TableHead>
                  <TableHead>Lý do</TableHead>
                  <TableHead>Thành tiền</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.product_name || item.name}</TableCell>
                    <TableCell>{item.sku}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItemQuantity(index, parseInt(e.target.value))
                        }
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        value={item.unit_price || item.price || 0}
                        onChange={(e) =>
                          updateItemPrice(index, parseFloat(e.target.value))
                        }
                        className="w-28"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        value={item.reason || ""}
                        onChange={(e) =>
                          updateItemReason(index, e.target.value)
                        }
                        className="w-40"
                        placeholder="Lý do trả"
                      />
                    </TableCell>
                    <TableCell>
                      {(
                        item.quantity *
                        (item.unit_price || item.price || 0)
                      ).toLocaleString()}{" "}
                      đ
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={5} className="text-right font-medium">
                    Tổng cộng:
                  </TableCell>
                  <TableCell className="font-medium">
                    {totalAmount.toLocaleString()} đ
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có sản phẩm nào. Vui lòng thêm sản phẩm.
            </div>
          )}
        </Card>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ghi chú</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Nhập ghi chú cho phiếu trả hàng"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            className="w-full md:w-auto"
            disabled={loading || items.length === 0}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Plus className="mr-2 h-4 w-4" />
            Tạo phiếu trả hàng
          </Button>
        </div>
      </form>
    </Form>
  );
}
