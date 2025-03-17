import { useState, useEffect, useRef } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fetchWooCommerce, fetchCustomAPI } from "@/lib/api-utils";
import { toast } from "sonner";
import { Product as ModelProduct } from "@/types/models";

interface ProductOption {
  id: number;
  name: string;
  sku?: string;
  price?: string;
  stock_quantity?: number;
  real_stock?: number;
  available_to_sell?: number;
  image?: string;
}

interface ProductSelectAutoCompleteProps {
  onSelect: (product: ModelProduct | ProductOption) => void;
  selectedProduct: ModelProduct | ProductOption | null;
  placeholder?: string;
  disabled?: boolean;
  showProductInfo?: boolean;
  includeRealStock?: boolean;
  className?: string;
}

export default function ProductSelectAutoComplete({
  onSelect,
  selectedProduct,
  placeholder = "Tìm và chọn sản phẩm...",
  disabled = false,
  showProductInfo = false,
  includeRealStock = false,
  className
}: ProductSelectAutoCompleteProps) {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const searchProducts = async (query: string) => {
    if (query.length < 2) return;
    
    setLoading(true);
    try {
      const wooProducts = await fetchWooCommerce(`/products?search=${encodeURIComponent(query)}&per_page=10`, {
        suppressToast: true
      });
      
      let productsData = [];
      
      if (Array.isArray(wooProducts)) {
        productsData = wooProducts.map(product => ({
          id: product.id,
          name: product.name,
          sku: product.sku || '',
          price: product.price,
          stock_quantity: product.stock_quantity,
          image: product.images?.[0]?.src
        }));
        
        if (includeRealStock && productsData.length > 0) {
          try {
            const productIds = productsData.map(p => p.id);
            const stockLevels = await fetchCustomAPI(`/stock-levels?product_ids=${productIds.join(',')}`, {
              suppressToast: true
            });
            
            if (Array.isArray(stockLevels)) {
              productsData = productsData.map(product => {
                const stockData = stockLevels.find(sl => sl.product_id === product.id);
                return {
                  ...product,
                  real_stock: stockData?.ton_thuc_te,
                  available_to_sell: stockData?.co_the_ban
                };
              });
            }
          } catch (error) {
            console.error("Error fetching stock levels:", error);
          }
        }
        
        setProducts(productsData);
      }
    } catch (error) {
      console.error("Error searching products:", error);
      setProducts([
        { id: 1, name: "Sản phẩm mẫu 1", sku: "SP001", price: "100000", real_stock: 10, available_to_sell: 8 },
        { id: 2, name: "Sản phẩm mẫu 2", sku: "SP002", price: "200000", real_stock: 5, available_to_sell: 5 },
        { id: 3, name: "Sản phẩm mẫu 3", sku: "SP003", price: "300000", real_stock: 0, available_to_sell: 0 },
      ]);
      
      if (!searchQuery.includes('mẫu')) {
        toast.error("Không thể kết nối đến API WooCommerce", {
          id: "woo-api-error",
          duration: 3000
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchProducts(value);
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const formatPrice = (price?: string) => {
    if (!price) return "0 ₫";
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(Number(price));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedProduct ? (
            <div className="flex items-center text-left truncate">
              {selectedProduct.image && showProductInfo && (
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name}
                  className="w-6 h-6 mr-2 rounded object-cover" 
                />
              )}
              <div className="truncate">
                {selectedProduct.name}
                {showProductInfo && selectedProduct.sku && (
                  <span className="text-muted-foreground text-xs ml-1">
                    ({selectedProduct.sku})
                  </span>
                )}
              </div>
            </div>
          ) : (
            <span>{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Nhập tên sản phẩm để tìm kiếm" 
            value={searchQuery}
            onValueChange={handleSearch}
          />
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          {!loading && (
            <CommandList>
              <CommandEmpty>Không tìm thấy sản phẩm</CommandEmpty>
              <CommandGroup>
                {products.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={product.id.toString()}
                    onSelect={() => {
                      onSelect(product);
                      setOpen(false);
                    }}
                    className="flex items-center py-2"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 flex-shrink-0",
                        selectedProduct?.id === product.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    
                    {product.image && showProductInfo && (
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-6 h-6 mr-2 rounded object-cover flex-shrink-0" 
                      />
                    )}
                    
                    <div className="flex flex-col">
                      <div className="font-medium">{product.name}</div>
                      {showProductInfo && (
                        <div className="flex flex-wrap text-xs text-muted-foreground gap-x-2">
                          {product.sku && <span>SKU: {product.sku}</span>}
                          {product.price && <span>Giá: {formatPrice(product.price)}</span>}
                          {includeRealStock && product.real_stock !== undefined && (
                            <span>Kho thực: {product.real_stock}</span>
                          )}
                          {includeRealStock && product.available_to_sell !== undefined && (
                            <span>Có thể bán: {product.available_to_sell}</span>
                          )}
                          {!includeRealStock && product.stock_quantity !== undefined && (
                            <span>Tồn kho: {product.stock_quantity}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
