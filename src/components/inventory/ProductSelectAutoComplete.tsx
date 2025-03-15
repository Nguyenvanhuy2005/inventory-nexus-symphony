
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

interface ProductSelectAutoCompleteProps {
  onSelect: (product: { id: number; name: string }) => void;
  selectedProduct: { id: number; name: string } | null;
  placeholder?: string;
}

export default function ProductSelectAutoComplete({
  onSelect,
  selectedProduct,
  placeholder = "Tìm và chọn sản phẩm...",
}: ProductSelectAutoCompleteProps) {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<{ id: number; name: string }[]>([]);
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
          name: product.name
        })));
      }
    } catch (error) {
      console.error("Error searching products:", error);
      // Use mock data if API fails
      setProducts([
        { id: 1, name: "Sản phẩm mẫu 1" },
        { id: 2, name: "Sản phẩm mẫu 2" },
        { id: 3, name: "Sản phẩm mẫu 3" },
      ]);
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedProduct ? selectedProduct.name : placeholder}
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
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedProduct?.id === product.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {product.name}
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
