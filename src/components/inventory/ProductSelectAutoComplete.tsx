
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
import { fetchWooCommerce } from "@/lib/api-utils";
import { toast } from "sonner";

interface ProductOption {
  id: number;
  name: string;
  sku?: string;
  price?: string;
  stock_quantity?: number;
  image?: string;
}

interface ProductSelectAutoCompleteProps {
  onSelect: (product: ProductOption) => void;
  selectedProduct: ProductOption | null;
  placeholder?: string;
  disabled?: boolean;
  showProductInfo?: boolean;
  className?: string;
}

export default function ProductSelectAutoComplete({
  onSelect,
  selectedProduct,
  placeholder = "Tìm và chọn sản phẩm...",
  disabled = false,
  showProductInfo = false,
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
      const response = await fetchWooCommerce(`/products?search=${encodeURIComponent(query)}&per_page=10`, {
        suppressToast: true
      });
      
      if (Array.isArray(response)) {
        setProducts(response.map(product => ({
          id: product.id,
          name: product.name,
          sku: product.sku || '',
          price: product.price,
          stock_quantity: product.stock_quantity,
          image: product.images?.[0]?.src
        })));
      }
    } catch (error) {
      console.error("Error searching products:", error);
      // Use mock data if API fails
      setProducts([
        { id: 1, name: "Sản phẩm mẫu 1", sku: "SP001", price: "100000" },
        { id: 2, name: "Sản phẩm mẫu 2", sku: "SP002", price: "200000" },
        { id: 3, name: "Sản phẩm mẫu 3", sku: "SP003", price: "300000" },
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
                        <div className="flex text-xs text-muted-foreground space-x-2">
                          {product.sku && <span>SKU: {product.sku}</span>}
                          {product.price && <span>Giá: {formatPrice(product.price)}</span>}
                          {product.stock_quantity !== undefined && (
                            <span>Kho: {product.stock_quantity}</span>
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
