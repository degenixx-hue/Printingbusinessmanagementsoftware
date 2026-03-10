import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Plus, Trash2, Save, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Switch } from '../components/ui/switch';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { useData } from '../context/DataContext';
import { toast } from 'sonner';
import degenixLogo from 'figma:asset/e686929947131e66770ed743ba284a27b15aa8de.png';
import { DateTimeDisplay } from '../components/DateTimeDisplay';

interface QuotationItem {
  productId: string;
  productName: string;
  quantity: number;
  coverPageQuantity: number;
  coverPageGsm: number;
  innerPageQuantity: number;
  innerPageGsm: number;
  laminationType: 'None' | 'Gloss' | 'Matte' | 'Velvet' | 'Spot' | 'Velvet Spot';
  uv: boolean;
  goldFoiling: boolean;
  pricePerUnit: number;
  amount: number;
}

export default function EditQuotation() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { clients, products, getQuotationById, updateQuotation } = useData();
  
  const existingQuotation = getQuotationById(id!);

  const [clientId, setClientId] = useState('');
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [includeGst, setIncludeGst] = useState(true);
  const [gstPercentage, setGstPercentage] = useState(18);
  const [showCustomGst, setShowCustomGst] = useState(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);

  // Current item being added
  const [currentItem, setCurrentItem] = useState({
    productId: '',
    quantity: 1,
    coverPageQuantity: 0,
    coverPageGsm: 0,
    innerPageQuantity: 0,
    innerPageGsm: 0,
    laminationType: 'None' as 'None' | 'Gloss' | 'Matte' | 'Velvet' | 'Spot' | 'Velvet Spot',
    uv: false,
    goldFoiling: false,
    pricePerUnit: 0,
  });

  // Load existing quotation data
  useEffect(() => {
    if (existingQuotation) {
      setClientId(existingQuotation.clientId);
      setItems(existingQuotation.items);
      setIncludeGst(existingQuotation.includeGst);
      setGstPercentage(existingQuotation.gstPercentage);
      setDiscountType(existingQuotation.discountType || 'percentage');
      setDiscountValue(existingQuotation.discountValue || 0);
      
      // Check if custom GST
      if (![0, 5, 12, 18, 28].includes(existingQuotation.gstPercentage)) {
        setShowCustomGst(true);
      }
    }
  }, [existingQuotation]);

  if (!existingQuotation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Quotation not found</h2>
          <Button onClick={() => navigate('/orders')}>Back to Orders</Button>
        </div>
      </div>
    );
  }

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setCurrentItem({
        ...currentItem,
        productId,
        coverPageQuantity: product.coverPageQuantity,
        coverPageGsm: product.coverPageGsm,
        innerPageQuantity: product.innerPageQuantity,
        innerPageGsm: product.innerPageGsm,
        laminationType: product.laminationType,
        uv: product.uv,
        goldFoiling: product.goldFoiling,
        pricePerUnit: product.pricePerUnit,
      });
    }
  };

  const handleAddItem = () => {
    if (!currentItem.productId) {
      toast.error('Please select a product');
      return;
    }

    const product = products.find(p => p.id === currentItem.productId);
    if (!product) return;

    const amount = currentItem.quantity * currentItem.pricePerUnit;
    const newItem: QuotationItem = {
      ...currentItem,
      productName: product.productName,
      amount,
    };

    setItems([...items, newItem]);
    
    // Reset current item
    setCurrentItem({
      productId: '',
      quantity: 1,
      coverPageQuantity: 0,
      coverPageGsm: 0,
      innerPageQuantity: 0,
      innerPageGsm: 0,
      laminationType: 'None',
      uv: false,
      goldFoiling: false,
      pricePerUnit: 0,
    });

    toast.success('Item added to quotation');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    toast.success('Item removed');
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const discountAmount = discountValue > 0
    ? (discountType === 'percentage'
        ? subtotal * (discountValue / 100)
        : discountValue)
    : 0;
  const amountAfterDiscount = subtotal - discountAmount;
  const gstAmount = includeGst ? amountAfterDiscount * (gstPercentage / 100) : 0;
  const cgstAmount = gstAmount / 2;
  const sgstAmount = gstAmount / 2;
  const totalAmount = amountAfterDiscount + gstAmount;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!clientId) {
      toast.error('Please select a client');
      return;
    }

    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    updateQuotation(existingQuotation.id, {
      clientId,
      items,
      subtotal,
      includeGst,
      gstPercentage,
      gstAmount,
      discountType,
      discountValue,
      totalAmount,
    });
    
    toast.success('Quotation updated successfully');
    navigate(`/orders/quotation/${existingQuotation.id}`);
  };

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundColor: '#1a2b4a'
      }}
    >
      {/* Header */}
      <div className="py-4 px-6" style={{ backgroundColor: '#1a2b4a', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/orders/quotation/${existingQuotation.id}`)}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <img 
                src={degenixLogo} 
                alt="Degenix Graphics Logo" 
                className="h-14 w-14 object-contain cursor-pointer hover:opacity-80 transition-opacity" 
                onClick={() => navigate('/dashboard')}
              />
            </div>
            <h1 className="text-white text-2xl font-bold">Edit Quotation - {existingQuotation.quotationNumber}</h1>
          </div>
          <DateTimeDisplay />
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Selection */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4 text-white">Client Information</h3>
              <div>
                <Label htmlFor="clientId" className="text-white">Select Client *</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Add Items Section */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4 text-white">Add Items</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="productId" className="text-white">Select Product *</Label>
                    <Select value={currentItem.productId} onValueChange={handleProductChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.productName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="quantity" className="text-white">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={currentItem.quantity}
                      onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>

                {/* Product Specifications */}
                {currentItem.productId && (
                  <>
                    <div className="border-t border-white/20 pt-4">
                      <h4 className="text-sm font-medium mb-3 text-white">Product Specifications</h4>
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor="coverPageQuantity" className="text-white text-xs">Cover Quantity</Label>
                          <Input
                            id="coverPageQuantity"
                            type="number"
                            value={currentItem.coverPageQuantity}
                            onChange={(e) => setCurrentItem({ ...currentItem, coverPageQuantity: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="coverPageGsm" className="text-white text-xs">Cover GSM</Label>
                          <Input
                            id="coverPageGsm"
                            type="number"
                            value={currentItem.coverPageGsm}
                            onChange={(e) => setCurrentItem({ ...currentItem, coverPageGsm: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="innerPageQuantity" className="text-white text-xs">Inner Quantity</Label>
                          <Input
                            id="innerPageQuantity"
                            type="number"
                            value={currentItem.innerPageQuantity}
                            onChange={(e) => setCurrentItem({ ...currentItem, innerPageQuantity: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="innerPageGsm" className="text-white text-xs">Inner GSM</Label>
                          <Input
                            id="innerPageGsm"
                            type="number"
                            value={currentItem.innerPageGsm}
                            onChange={(e) => setCurrentItem({ ...currentItem, innerPageGsm: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="laminationType" className="text-white">Lamination Type</Label>
                        <Select
                          value={currentItem.laminationType}
                          onValueChange={(value: any) => setCurrentItem({ ...currentItem, laminationType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="None">None</SelectItem>
                            <SelectItem value="Gloss">Gloss</SelectItem>
                            <SelectItem value="Matte">Matte</SelectItem>
                            <SelectItem value="Velvet">Velvet</SelectItem>
                            <SelectItem value="Spot">Spot</SelectItem>
                            <SelectItem value="Velvet Spot">Velvet Spot</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="uv"
                            checked={currentItem.uv}
                            onCheckedChange={(checked) => setCurrentItem({ ...currentItem, uv: checked })}
                          />
                          <Label htmlFor="uv" className="text-white">U/V Coating</Label>
                        </div>
                      </div>
                      <div className="flex items-end">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="goldFoiling"
                            checked={currentItem.goldFoiling}
                            onCheckedChange={(checked) => setCurrentItem({ ...currentItem, goldFoiling: checked })}
                          />
                          <Label htmlFor="goldFoiling" className="text-white">Gold Foiling</Label>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="pricePerUnit" className="text-white">Price Per Unit (₹) *</Label>
                        <Input
                          id="pricePerUnit"
                          type="number"
                          step="0.01"
                          value={currentItem.pricePerUnit}
                          onChange={(e) => setCurrentItem({ ...currentItem, pricePerUnit: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label className="text-white">Amount</Label>
                        <div className="text-xl font-bold text-green-400 mt-2">
                          ₹{(currentItem.quantity * currentItem.pricePerUnit).toFixed(2)}
                        </div>
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          onClick={handleAddItem}
                          className="w-full"
                          style={{ backgroundColor: '#10b981' }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Item
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Items List */}
            {items.length > 0 && (
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow p-6">
                <h3 className="font-semibold mb-4 text-white">Quotation Items ({items.length})</h3>
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white">{item.productName}</h4>
                          <span className="text-lg font-bold text-green-400">₹{item.amount.toFixed(2)}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-xs text-gray-300">
                          <div>Qty: {item.quantity}</div>
                          <div>Rate: ₹{item.pricePerUnit.toFixed(2)}</div>
                          <div>Cover: {item.coverPageQuantity}@{item.coverPageGsm}gsm</div>
                          <div>Inner: {item.innerPageQuantity}@{item.innerPageGsm}gsm</div>
                        </div>
                        <div className="flex gap-4 text-xs text-gray-300 mt-1">
                          <div>Lamination: {item.laminationType}</div>
                          <div>UV: {item.uv ? 'Yes' : 'No'}</div>
                          <div>Gold: {item.goldFoiling ? 'Yes' : 'No'}</div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 ml-4"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Discount & GST Settings */}
            {items.length > 0 && (
              <>
                {/* Discount */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow p-6">
                  <h3 className="font-semibold mb-4 text-white">Discount (Optional)</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="discountType" className="text-white">Discount Type</Label>
                      <Select
                        value={discountType}
                        onValueChange={(value: 'percentage' | 'fixed') => setDiscountType(value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="discountValue" className="text-white">
                        Discount Value {discountType === 'percentage' ? '(%)' : '(₹)'}
                      </Label>
                      <Input
                        id="discountValue"
                        type="number"
                        step="0.01"
                        min="0"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                        placeholder={discountType === 'percentage' ? 'Enter %' : 'Enter amount'}
                      />
                    </div>
                    <div>
                      <Label className="text-white">Discount Amount</Label>
                      <div className="text-xl font-bold text-orange-400 mt-2">
                        - ₹{discountAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  {discountAmount > 0 && (
                    <div className="mt-4 p-3 bg-orange-500/20 backdrop-blur-sm border border-orange-400/30 rounded-lg">
                      <div className="flex justify-between text-sm text-gray-200">
                        <span>Amount After Discount:</span>
                        <span className="font-semibold text-white">₹{amountAfterDiscount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* GST Settings */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow p-6">
                  <h3 className="font-semibold mb-4 text-white">GST Settings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="includeGst" className="text-white">Include GST</Label>
                      <Checkbox
                        id="includeGst"
                        checked={includeGst}
                        onCheckedChange={setIncludeGst}
                      />
                    </div>
                    {includeGst && (
                      <div>
                        <Label htmlFor="gstRate" className="text-white">GST Rate (%)</Label>
                        <Select
                          value={showCustomGst ? 'custom' : gstPercentage.toString()}
                          onValueChange={(value) => {
                            if (value === 'custom') {
                              setShowCustomGst(true);
                              setGstPercentage(0);
                            } else {
                              setShowCustomGst(false);
                              setGstPercentage(parseFloat(value));
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0% - Exempted</SelectItem>
                            <SelectItem value="5">5% - Essential Goods</SelectItem>
                            <SelectItem value="12">12% - Standard Goods</SelectItem>
                            <SelectItem value="18">18% - Services (Default)</SelectItem>
                            <SelectItem value="28">28% - Luxury Items</SelectItem>
                            <SelectItem value="custom">Custom Rate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  {showCustomGst && (
                    <div className="mt-4">
                      <Label htmlFor="customGstRate" className="text-white">Enter Custom GST Rate (%)</Label>
                      <Input
                        id="customGstRate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={gstPercentage}
                        placeholder="Enter custom GST rate"
                        onChange={(e) => setGstPercentage(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow p-6">
                  <h3 className="font-semibold mb-4 text-white">Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-200">
                      <span>Subtotal:</span>
                      <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <>
                        <div className="flex justify-between text-sm text-orange-400">
                          <span>Discount {discountType === 'percentage' ? `(${discountValue}%)` : ''}:</span>
                          <span className="font-medium">- ₹{discountAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-200">
                          <span>After Discount:</span>
                          <span className="font-medium">₹{amountAfterDiscount.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    {includeGst && (
                      <>
                        <div className="flex justify-between text-sm text-gray-200">
                          <span>CGST ({(gstPercentage / 2).toFixed(2)}%):</span>
                          <span className="font-medium">₹{cgstAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-200">
                          <span>SGST ({(gstPercentage / 2).toFixed(2)}%):</span>
                          <span className="font-medium">₹{sgstAmount.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between text-lg font-bold mt-4 pt-4 border-t border-white/20 text-white">
                      <span>Total Amount:</span>
                      <span className="text-green-400">₹{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => navigate(`/orders/quotation/${existingQuotation.id}`)}>
                Cancel
              </Button>
              <Button type="submit" style={{ backgroundColor: '#1a2b4a' }} disabled={items.length === 0}>
                Update Quotation
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}