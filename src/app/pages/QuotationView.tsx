import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useData } from '../context/DataContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { ArrowLeft, Download, Printer, Trash2, DollarSign, Edit, CheckCircle, Share2, MessageSquare, Eye, MoreVertical } from 'lucide-react';
import { generateQuotationPDF } from '../utils/pdfGenerator';
import { PaymentModeDialog } from '../components/PaymentModeDialog';
import { toast } from 'sonner';
import degenixLogo from 'figma:asset/e686929947131e66770ed743ba284a27b15aa8de.png';

export default function QuotationView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const {
    getQuotationById,
    getClientById,
    updateQuotation,
    deleteQuotation,
    deleteJobSheet,
    deleteBill,
    addJobSheet,
    addBill,
    getJobSheetByQuotationId,
    getBillByQuotationId,
    jobSheets,
    bills,
    currentUser,
    companySettings,
    addTransaction,
    getClientBalance,
  } = useData();

  const [quotation, setQuotation] = useState(getQuotationById(id!));
  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteJobSheetConfirm, setDeleteJobSheetConfirm] = useState(false);
  const [deleteBillConfirm, setDeleteBillConfirm] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [showPaymentModeDialog, setShowPaymentModeDialog] = useState(false);
  const [pendingPaymentMode, setPendingPaymentMode] = useState<'Cash' | 'Online' | 'Cheque' | 'UPI' | 'Other'>('Cash');

  useEffect(() => {
    setQuotation(getQuotationById(id!));
  }, [id]);

  if (!quotation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Quotation not found</h2>
          <Button onClick={() => navigate('/orders')}>Back to Orders</Button>
        </div>
      </div>
    );
  }

  const client = getClientById(quotation.clientId);
  const existingJobSheet = getJobSheetByQuotationId(quotation.id);
  const existingBill = getBillByQuotationId(quotation.id);

  const handleStatusChange = (status: 'Pending' | 'Approved' | 'Rejected') => {
    updateQuotation(quotation.id, { status, approvedAt: status === 'Approved' ? new Date().toISOString() : undefined });
    setQuotation({ ...quotation, status });
    toast.success(`Quotation ${status.toLowerCase()}`);

    if (status === 'Approved' && !existingJobSheet) {
      setShowAdvanceDialog(true);
    }
  };

  const handleAdvancePaymentClick = () => {
    // If advance amount > 0, show payment mode dialog first
    if (advanceAmount > 0) {
      setShowAdvanceDialog(false);
      setShowPaymentModeDialog(true);
    } else {
      // If no advance, just process without payment mode
      processAdvancePayment('Cash'); // Default to Cash for 0 amount
    }
  };

  const processAdvancePayment = (paymentMode: 'Cash' | 'Online' | 'Cheque' | 'UPI' | 'Other') => {
    if (advanceAmount >= 0) {
      updateQuotation(quotation.id, { advancePayment: advanceAmount, advancePaymentMode: advanceAmount > 0 ? paymentMode : undefined });
      setQuotation({ ...quotation, advancePayment: advanceAmount, advancePaymentMode: advanceAmount > 0 ? paymentMode : undefined });
      
      // Create transaction for advance payment if advance > 0
      if (advanceAmount > 0) {
        const clientBalance = getClientBalance(quotation.clientId);
        addTransaction({
          date: new Date().toISOString(),
          clientId: quotation.clientId,
          type: 'Advance',
          description: `Quotation ${quotation.quotationNumber} - Advance Payment Received`,
          debit: 0,
          credit: advanceAmount,
          balance: clientBalance - advanceAmount,
          paymentMode: paymentMode,
          referenceType: 'Quotation',
          referenceId: quotation.id,
        });
      }
      
      // Create Job Sheets only for non-creative items (printing work)
      const nonCreativeItems = quotation.items.filter(item => !item.digitalCreative);
      
      nonCreativeItems.forEach((item) => {
        addJobSheet({
          quotationId: quotation.id,
          clientId: quotation.clientId,
          productId: item.productId,
          quantity: item.quantity,
          specifications: {
            coverPageQuantity: item.coverPageQuantity,
            coverPageGsm: item.coverPageGsm,
            innerPageQuantity: item.innerPageQuantity,
            innerPageGsm: item.innerPageGsm,
            laminationType: item.laminationType,
            uv: item.uv,
            goldFoiling: item.goldFoiling,
          },
          status: 'In Progress',
          processStatus: {
            printing: false,
            lamination: false,
            creasingAndPinning: false,
            readyToDeliver: false,
          },
        });
      });

      const creativeItemsCount = quotation.items.filter(item => item.digitalCreative).length;
      const printingItemsCount = nonCreativeItems.length;
      
      let successMessage = 'Advance payment recorded';
      if (printingItemsCount > 0) {
        successMessage += ` and ${printingItemsCount} Job Sheet${printingItemsCount > 1 ? 's' : ''} created`;
      }
      if (creativeItemsCount > 0) {
        successMessage += `. ${creativeItemsCount} creative package${creativeItemsCount > 1 ? 's' : ''} ready for billing`;
      }
      
      toast.success(successMessage);
      setShowAdvanceDialog(false);
      setShowPaymentModeDialog(false);
    }
  };

  const downloadPDF = () => {
    const doc = generateQuotationPDF(quotation, client, companySettings);
    doc.save(`Quotation_${quotation.quotationNumber}.pdf`);
    toast.success('PDF downloaded');
  };

  const shareOnWhatsApp = () => {
    const itemsList = quotation.items.map((item, i) => 
      `${i + 1}. *${item.productName}* - ${item.quantity} pcs @ ₹${item.pricePerUnit.toFixed(2)} = ₹${item.amount.toFixed(2)}`
    ).join('%0A');
    
    const message = `*QUOTATION ${quotation.quotationNumber}*%0A%0A` +
      `Client: ${client?.companyName}%0A%0A` +
      `*Items:*%0A${itemsList}%0A%0A` +
      `Subtotal: ₹${quotation.subtotal.toFixed(2)}%0A` +
      (quotation.discountValue && quotation.discountValue > 0 
        ? `Discount: ${quotation.discountType === 'percentage' ? quotation.discountValue + '%' : '₹' + quotation.discountValue}%0A` 
        : '') +
      (quotation.includeGst ? `GST (${quotation.gstPercentage}%): ₹${quotation.gstAmount.toFixed(2)}%0A` : '') +
      `*Total Amount: ₹${quotation.totalAmount.toFixed(2)}*%0A%0A` +
      `Status: ${quotation.status}`;
    
    const url = `https://wa.me/?text=${message}`;
    window.open(url, '_blank');
  };

  const sendThankYouMessage = () => {
    const message = `Thank you for your payment! We have received ₹${quotation.advancePayment.toFixed(2)} for quotation ${quotation.quotationNumber}. We will start working on your order immediately.`;
    const url = `https://wa.me/${client?.contactNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    toast.success('Thank you message sent!');
  };

  const handleDeleteQuotation = () => {
    // Find related job sheets and bills
    const relatedJobSheets = jobSheets.filter(js => js.quotationId === quotation.id);
    const relatedBills = bills.filter(b => b.quotationId === quotation.id);

    // If admin is force deleting with related data
    if (currentUser?.role === 'admin' && (relatedJobSheets.length > 0 || relatedBills.length > 0)) {
      // Delete all related job sheets if confirmed
      if (deleteJobSheetConfirm) {
        relatedJobSheets.forEach(js => deleteJobSheet(js.id));
      }
      
      // Delete all related bills if confirmed
      if (deleteBillConfirm) {
        relatedBills.forEach(b => deleteBill(b.id));
      }
    }

    // Delete the quotation
    deleteQuotation(quotation.id);
    toast.success('Quotation and related data deleted successfully');
    navigate('/orders');
  };

  const handleCreateDirectBill = () => {
    // Create bill directly for creative packages (without job sheet)
    const creativeItems = quotation.items.filter(item => item.digitalCreative);
    
    if (creativeItems.length === 0) {
      toast.error('No creative items found');
      return;
    }
    
    const billItems = creativeItems.map(item => ({
      description: `${item.productName} - ${item.creativePackageType} Package (${new Date(item.creativeDateFrom || '').toLocaleDateString()} to ${new Date(item.creativeDateTo || '').toLocaleDateString()})`,
      quantity: item.quantity,
      rate: item.pricePerUnit,
      amount: item.amount,
    }));

    // Calculate totals for creative items only
    const creativeSubtotal = creativeItems.reduce((sum, item) => sum + item.amount, 0);
    
    // Apply proportional discount if exists
    let creativeDiscount = 0;
    if (quotation.discountValue && quotation.discountValue > 0) {
      if (quotation.discountType === 'percentage') {
        creativeDiscount = creativeSubtotal * (quotation.discountValue / 100);
      } else {
        // For fixed discount, apply proportionally based on creative items' share
        const proportion = creativeSubtotal / quotation.subtotal;
        creativeDiscount = quotation.discountValue * proportion;
      }
    }
    
    const creativeAfterDiscount = creativeSubtotal - creativeDiscount;
    
    // Calculate GST for creative items
    const creativeGstAmount = quotation.includeGst 
      ? creativeAfterDiscount * (quotation.gstPercentage / 100)
      : 0;
    
    const creativeTotalAmount = creativeAfterDiscount + creativeGstAmount;
    
    // Determine advance allocation (proportional to creative items)
    const advanceForCreative = quotation.items.length === creativeItems.length 
      ? quotation.advancePayment  // All items are creative
      : (creativeTotalAmount / quotation.totalAmount) * quotation.advancePayment; // Proportional

    const newBill = {
      quotationId: quotation.id,
      clientId: quotation.clientId,
      items: billItems,
      subtotal: creativeSubtotal,
      includeGst: quotation.includeGst,
      gstPercentage: quotation.gstPercentage,
      gstAmount: creativeGstAmount,
      discountType: quotation.discountType,
      discountValue: quotation.discountType === 'percentage' 
        ? quotation.discountValue 
        : creativeDiscount,
      totalAmount: creativeTotalAmount,
      advanceReceived: advanceForCreative,
      balanceAmount: creativeTotalAmount - advanceForCreative,
      paymentStatus: (creativeTotalAmount - advanceForCreative) === 0 ? 'Paid' as const : 
                     advanceForCreative > 0 ? 'Partial' as const : 'Pending' as const,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    };

    addBill(newBill);
    
    // Add transaction for bill creation (Debit - balance amount only, as advance was already recorded)
    if (newBill.balanceAmount > 0) {
      const clientBalance = getClientBalance(quotation.clientId);
      addTransaction({
        date: new Date().toISOString(),
        clientId: quotation.clientId,
        type: 'Bill',
        description: `Creative Package Bill - Quotation ${quotation.quotationNumber}`,
        debit: newBill.balanceAmount,
        credit: 0,
        balance: clientBalance + newBill.balanceAmount,
        referenceType: 'Bill',
        referenceId: quotation.id,
      });
    }

    toast.success('Bill created successfully for creative package!');
    
    // Small delay to ensure bill is saved before fetching
    setTimeout(() => {
      const createdBill = getBillByQuotationId(quotation.id);
      if (createdBill) {
        navigate(`/orders/billing/${createdBill.id}`);
      }
    }, 100);
  };

  const handleDeleteDialogOpen = () => {
    // Find related job sheets and bills
    const relatedJobSheets = jobSheets.filter(js => js.quotationId === quotation.id);
    const relatedBills = bills.filter(b => b.quotationId === quotation.id);
    
    // Auto-check related items for admin
    if (currentUser?.role === 'admin') {
      setDeleteJobSheetConfirm(relatedJobSheets.length > 0);
      setDeleteBillConfirm(relatedBills.length > 0);
    } else {
      setDeleteJobSheetConfirm(false);
      setDeleteBillConfirm(false);
    }
    
    setShowDeleteDialog(true);
  };

  const handlePrint = () => {
    const doc = generateQuotationPDF(quotation, client, companySettings);
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(pdfUrl);
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  return (
    <div 
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)'
      }}
    >
      {/* Header */}
      <div className="py-4 px-6 bg-[#1a1a1a] border-b border-gray-800 shadow-lg shadow-black/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/orders')}
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
            <h1 className="text-white text-2xl font-bold">Quotation Details</h1>
          </div>
          <div className="flex items-center gap-2">
            {quotation.status === 'Pending' && !existingJobSheet && (
              <Button
                onClick={() => navigate(`/orders/edit-quotation/${quotation.id}`)}
                style={{ backgroundColor: '#1a2b4a' }}
                className="hover:opacity-90"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={downloadPDF}>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={shareOnWhatsApp}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share on WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </DropdownMenuItem>
                {quotation.advancePayment > 0 && (
                  <DropdownMenuItem onClick={sendThankYouMessage}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Send Thank You
                  </DropdownMenuItem>
                )}
                {/* Admins can delete anytime */}
                {currentUser?.role === 'admin' && (
                  <DropdownMenuItem onClick={handleDeleteDialogOpen} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Quotation
                  </DropdownMenuItem>
                )}
                {/* Regular users can only delete pending quotations without job sheets */}
                {currentUser?.role !== 'admin' && quotation.status === 'Pending' && !existingJobSheet && (
                  <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Quotation
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Status and Actions */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold mb-2 text-white">{quotation.quotationNumber}</h2>
                <Badge
                  variant={
                    quotation.status === 'Approved'
                      ? 'default'
                      : quotation.status === 'Rejected'
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {quotation.status}
                </Badge>
              </div>
              {quotation.status === 'Pending' && (
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleStatusChange('Approved')}
                    style={{ backgroundColor: '#10b981' }}
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleStatusChange('Rejected')}
                    variant="destructive"
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>

            {/* Client & Quotation Info */}
            <div className="grid grid-cols-2 gap-6 mt-6">
              <div>
                <h3 className="font-semibold mb-2 text-white">Client Information</h3>
                <div className="space-y-1 text-sm text-gray-200">
                  <p><strong className="text-gray-300">Company:</strong> {client?.companyName}</p>
                  <p><strong className="text-gray-300">Name:</strong> {client?.clientName}</p>
                  <p><strong className="text-gray-300">Contact:</strong> {client?.contactNumber}</p>
                  <p><strong className="text-gray-300">Email:</strong> {client?.email}</p>
                  <p><strong className="text-gray-300">Address:</strong> {client?.address}</p>
                  <p><strong className="text-gray-300">GST:</strong> {client?.gst}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-white">Quotation Summary</h3>
                <div className="space-y-1 text-sm text-gray-200">
                  <p><strong className="text-gray-300">Total Items:</strong> {quotation.items.length}</p>
                  <p><strong className="text-gray-300">Subtotal:</strong> ₹{quotation.subtotal.toFixed(2)}</p>
                  {quotation.discountValue && quotation.discountValue > 0 && (
                    <p><strong className="text-gray-300">Discount:</strong> {quotation.discountType === 'percentage' ? `${quotation.discountValue}%` : `₹${quotation.discountValue}`}</p>
                  )}
                  {quotation.includeGst && (
                    <p><strong className="text-gray-300">GST ({quotation.gstPercentage}%):</strong> ₹{quotation.gstAmount.toFixed(2)}</p>
                  )}
                  <p><strong className="text-gray-300">Total Amount:</strong> ₹{quotation.totalAmount.toFixed(2)}</p>
                  {quotation.advancePayment > 0 && (
                    <>
                      <p><strong className="text-gray-300">Advance Paid:</strong> ₹{quotation.advancePayment.toFixed(2)}</p>
                      <p><strong className="text-gray-300">Balance:</strong> ₹{(quotation.totalAmount - quotation.advancePayment).toFixed(2)}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4 text-white">Quotation Items</h3>
            <div className="space-y-4">
              {quotation.items.map((item, index) => (
                <div
                  key={index}
                  className="bg-white/5 border border-white/10 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-white">{item.productName}</h4>
                      {item.digitalCreative ? (
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                          Creative Package
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                          Printing Work
                        </Badge>
                      )}
                    </div>
                    <span className="text-lg font-bold text-green-400">₹{item.amount.toFixed(2)}</span>
                  </div>
                  {item.digitalCreative ? (
                    <div className="flex gap-4 text-xs text-gray-300 mt-2">
                      <div>Package Type: {item.creativePackageType}</div>
                      <div>From: {new Date(item.creativeDateFrom || '').toLocaleDateString()}</div>
                      <div>To: {new Date(item.creativeDateTo || '').toLocaleDateString()}</div>
                      <div>Qty: {item.quantity} designs</div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-4 gap-4 text-xs text-gray-300">
                        <div>Qty: {item.quantity}</div>
                        <div>Rate: ₹{item.pricePerUnit.toFixed(2)}</div>
                        <div>Cover: {item.coverPageQuantity}@{item.coverPageGsm}gsm</div>
                        <div>Inner: {item.innerPageQuantity}@{item.innerPageGsm}gsm</div>
                      </div>
                      <div className="flex gap-4 text-xs text-gray-300 mt-2">
                        <div>Lamination: {item.laminationType}</div>
                        <div>UV: {item.uv ? 'Yes' : 'No'}</div>
                        <div>Gold: {item.goldFoiling ? 'Yes' : 'No'}</div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Workflow Status */}
          {quotation.status === 'Approved' && (
            <div className="space-y-4">
              {/* Job Sheet Status for Printing Items */}
              {quotation.items.some(item => !item.digitalCreative) && (
                <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-200 font-semibold">
                        📋 Printing Items Workflow
                      </p>
                      <p className="text-blue-300 text-sm mt-1">
                        {existingJobSheet 
                          ? 'Job Sheets created for printing work' 
                          : 'Ready to create Job Sheets for printing work'}
                      </p>
                    </div>
                    {existingJobSheet ? (
                      <Button
                        onClick={() => navigate(`/orders/jobsheet/${existingJobSheet.id}`)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        View Job Sheet →
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setShowAdvanceDialog(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Create Job Sheet
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Creative Package Status */}
              {quotation.items.some(item => item.digitalCreative) && (
                <div className="bg-purple-500/20 border border-purple-400/30 rounded-lg p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-200 font-semibold">
                        ✨ Creative Package Workflow
                      </p>
                      <p className="text-purple-300 text-sm mt-1">
                        {existingBill
                          ? 'Bill created for creative package'
                          : 'Creative packages bypass job sheets and go directly to billing'}
                      </p>
                    </div>
                    {existingBill ? (
                      <Button
                        onClick={() => navigate(`/orders/billing/${existingBill.id}`)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        View Bill →
                      </Button>
                    ) : (
                      <Button
                        onClick={handleCreateDirectBill}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Create Bill →
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Advance Payment Dialog */}
      <Dialog open={showAdvanceDialog} onOpenChange={setShowAdvanceDialog}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Record Advance Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="advanceAmount">Advance Amount (₹)</Label>
              <Input
                id="advanceAmount"
                type="number"
                step="0.01"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(parseFloat(e.target.value) || 0)}
                placeholder="Enter advance amount (or 0 for no advance)"
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Total Amount: ₹{quotation.totalAmount.toFixed(2)}
              </p>
              {quotation.items.some(item => item.digitalCreative) && quotation.items.some(item => !item.digitalCreative) && (
                <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                  ℹ️ This quotation has both creative and printing items. Job sheets will be created for printing items only.
                </p>
              )}
              {quotation.items.every(item => item.digitalCreative) && (
                <p className="text-sm text-purple-600 bg-purple-50 p-2 rounded">
                  ✨ This quotation contains only creative packages. No job sheets will be created.
                </p>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAdvanceDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdvancePaymentClick} style={{ backgroundColor: '#1a2b4a' }}>
                {quotation.items.some(item => !item.digitalCreative) 
                  ? 'Confirm & Create Job Sheets' 
                  : 'Confirm Payment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Mode Dialog */}
      <PaymentModeDialog
        open={showPaymentModeDialog}
        onClose={() => setShowPaymentModeDialog(false)}
        onConfirm={processAdvancePayment}
        amount={advanceAmount}
        title="Select Payment Mode"
        description={`Record payment mode for advance payment of ₹${advanceAmount.toFixed(2)}`}
      />

      {/* Delete Quotation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Delete Quotation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this quotation? This action cannot be undone.
            </p>
            {currentUser?.role === 'admin' && (
              <>
                {(jobSheets.filter(js => js.quotationId === quotation.id).length > 0 || 
                  bills.filter(b => b.quotationId === quotation.id).length > 0) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-sm text-yellow-800 font-semibold mb-2">Related Data Found:</p>
                    {jobSheets.filter(js => js.quotationId === quotation.id).length > 0 && (
                      <div className="flex items-center space-x-2 mb-2">
                        <Checkbox
                          id="deleteJobSheetConfirm"
                          checked={deleteJobSheetConfirm}
                          onCheckedChange={(checked) => setDeleteJobSheetConfirm(checked as boolean)}
                        />
                        <Label htmlFor="deleteJobSheetConfirm" className="text-sm text-yellow-800">
                          Delete {jobSheets.filter(js => js.quotationId === quotation.id).length} related Job Sheet(s)
                        </Label>
                      </div>
                    )}
                    {bills.filter(b => b.quotationId === quotation.id).length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="deleteBillConfirm"
                          checked={deleteBillConfirm}
                          onCheckedChange={(checked) => setDeleteBillConfirm(checked as boolean)}
                        />
                        <Label htmlFor="deleteBillConfirm" className="text-sm text-yellow-800">
                          Delete {bills.filter(b => b.quotationId === quotation.id).length} related Bill(s)
                        </Label>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleDeleteQuotation} variant="destructive">
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}