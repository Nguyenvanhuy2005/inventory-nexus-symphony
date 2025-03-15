
import React, { useState, useEffect } from 'react';
import { useGetProducts } from '@/hooks/api-hooks';
import { Product as ModelProduct } from '@/types/models';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import ProductSelectAutoComplete from './ProductSelectAutoComplete';
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
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [supplierName, setSupplierName] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [selectedVariation, setSelectedVariation] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const { toast } = useToast();
  const createReturn = useCreateReturn();
  const { data: products } = useGetProducts();
  
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
    
    if (quantity <= 0) {
      toast({
        title: "Lỗi",
        description: "Số lượng phải lớn hơn 0.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Prepare data for the return
    const returnData = {
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      variation_id: selectedVariation?.id || null,
      variation_attributes: selectedVariation?.attributes || null,
      quantity: quantity,
      reason: reason,
      notes: notes,
      supplier_id: supplierId,
      supplier_name: supplierName,
      reference_number: referenceNumber,
      images: selectedProduct.images || [],
      created_by: 1, // Admin user ID
      timestamp: new Date().toISOString(),
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
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleProductSelect = (product: ModelProduct | null) => {
    setSelectedProduct(product);
    setSelectedVariation(null);
  };
  
  useEffect(() => {
    if (selectedProduct && selectedProduct.type === 'variable') {
      // Fetch variations if needed, or assume they are already included in the product data
      // If variations are not included, you would fetch them here using another hook or API call
      // For example: const { data: variations } = useGetProductVariations(selectedProduct.id);
      // And then set selectedProduct.variations = variations;
      
      // This is just a placeholder, replace with actual logic if needed
      console.log('Variable product selected, variations should be loaded.');
    }
  }, [selectedProduct]);
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="product">Sản phẩm</Label>
                <ProductSelectAutoComplete 
                  onSelect={handleProductSelect}
                  selectedProduct={selectedProduct}
                  placeholder="Tìm kiếm sản phẩm..."
                />
              </div>
              
              {selectedProduct && selectedProduct.type === 'variable' && selectedProduct.attributes && (
                <div>
                  <Label>Biến thể</Label>
                  <Select onValueChange={(value) => {
                    // Since variations doesn't exist in the Product type, we use attributes instead
                    // This is a placeholder. You should implement proper variation selection logic
                    const variation = { id: parseInt(value), attributes: selectedProduct.attributes };
                    setSelectedVariation(variation || null);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn biến thể" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedProduct.attributes?.map((attr, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {attr.name}: {Array.isArray(attr) ? attr.join(', ') : attr.toString()}
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
                  value={quantity} 
                  onChange={(e) => setQuantity(parseInt(e.target.value))} 
                  min={1} 
                  required 
                />
              </div>
              
              <div>
                <Label htmlFor="reason">Lý do trả hàng</Label>
                <Select value={reason} onValueChange={setReason} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn lý do trả hàng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="damaged">Hàng hỏng</SelectItem>
                    <SelectItem value="wrong_product">Hàng không đúng</SelectItem>
                    <SelectItem value="quality_issue">Vấn đề chất lượng</SelectItem>
                    <SelectItem value="expired">Hàng hết hạn</SelectItem>
                    <SelectItem value="wrong_quantity">Số lượng không đúng</SelectItem>
                    <SelectItem value="other">Lý do khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="supplierName">Nhà cung cấp</Label>
                <Input 
                  id="supplierName" 
                  value={supplierName} 
                  onChange={(e) => setSupplierName(e.target.value)} 
                  placeholder="Nhập tên nhà cung cấp" 
                />
              </div>
              
              <div>
                <Label htmlFor="referenceNumber">Số tham chiếu</Label>
                <Input 
                  id="referenceNumber" 
                  value={referenceNumber} 
                  onChange={(e) => setReferenceNumber(e.target.value)} 
                  placeholder="Nhập số tham chiếu (nếu có)" 
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Ghi chú</Label>
                <Textarea 
                  id="notes" 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  placeholder="Nhập ghi chú (nếu có)" 
                  rows={3} 
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tạo...
              </>
            ) : (
              "Tạo phiếu trả hàng"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
