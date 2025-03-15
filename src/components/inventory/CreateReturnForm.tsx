
import React, { useState, useEffect } from 'react';
import { useGetProducts } from '@/hooks/api-hooks';
import { Product as ModelProduct } from '@/types/models';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import ProductSelectAutoComplete from '@/components/inventory/ProductSelectAutoComplete';
import { useToast } from '@/components/ui/use-toast';
import { useCreateReturn } from '@/hooks/api-hooks';
import { Loader2 } from 'lucide-react';

interface CreateReturnFormProps {
  onSuccess?: () => void;
}

export default function CreateReturnForm({ onSuccess }: CreateReturnFormProps) {
  const [selectedProduct, setSelectedProduct] = useState<ModelProduct | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [selectedVariation, setSelectedVariation] = useState<any | null>(null);
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [supplierName, setSupplierName] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');

  const { toast } = useToast();
  const { data: products, isLoading: isLoadingProducts } = useGetProducts();
  const createReturn = useCreateReturn();
  
  const handleProductSelect = (product: ModelProduct) => {
    setSelectedProduct(product);
    setSelectedVariation(null);
    
    // Set default supplier info if available
    if (product.meta_data) {
      const supplierIdMeta = product.meta_data.find(meta => meta.key === '_supplier_id');
      const supplierNameMeta = product.meta_data.find(meta => meta.key === '_supplier_name');
      
      if (supplierIdMeta && supplierIdMeta.value) {
        setSupplierId(Number(supplierIdMeta.value));
      }
      
      if (supplierNameMeta && supplierNameMeta.value) {
        setSupplierName(supplierNameMeta.value);
      }
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn sản phẩm.",
        variant: "destructive",
      });
      return;
    }
    
    // Create return data object
    const returnData = {
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      variation_id: selectedVariation ? selectedVariation.id : 0,
      quantity: quantity,
      reason: reason,
      notes: notes,
      supplier_id: supplierId,
      supplier_name: supplierName,
      reference_number: referenceNumber,
      status: 'pending'
    };
    
    try {
      await createReturn.mutateAsync(returnData);
      toast({
        title: "Thành công",
        description: "Đã tạo phiếu trả hàng thành công.",
      });
      
      // Reset form
      setSelectedProduct(null);
      setSelectedVariation(null);
      setQuantity(1);
      setReason('');
      setNotes('');
      setSupplierId(null);
      setSupplierName('');
      setReferenceNumber('');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error creating return:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tạo phiếu trả hàng. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tạo phiếu trả hàng</CardTitle>
        <CardDescription>
          Tạo phiếu trả hàng cho nhà cung cấp.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="reference">Mã phiếu</Label>
              <Input 
                id="reference" 
                placeholder="Mã phiếu trả hàng..." 
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="supplier">Nhà cung cấp</Label>
              <Input 
                id="supplier" 
                placeholder="Tên nhà cung cấp..." 
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="product">Sản phẩm</Label>
              <ProductSelectAutoComplete 
                onSelect={handleProductSelect}
                selectedProduct={selectedProduct}
                placeholder="Tìm kiếm sản phẩm..."
                showProductInfo={true}
              />
            </div>
            
            {selectedProduct && selectedProduct.type === 'variable' && selectedProduct.attributes && (
              <div>
                <Label>Biến thể</Label>
                <Select onValueChange={(value) => {
                  // This is a placeholder since we don't have actual variation data
                  // You should implement proper variation selection logic
                  const variationId = parseInt(value);
                  setSelectedVariation({ id: variationId });
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn biến thể" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedProduct.attributes && selectedProduct.attributes.map((attr, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {attr.name}: {Array.isArray(attr.options) ? attr.options.join(', ') : String(attr.options)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <Label htmlFor="quantity">Số lượng</Label>
              <Input 
                id="quantity" 
                type="number" 
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>
            
            <div>
              <Label htmlFor="reason">Lý do trả hàng</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn lý do trả hàng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="damaged">Hàng hỏng</SelectItem>
                  <SelectItem value="wrong_item">Nhầm hàng</SelectItem>
                  <SelectItem value="quality_issues">Vấn đề chất lượng</SelectItem>
                  <SelectItem value="expired">Hàng hết hạn</SelectItem>
                  <SelectItem value="other">Lý do khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea 
                id="notes" 
                placeholder="Ghi chú thêm..." 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full" disabled={createReturn.isPending}>
            {createReturn.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                Đang xử lý...
              </>
            ) : (
              'Tạo phiếu trả hàng'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
