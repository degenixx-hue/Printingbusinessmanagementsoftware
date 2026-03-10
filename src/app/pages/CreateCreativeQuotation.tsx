import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useData } from '../context/DataContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Switch } from '../components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { ArrowLeft, Plus, Trash2, Sparkles, Calendar, Megaphone } from 'lucide-react';
import { toast } from 'sonner';
import degenixLogo from 'figma:asset/e686929947131e66770ed743ba284a27b15aa8de.png';
import { DateTimeDisplay } from '../components/DateTimeDisplay';

interface CreativePackageItem {
  productId: string;
  productName: string;
  packageType: 'Festive' | 'Ads' | 'Both';
  dateFrom: string;
  dateTo: string;
  quantity: number;
  pricePerUnit: number;
  amount: number;
}

export default function CreateCreativeQuotation() {
  const navigate = useNavigate();
  const { clients, addQuotation, products, addBill, addTransaction } = useData();

  const [clientId, setClientId] = useState('');
  const [items, setItems] = useState<CreativePackageItem[]>([
    {
      productId: '',
      productName: '',
      packageType: 'Festive',
      dateFrom: '',
      dateTo: '',
      quantity: 1,
      pricePerUnit: 0,
      amount: 0,
    },
  ]);
  const [includeGst, setIncludeGst] = useState(true);
  const [gstPercentage, setGstPercentage] = useState(18);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [fullPayment, setFullPayment] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Online' | 'Cheque' | 'UPI' | 'Other'>('Cash');

  // Get creative products only (check both category AND digitalCreative flag)
  const creativeProducts = products.filter(p => 
    p.productCategory === 'Digital Creative' || p.digitalCreative === true
  );

  const calculateItemAmount = (quantity: number, pricePerUnit: number) => {
    return quantity * pricePerUnit;
  };

  const handleItemChange = (index: number, field: keyof CreativePackageItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // If product is selected, populate name and default price
    if (field === 'productId') {
      const selectedProduct = creativeProducts.find(p => p.id === value);
      if (selectedProduct) {
        newItems[index].productName = selectedProduct.productName;
        newItems[index].pricePerUnit = selectedProduct.pricePerUnit;
        newItems[index].amount = calculateItemAmount(
          newItems[index].quantity,
          selectedProduct.pricePerUnit
        );
      }
    }

    // Recalculate amount if quantity or price changes
    if (field === 'quantity' || field === 'pricePerUnit') {
      newItems[index].amount = calculateItemAmount(
        newItems[index].quantity,
        newItems[index].pricePerUnit
      );
    }

    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        productId: '',
        productName: '',
        packageType: 'Festive',
        dateFrom: '',
        dateTo: '',
        quantity: 1,
        pricePerUnit: 0,
        amount: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);

  const discountAmount =
    discountValue > 0
      ? discountType === 'percentage'
        ? subtotal * (discountValue / 100)
        : discountValue
      : 0;

  const afterDiscount = subtotal - discountAmount;
  const gstAmount = includeGst ? afterDiscount * (gstPercentage / 100) : 0;
  const totalAmount = afterDiscount + gstAmount;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!clientId) {
      toast.error('Please select a client');
      return;
    }

    if (items.some(item => !item.productId || !item.dateFrom || !item.dateTo)) {
      toast.error('Please select product and fill in all item details');
      return;
    }

    if (items.some(item => new Date(item.dateFrom) >= new Date(item.dateTo))) {
      toast.error('End date must be after start date for all items');
      return;
    }

    // Convert creative items to quotation format
    const quotationItems = items.map(item => ({
      productId: 'creative-' + Date.now(), // Generate ID for creative products
      productName: item.productName,
      quantity: item.quantity,
      pricePerUnit: item.pricePerUnit,
      amount: item.amount,
      // Mark as digital creative
      digitalCreative: true,
      creativePackageType: item.packageType,
      creativeDateFrom: item.dateFrom,
      creativeDateTo: item.dateTo,
      // Set empty printing fields (not applicable)
      coverPageQuantity: 0,
      coverPageGsm: 0,
      innerPageQuantity: 0,
      innerPageGsm: 0,
      laminationType: 'None',
      uv: false,
      goldFoiling: false,
    }));

    const quotationId = addQuotation({
      clientId,
      items: quotationItems,
      subtotal,
      includeGst,
      gstPercentage,
      gstAmount,
      discountType,
      discountValue: discountValue > 0 ? discountValue : undefined,
      totalAmount,
      status: fullPayment ? 'Approved' : 'Pending', // Auto-approve if full payment
      advancePayment: 0, // Don't record advance on quotation when full payment - bill will handle all transactions
      advancePaymentMode: undefined,
      isCreativePackage: true,
      approvedAt: fullPayment ? new Date().toISOString() : undefined,
    });

    // If full payment, create bill directly
    if (fullPayment) {
      const billItems = quotationItems.map(item => ({
        description: `${item.productName} (${item.creativePackageType} Package: ${new Date(item.creativeDateFrom!).toLocaleDateString('en-IN')} - ${new Date(item.creativeDateTo!).toLocaleDateString('en-IN')})`,
        quantity: item.quantity,
        rate: item.pricePerUnit,
        amount: item.amount,
      }));

      const billSubtotal = billItems.reduce((sum, item) => sum + item.amount, 0);
      const billDiscountAmount = discountValue > 0
        ? discountType === 'percentage'
          ? billSubtotal * (discountValue / 100)
          : discountValue
        : 0;
      const billAfterDiscount = billSubtotal - billDiscountAmount;
      const billGstAmount = includeGst ? billAfterDiscount * (gstPercentage / 100) : 0;
      const billTotal = billAfterDiscount + billGstAmount;

      addBill({
        quotationId: quotationId,
        clientId,
        items: billItems,
        subtotal: billSubtotal,
        includeGst,
        gstPercentage,
        gstAmount: billGstAmount,
        discountType,
        discountValue: discountValue > 0 ? discountValue : undefined,
        totalAmount: billTotal,
        advanceReceived: billTotal, // Full payment received
        balanceAmount: 0,
        paymentStatus: 'Paid',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }, paymentMode);

      toast.success('Creative package quotation and bill created successfully with full payment!');
    } else {
      toast.success('Creative package quotation created successfully!');
    }

    navigate('/creative-packages');
  };

  const selectedClient = clients.find(c => c.id === clientId);

  return (
    <div className="min-h-screen bg-[#1a2b4a]">
      {/* Header */}
      <div className="py-6 px-6 bg-[#1a1a1a]/95 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/creative-packages')}
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
            <div>
              <h1 className="text-white text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-blue-400" />
                Create Creative Package Quotation
              </h1>
              <p className="text-gray-300 text-sm mt-1">
                Simplified quotation for digital creative services
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {creativeProducts.length === 0 && (
          <div className="max-w-5xl mx-auto mb-6">
            <div className="bg-blue-500/20 border-2 border-blue-500/50 rounded-lg p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="text-blue-400 text-3xl mt-1">ℹ️</div>
                <div className="flex-1">
                  <h3 className="text-blue-300 font-bold text-lg mb-2">No Creative Products Available</h3>
                  <p className="text-blue-100 text-sm mb-3">
                    To add products for Creative Quotations, it's simple:
                  </p>
                  <div className="bg-blue-600/20 rounded-md p-3 mb-4 text-sm text-blue-50">
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Go to Product Management</li>
                      <li>Click "Add Product" button</li>
                      <li>Select <strong>"Digital Creative"</strong> from Product Category dropdown</li>
                      <li>Toggle <strong>"Digital Creative Package"</strong> ON</li>
                      <li>Fill in product details and price</li>
                      <li>Save - Product will automatically appear here!</li>
                    </ol>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      onClick={() => navigate('/products')}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    >
                      Go to Product Management →
                    </Button>
                    <Button
                      type="button"
                      onClick={() => navigate('/creative-packages')}
                      variant="outline"
                      className="border-blue-500/50 text-blue-300 hover:bg-blue-500/10"
                    >
                      Back to Creative Packages
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {creativeProducts.length === 0 ? (
          <div className="max-w-5xl mx-auto">
            <Card className="bg-[#1a1a1a]/80 border-gray-700">
              <CardContent className="py-12 text-center">
                <p className="text-gray-400 text-lg">
                  Please add Digital Creative products to continue
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6">
          {/* Client Selection */}
          <Card className="bg-[#1a1a1a]/80 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="client" className="text-gray-200">Select Client</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger id="client" className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Choose a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.companyName} ({client.clientName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedClient && (
                <div className="bg-[#1a2b4a]/50 border border-gray-600 rounded-lg p-4 space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400">Contact</p>
                      <p className="text-gray-200">{selectedClient.contactNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Email</p>
                      <p className="text-gray-200">{selectedClient.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">GST</p>
                      <p className="text-gray-200">{selectedClient.gst || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Address</p>
                      <p className="text-gray-200">{selectedClient.address}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Package Items */}
          <Card className="bg-[#1a1a1a]/80 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Creative Package Items</CardTitle>
                <Button
                  type="button"
                  onClick={addItem}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {items.map((item, index) => (
                <div key={index} className="bg-[#1a2b4a]/50 border border-gray-600 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-semibold">Package #{index + 1}</h4>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Product Selection */}
                    <div className="col-span-2">
                      <Label className="text-gray-200">Select Product/Service</Label>
                      <Select
                        value={item.productId}
                        onValueChange={(value) => handleItemChange(index, 'productId', value)}
                      >
                        <SelectTrigger className="bg-white/5 border-white/20 text-white">
                          <SelectValue placeholder="Choose a creative product" />
                        </SelectTrigger>
                        <SelectContent>
                          {creativeProducts.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                              No digital creative products found.<br/>
                              Add products in Product Management first.
                            </div>
                          ) : (
                            creativeProducts.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.productName} - ₹{product.pricePerUnit.toFixed(2)}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {item.productId && (
                        <p className="text-sm text-gray-400 mt-1">
                          Selected: {item.productName}
                        </p>
                      )}
                    </div>

                    {/* Package Type */}
                    <div>
                      <Label className="text-gray-200">Package Type</Label>
                      <Select
                        value={item.packageType}
                        onValueChange={(value: any) => handleItemChange(index, 'packageType', value)}
                      >
                        <SelectTrigger className="bg-white/5 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Festive">Festive</SelectItem>
                          <SelectItem value="Ads">Ads</SelectItem>
                          <SelectItem value="Both">Both (Festive + Ads)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Quantity */}
                    <div>
                      <Label className="text-gray-200">Quantity (Designs)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="bg-white/5 border-white/20 text-white"
                      />
                    </div>

                    {/* Date From */}
                    <div>
                      <Label className="text-gray-200">Start Date</Label>
                      <Input
                        type="date"
                        value={item.dateFrom}
                        onChange={(e) => handleItemChange(index, 'dateFrom', e.target.value)}
                        className="bg-white/5 border-white/20 text-white"
                      />
                    </div>

                    {/* Date To */}
                    <div>
                      <Label className="text-gray-200">End Date</Label>
                      <Input
                        type="date"
                        value={item.dateTo}
                        onChange={(e) => handleItemChange(index, 'dateTo', e.target.value)}
                        className="bg-white/5 border-white/20 text-white"
                      />
                    </div>

                    {/* Price Per Unit */}
                    <div>
                      <Label className="text-gray-200">Rate per Design (₹)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.pricePerUnit}
                        onChange={(e) => handleItemChange(index, 'pricePerUnit', parseFloat(e.target.value) || 0)}
                        className="bg-white/5 border-white/20 text-white"
                        placeholder="Auto-filled from product"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Default rate from product (can be edited)
                      </p>
                    </div>

                    {/* Amount (readonly) */}
                    <div>
                      <Label className="text-gray-200">Amount (₹)</Label>
                      <Input
                        type="text"
                        value={`₹${item.amount.toFixed(2)}`}
                        readOnly
                        className="bg-white/5 border-white/20 text-green-400 font-semibold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Pricing Details */}
          <Card className="bg-[#1a1a1a]/80 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Pricing Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* GST */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-200">Include GST</Label>
                  <p className="text-sm text-gray-400">Add GST to the quotation</p>
                </div>
                <Switch checked={includeGst} onCheckedChange={setIncludeGst} />
              </div>

              {includeGst && (
                <div>
                  <Label className="text-gray-200">GST Percentage (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={gstPercentage}
                    onChange={(e) => setGstPercentage(parseFloat(e.target.value) || 0)}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
              )}

              <Separator className="bg-gray-600" />

              {/* Discount */}
              <div className="space-y-3">
                <Label className="text-gray-200">Discount (Optional)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Select value={discountType} onValueChange={(value: any) => setDiscountType(value)}>
                      <SelectTrigger className="bg-white/5 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                      placeholder={discountType === 'percentage' ? 'Enter %' : 'Enter ₹'}
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-gray-600" />

              {/* Summary */}
              <div className="bg-[#1a2b4a]/50 border border-gray-600 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-gray-200">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-orange-400">
                    <span>
                      Discount {discountType === 'percentage' ? `(${discountValue}%)` : ''}:
                    </span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {includeGst && (
                  <div className="flex justify-between text-gray-200">
                    <span>GST ({gstPercentage}%):</span>
                    <span>₹{gstAmount.toFixed(2)}</span>
                  </div>
                )}
                <Separator className="bg-gray-600" />
                <div className="flex justify-between text-white text-lg font-bold">
                  <span>Total Amount:</span>
                  <span className="text-green-400">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Full Payment Option */}
          <Card className="bg-[#1a1a1a]/80 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Payment Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-200 flex items-center gap-2">
                    <span className="text-green-400 font-semibold">Full Payment Received</span>
                  </Label>
                  <p className="text-sm text-gray-400 mt-1">
                    Enable this if customer has paid the full amount. Bill will be created automatically without approval.
                  </p>
                </div>
                <Switch checked={fullPayment} onCheckedChange={setFullPayment} />
              </div>

              {fullPayment && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-2 text-green-400 text-sm font-semibold">
                    <Sparkles className="h-4 w-4" />
                    <span>Full Payment Mode - Direct Bill Creation</span>
                  </div>
                  
                  <div>
                    <Label className="text-gray-200">Payment Mode</Label>
                    <Select value={paymentMode} onValueChange={(value: any) => setPaymentMode(value)}>
                      <SelectTrigger className="bg-white/5 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Online">Online</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-white/5 rounded-lg p-3 text-sm text-gray-300">
                    <p className="font-semibold text-green-400 mb-2">What happens when you enable Full Payment:</p>
                    <ul className="space-y-1 ml-4 list-disc">
                      <li>Quotation will be auto-approved</li>
                      <li>Bill will be created instantly</li>
                      <li>Full amount (₹{totalAmount.toFixed(2)}) will be marked as paid</li>
                      <li>Transaction will be recorded in client ledger</li>
                      <li>No approval workflow needed</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/creative-packages')}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {fullPayment ? 'Create Quotation & Bill (Full Payment)' : 'Create Quotation'}
            </Button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}