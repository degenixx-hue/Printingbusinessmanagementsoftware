import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useData } from '../context/DataContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { ArrowLeft, Download, Printer, Share2, MessageSquare, Eye, DollarSign, MoreVertical, Bell } from 'lucide-react';
import { PaymentModeDialog } from '../components/PaymentModeDialog';
import { toast } from 'sonner';
import { generateBillPDF } from '../utils/pdfGenerator';
import degenixLogo from 'figma:asset/e686929947131e66770ed743ba284a27b15aa8de.png';

export default function BillingView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const {
    getBillById,
    getClientById,
    getQuotationById,
    getJobSheetById,
    updateBill,
    companySettings,
    addTransaction,
    getClientBalance,
  } = useData();

  const [bill, setBill] = useState(getBillById(id!));
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [dueDate, setDueDate] = useState(bill?.dueDate || '');
  const [paymentNotes, setPaymentNotes] = useState(bill?.paymentNotes || '');

  useEffect(() => {
    setBill(getBillById(id!));
  }, [id]);

  if (!bill) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Bill not found</h2>
          <Button onClick={() => navigate('/orders')}>Back to Orders</Button>
        </div>
      </div>
    );
  }

  const client = getClientById(bill.clientId);
  const quotation = getQuotationById(bill.quotationId);
  const jobSheet = getJobSheetById(bill.jobSheetId);

  // Check if payment is overdue
  const isOverdue = bill.dueDate && bill.balanceAmount > 0 && new Date(bill.dueDate) < new Date();

  const handlePayment = () => {
    if (paymentAmount > 0 && paymentAmount <= bill.balanceAmount) {
      const newBalanceAmount = bill.balanceAmount - paymentAmount;
      const newPaymentStatus = newBalanceAmount === 0 ? 'Paid' : 'Partial';
      
      updateBill(bill.id, {
        balanceAmount: newBalanceAmount,
        paymentStatus: newPaymentStatus,
        paidAt: newBalanceAmount === 0 ? new Date().toISOString() : undefined,
      });

      setBill({
        ...bill,
        balanceAmount: newBalanceAmount,
        paymentStatus: newPaymentStatus,
      });

      // Add transaction for payment (Credit - payment received)
      addTransaction({
        date: new Date().toISOString(),
        clientId: bill.clientId,
        type: 'Payment',
        description: `Bill ${bill.billNumber} - Payment Received`,
        debit: 0,
        credit: paymentAmount,
        referenceType: 'Bill',
        referenceId: bill.id,
      });

      toast.success('Payment recorded successfully');
      setShowPaymentDialog(false);
      setPaymentAmount(0);
    } else {
      toast.error('Invalid payment amount');
    }
  };

  const handleSaveReminder = () => {
    updateBill(bill.id, {
      dueDate,
      paymentNotes,
    });

    setBill({
      ...bill,
      dueDate,
      paymentNotes,
    });

    toast.success('Payment reminder saved');
    setShowReminderDialog(false);
  };

  const downloadPDF = () => {
    const pdf = generateBillPDF(bill, client, companySettings);
    pdf.save(`Bill_${bill.billNumber}.pdf`);
    toast.success('PDF downloaded');
  };

  const shareOnWhatsApp = () => {
    const message = `Bill ${bill.billNumber}\\nClient: ${client?.companyName}\\nTotal: ₹${bill.totalAmount.toFixed(2)}\\nBalance: ₹${bill.balanceAmount.toFixed(2)}`;
    const url = `https://wa.me/${client?.contactNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const sendThankYouMessage = () => {
    const message = `Thank you for your payment! We have received the full payment of ₹${bill.totalAmount.toFixed(2)} for bill ${bill.billNumber}. We appreciate your business!`;
    const url = `https://wa.me/${client?.contactNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    toast.success('Thank you message sent!');
  };

  const handlePrint = () => {
    const pdf = generateBillPDF(bill, client, companySettings);
    const pdfBlob = pdf.output('blob');
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
            <h1 className="text-white text-2xl font-bold">Bill Details</h1>
          </div>
          <div className="flex items-center gap-2">
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
                {bill.balanceAmount > 0 && (
                  <DropdownMenuItem onClick={() => setShowReminderDialog(true)}>
                    <Bell className="mr-2 h-4 w-4" />
                    Set Payment Reminder
                  </DropdownMenuItem>
                )}
                {bill.paymentStatus === 'Paid' && (
                  <DropdownMenuItem onClick={sendThankYouMessage}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Send Thank You
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Status and Actions */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold mb-2 text-white">{bill.billNumber}</h2>
                <Badge
                  variant={
                    bill.paymentStatus === 'Paid'
                      ? 'default'
                      : bill.paymentStatus === 'Partial'
                      ? 'secondary'
                      : 'destructive'
                  }
                >
                  {bill.paymentStatus}
                </Badge>
              </div>
              {bill.balanceAmount > 0 && (
                <Button
                  onClick={() => setShowPaymentDialog(true)}
                  style={{ backgroundColor: '#1a2b4a' }}
                >
                  Record Payment
                </Button>
              )}
            </div>

            {/* Bill Information */}
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
                <h3 className="font-semibold mb-2 text-white">Bill Information</h3>
                <div className="space-y-1 text-sm text-gray-200">
                  {jobSheet ? (
                    <p><strong className="text-gray-300">Job Sheet:</strong> {jobSheet.jobSheetNumber}</p>
                  ) : (
                    <p><strong className="text-gray-300">Type:</strong> <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Creative Package</Badge></p>
                  )}
                  <p><strong className="text-gray-300">Quotation:</strong> {quotation?.quotationNumber}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bill Items */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4 text-white">Items</h3>
            <table className="w-full">
              <thead className="border-b border-white/20">
                <tr>
                  <th className="text-left py-2 text-gray-200">Description</th>
                  <th className="text-center py-2 text-gray-200">Quantity</th>
                  <th className="text-right py-2 text-gray-200">Rate</th>
                  <th className="text-right py-2 text-gray-200">Amount</th>
                </tr>
              </thead>
              <tbody>
                {bill.items.map((item, index) => (
                  <tr key={index} className="border-b border-white/20">
                    <td className="py-3 text-gray-200">{item.description}</td>
                    <td className="text-center py-3 text-gray-200">{item.quantity}</td>
                    <td className="text-right py-3 text-gray-200">₹{item.rate.toFixed(2)}</td>
                    <td className="text-right py-3 text-gray-200">₹{item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-200">
                <span>Subtotal:</span>
                <span>₹{bill.subtotal.toFixed(2)}</span>
              </div>
              {bill.includeGst && (
                <>
                  <div className="flex justify-between text-sm text-gray-200">
                    <span>CGST ({(bill.gstPercentage / 2).toFixed(2)}%):</span>
                    <span>₹{(bill.gstAmount / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-200">
                    <span>SGST ({(bill.gstPercentage / 2).toFixed(2)}%):</span>
                    <span>₹{(bill.gstAmount / 2).toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between font-bold text-lg border-t border-white/20 pt-2 text-white">
                <span>Total Amount:</span>
                <span>₹{bill.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-300">
                <span>Advance Received:</span>
                <span>₹{bill.advanceReceived.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg" style={{ color: bill.balanceAmount > 0 ? '#ef4444' : '#10b981' }}>
                <span>Balance Amount:</span>
                <span>₹{bill.balanceAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Reminder Card - Only show if balance > 0 */}
          {bill.balanceAmount > 0 && (bill.dueDate || bill.paymentNotes) && (
            <div className={`backdrop-blur-sm border rounded-lg shadow p-6 ${isOverdue ? 'blink-red pulse-red' : 'bg-white/10 border-white/20'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Bell className={`h-5 w-5 ${isOverdue ? 'text-red-400' : 'text-blue-400'}`} />
                  <h3 className={`font-semibold ${isOverdue ? 'text-red-300' : 'text-white'}`}>
                    Payment Reminder {isOverdue && '- OVERDUE!'}
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDueDate(bill.dueDate || '');
                    setPaymentNotes(bill.paymentNotes || '');
                    setShowReminderDialog(true);
                  }}
                  className="text-white hover:bg-white/10"
                >
                  Edit
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {bill.dueDate && (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className={`h-4 w-4 ${isOverdue ? 'text-red-400' : 'text-blue-400'}`} />
                      <span className="text-sm font-medium text-gray-300">Due Date:</span>
                    </div>
                    <p className={`text-lg font-bold ${isOverdue ? 'text-red-300' : 'text-white'}`}>
                      {new Date(bill.dueDate).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    {isOverdue && (
                      <p className="text-xs text-red-400 mt-1">
                        {Math.floor((new Date().getTime() - new Date(bill.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days overdue
                      </p>
                    )}
                  </div>
                )}
                {bill.paymentNotes && (
                  <div>
                    <span className="text-sm font-medium text-gray-300 block mb-2">Notes:</span>
                    <p className="text-white bg-white/5 rounded p-2 text-sm">{bill.paymentNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Show button to add reminder if none exists */}
          {bill.balanceAmount > 0 && !bill.dueDate && !bill.paymentNotes && (
            <div className="bg-blue-500/10 backdrop-blur-sm border border-blue-400/30 rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-blue-400" />
                  <p className="text-blue-200">Set a payment reminder to track when payment is expected</p>
                </div>
                <Button
                  onClick={() => setShowReminderDialog(true)}
                  variant="outline"
                  size="sm"
                  className="text-blue-300 border-blue-400 hover:bg-blue-500/20"
                >
                  Add Reminder
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="paymentAmount">Payment Amount (₹)</Label>
              <Input
                id="paymentAmount"
                type="number"
                step="0.01"
                max={bill.balanceAmount}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                placeholder="Enter payment amount"
              />
            </div>
            <p className="text-sm text-gray-600">
              Balance Amount: ₹{bill.balanceAmount.toFixed(2)}
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handlePayment} style={{ backgroundColor: '#1a2b4a' }}>
                Confirm Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reminder Dialog */}
      <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Set Payment Reminder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="Select due date"
              />
            </div>
            <div>
              <Label htmlFor="paymentNotes">Payment Notes</Label>
              <Input
                id="paymentNotes"
                type="text"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Enter payment notes"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowReminderDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveReminder} style={{ backgroundColor: '#1a2b4a' }}>
                Save Reminder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}