import { useState, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router';
import { useData } from '../context/DataContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Plus, Search, Eye, MoreVertical, Download, Share2, Printer, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { generateQuotationPDF, generateJobSheetPDF, generateBillPDF } from '../utils/pdfGenerator';
import degenixLogo from 'figma:asset/e686929947131e66770ed743ba284a27b15aa8de.png';
import { DateTimeDisplay } from '../components/DateTimeDisplay';

const OrderManagement = memo(() => {
  const navigate = useNavigate();
  const { quotations, jobSheets, bills, getClientById, getProductById, getQuotationById, getVendorAssignmentsByJobSheet, companySettings } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  // Add safety checks
  if (!quotations || !jobSheets || !bills) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0d1b2a' }}>
        <div className="text-center text-white">
          <p>Loading data...</p>
        </div>
      </div>
    );
  }

  const filteredQuotations = useMemo(() => {
    return quotations
      .filter(q => {
        if (!q || !q.items || q.items.length === 0) return false;
        const client = getClientById(q.clientId);
        const searchLower = searchTerm.toLowerCase();
        const hasMatchingItem = q.items.some(item => 
          item?.productName?.toLowerCase().includes(searchLower)
        );
        return (
          q.quotationNumber?.toLowerCase().includes(searchLower) ||
          client?.companyName?.toLowerCase().includes(searchLower) ||
          hasMatchingItem
        );
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [quotations, getClientById, searchTerm]);

  const filteredJobSheets = useMemo(() => {
    return jobSheets
      .filter(js => {
        if (!js) return false;
        const client = getClientById(js.clientId);
        const product = getProductById(js.productId);
        const searchLower = searchTerm.toLowerCase();
        return (
          js.jobSheetNumber?.toLowerCase().includes(searchLower) ||
          client?.companyName?.toLowerCase().includes(searchLower) ||
          product?.productName?.toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [jobSheets, getClientById, getProductById, searchTerm]);

  const filteredBills = useMemo(() => {
    return bills
      .filter(b => {
        if (!b) return false;
        const client = getClientById(b.clientId);
        const searchLower = searchTerm.toLowerCase();
        return (
          b.billNumber?.toLowerCase().includes(searchLower) ||
          client?.companyName?.toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [bills, getClientById, searchTerm]);

  // Download Quotation PDF - Optimized with useCallback
  const downloadQuotationPDF = useCallback((quotation: any) => {
    const client = getClientById(quotation.clientId);
    const doc = generateQuotationPDF(quotation, client, companySettings);
    doc.save(`Quotation_${quotation.quotationNumber}.pdf`);
    toast.success('Quotation PDF downloaded successfully!');
  }, [getClientById, companySettings]);

  // Print Quotation - Optimized with useCallback
  const printQuotation = useCallback((quotation: any) => {
    const client = getClientById(quotation.clientId);
    const doc = generateQuotationPDF(quotation, client, companySettings);
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(pdfUrl);
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    toast.success('Opening print dialog...');
  }, [getClientById, companySettings]);

  // Share Quotation on WhatsApp - Optimized with useCallback
  const shareQuotationOnWhatsApp = useCallback((quotation: any) => {
    const client = getClientById(quotation.clientId);
    const itemsList = quotation.items.map((item: any, i: number) => 
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
    
    const url = `https://wa.me/${client?.contactNumber}?text=${message}`;
    window.open(url, '_blank');
    toast.success('Opening WhatsApp...');
  }, [getClientById]);

  // Send Thank You for Quotation Advance Payment - Optimized with useCallback
  const sendQuotationThankYou = useCallback((quotation: any) => {
    const client = getClientById(quotation.clientId);
    const message = `Thank you for your payment! We have received ₹${quotation.advancePayment.toFixed(2)} for quotation ${quotation.quotationNumber}. We will start working on your order immediately.`;
    const url = `https://wa.me/${client?.contactNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    toast.success('Thank you message sent!');
  }, [getClientById]);

  // Download Job Sheet PDF - Optimized with useCallback
  const downloadJobSheetPDF = useCallback((jobSheet: any) => {
    const client = getClientById(jobSheet.clientId);
    const product = getProductById(jobSheet.productId);
    const doc = generateJobSheetPDF(jobSheet, client, product, companySettings);
    doc.save(`JobSheet_${jobSheet.jobSheetNumber}.pdf`);
    toast.success('Job Sheet PDF downloaded successfully!');
  }, [getClientById, getProductById, companySettings]);

  // Print Job Sheet - Optimized with useCallback
  const printJobSheet = useCallback((jobSheet: any) => {
    const client = getClientById(jobSheet.clientId);
    const product = getProductById(jobSheet.productId);
    const doc = generateJobSheetPDF(jobSheet, client, product, companySettings);
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(pdfUrl);
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    toast.success('Opening print dialog...');
  }, [getClientById, getProductById, companySettings]);

  // Share Job Sheet on WhatsApp - Optimized with useCallback
  const shareJobSheetOnWhatsApp = useCallback((jobSheet: any) => {
    const client = getClientById(jobSheet.clientId);
    const product = getProductById(jobSheet.productId);
    const message = `*JOB SHEET ${jobSheet.jobSheetNumber}*%0A%0A` +
      `Client: ${client?.companyName}%0A` +
      `Product: ${product?.productName}%0A` +
      `Quantity: ${jobSheet.quantity}%0A` +
      `Status: ${jobSheet.status}%0A%0A` +
      `Process Status:%0A` +
      `• Printing: ${jobSheet.processStatus.printing ? '✓ Done' : '○ Pending'}%0A` +
      `• Lamination: ${jobSheet.processStatus.lamination ? '✓ Done' : '○ Pending'}%0A` +
      `• Creasing & Pinning: ${jobSheet.processStatus.creasingAndPinning ? ' Done' : '○ Pending'}%0A` +
      `• Ready to Deliver: ${jobSheet.processStatus.readyToDeliver ? '✓ Done' : '○ Pending'}`;
    
    const url = `https://wa.me/${client?.contactNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    toast.success('Opening WhatsApp...');
  }, [getClientById, getProductById]);

  // Download Bill PDF - Optimized with useCallback
  const downloadBillPDF = useCallback((bill: any) => {
    const client = getClientById(bill.clientId);
    const doc = generateBillPDF(bill, client, companySettings);
    doc.save(`Bill_${bill.billNumber}.pdf`);
    toast.success('Bill PDF downloaded successfully!');
  }, [getClientById, companySettings]);

  // Print Bill - Optimized with useCallback
  const printBill = useCallback((bill: any) => {
    const client = getClientById(bill.clientId);
    const doc = generateBillPDF(bill, client, companySettings);
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(pdfUrl);
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    toast.success('Opening print dialog...');
  }, [getClientById, companySettings]);

  // Share Bill on WhatsApp - Optimized with useCallback
  const shareBillOnWhatsApp = useCallback((bill: any) => {
    const client = getClientById(bill.clientId);
    const message = `*${bill.includeGst ? 'TAX INVOICE' : 'INVOICE'} ${bill.billNumber}*%0A%0A` +
      `Client: ${client?.companyName}%0A%0A` +
      `Total Amount: ₹${bill.totalAmount.toFixed(2)}%0A` +
      `Advance Received: ₹${bill.advanceReceived.toFixed(2)}%0A` +
      `*Balance Amount: ₹${bill.balanceAmount.toFixed(2)}*%0A%0A` +
      `Payment Status: ${bill.paymentStatus}`;
    
    const url = `https://wa.me/${client?.contactNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    toast.success('Opening WhatsApp...');
  }, [getClientById]);

  // Send Thank You for Bill Full Payment - Optimized with useCallback
  const sendBillThankYou = useCallback((bill: any) => {
    const client = getClientById(bill.clientId);
    const message = `Thank you for your payment! We have received full payment of ₹${bill.totalAmount.toFixed(2)} for bill ${bill.billNumber}. Your order has been completed. We appreciate your business!`;
    const url = `https://wa.me/${client?.contactNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    toast.success('Thank you message sent!');
  }, [getClientById]);

  return (
    <div 
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)'
      }}
    >
      {/* Header */}
      <div className="py-6 px-6 bg-[#1a1a1a] border-b border-gray-800 shadow-lg shadow-black/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
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
            <h1 className="text-white text-2xl font-bold">
              Order Management
            </h1>
          </div>
          <DateTimeDisplay />
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <Tabs defaultValue="quotations" className="space-y-6">
          <TabsList className="bg-[#1a1a1a] border border-gray-700 p-1 h-auto">
            <TabsTrigger 
              value="quotations" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-400 hover:text-white transition-all rounded-lg px-4 py-2.5"
            >
              Quotations
              <span className="ml-2 px-2.5 py-1 text-xs rounded-full bg-white/20 font-bold">
                {filteredQuotations.length}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="jobsheets" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-400 hover:text-white transition-all rounded-lg px-4 py-2.5"
            >
              Job Sheets
              <span className="ml-2 px-2.5 py-1 text-xs rounded-full bg-white/20 font-bold">
                {filteredJobSheets.length}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="bills" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-400 hover:text-white transition-all rounded-lg px-4 py-2.5"
            >
              Bills
              <span className="ml-2 px-2.5 py-1 text-xs rounded-full bg-white/20 font-bold">
                {filteredBills.length}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Quotations Tab */}
          <TabsContent value="quotations" className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search quotations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={() => navigate('/orders/quotation/new')}
                style={{ backgroundColor: '#1a2b4a' }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Quotation
              </Button>
            </div>

            <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg shadow overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-700 hover:bg-white/5">
                    <TableHead className="text-gray-200">Client & Quotation</TableHead>
                    <TableHead className="text-gray-200">Product</TableHead>
                    <TableHead className="text-gray-200">Quantity</TableHead>
                    <TableHead className="text-gray-200">Amount</TableHead>
                    <TableHead className="text-gray-200">Status</TableHead>
                    <TableHead className="text-right text-gray-200">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotations.length === 0 ? (
                    <TableRow className="border-b border-white/20 hover:bg-white/5">
                      <TableCell colSpan={6} className="text-center text-gray-300 py-8">
                        No quotations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredQuotations.map((quotation) => {
                      const client = getClientById(quotation.clientId);
                      // Get total quantity and first product name for display
                      const totalQty = quotation.items.reduce((sum, item) => sum + item.quantity, 0);
                      const productDisplay = quotation.items.length === 1 
                        ? quotation.items[0].productName 
                        : `${quotation.items[0].productName} (+${quotation.items.length - 1} more)`;
                      
                      const hasCreativePackage = quotation.items.some(item => item.digitalCreative);
                      const hasPrintingWork = quotation.items.some(item => !item.digitalCreative);
                      
                      return (
                        <TableRow key={quotation.id} className="border-b border-white/20 hover:bg-white/5">
                          <TableCell className="text-gray-200">
                            <div className="flex flex-col">
                              <span className="font-semibold text-base">{client?.companyName}</span>
                              <span className="text-xs text-gray-400 mt-0.5">Quotation No: {quotation.quotationNumber}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-200">
                            <div className="flex items-center gap-2">
                              <span>{productDisplay}</span>
                              {hasCreativePackage && (
                                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                                  Creative
                                </Badge>
                              )}
                              {hasPrintingWork && (
                                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                                  Printing
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-200">{totalQty}</TableCell>
                          <TableCell className="text-gray-200">₹{quotation.totalAmount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                quotation.status === 'Approved'
                                  ? 'default'
                                  : quotation.status === 'Pending'
                                  ? 'secondary'
                                  : 'destructive'
                              }
                            >
                              {quotation.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-200"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => navigate(`/orders/quotation/${quotation.id}`)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => downloadQuotationPDF(quotation)}
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => printQuotation(quotation)}
                                >
                                  <Printer className="mr-2 h-4 w-4" />
                                  Print
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => shareQuotationOnWhatsApp(quotation)}
                                >
                                  <Share2 className="mr-2 h-4 w-4" />
                                  Share
                                </DropdownMenuItem>
                                {quotation.advancePayment > 0 && (
                                  <DropdownMenuItem
                                    onClick={() => sendQuotationThankYou(quotation)}
                                  >
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Send Thank You
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Job Sheets Tab */}
          <TabsContent value="jobsheets" className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search job sheets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg shadow overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-700 hover:bg-white/5">
                    <TableHead className="text-gray-200">Client & Job Sheet</TableHead>
                    <TableHead className="text-gray-200">Product</TableHead>
                    <TableHead className="text-gray-200">Quantity</TableHead>
                    <TableHead className="text-gray-200">Status</TableHead>
                    <TableHead className="text-right text-gray-200">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobSheets.length === 0 ? (
                    <TableRow className="border-b border-white/20 hover:bg-white/5">
                      <TableCell colSpan={5} className="text-center text-gray-300 py-8">
                        No job sheets found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredJobSheets.map((jobSheet) => {
                      const client = getClientById(jobSheet.clientId);
                      const product = getProductById(jobSheet.productId);
                      return (
                        <TableRow key={jobSheet.id} className="border-b border-white/20 hover:bg-white/5">
                          <TableCell className="text-gray-200">
                            <div className="flex flex-col">
                              <span className="font-semibold text-base">{client?.companyName}</span>
                              <span className="text-xs text-gray-400 mt-0.5">Job Sheet No: {jobSheet.jobSheetNumber}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-200">{product?.productName}</TableCell>
                          <TableCell className="text-gray-200">{jobSheet.quantity}</TableCell>
                          <TableCell>
                            <Badge
                              variant={jobSheet.status === 'Completed' ? 'default' : 'secondary'}
                            >
                              {jobSheet.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-200"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => navigate(`/orders/jobsheet/${jobSheet.id}`)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => downloadJobSheetPDF(jobSheet)}
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => printJobSheet(jobSheet)}
                                >
                                  <Printer className="mr-2 h-4 w-4" />
                                  Print
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => shareJobSheetOnWhatsApp(jobSheet)}
                                >
                                  <Share2 className="mr-2 h-4 w-4" />
                                  Share
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Bills Tab */}
          <TabsContent value="bills" className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search bills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg shadow overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-700 hover:bg-white/5">
                    <TableHead className="text-gray-200">Bill No.</TableHead>
                    <TableHead className="text-gray-200">Client</TableHead>
                    <TableHead className="text-gray-200">Total Amount</TableHead>
                    <TableHead className="text-gray-200">Advance</TableHead>
                    <TableHead className="text-gray-200">Balance</TableHead>
                    <TableHead className="text-gray-200">Payment Status</TableHead>
                    <TableHead className="text-right text-gray-200">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBills.length === 0 ? (
                    <TableRow className="border-b border-white/20 hover:bg-white/5">
                      <TableCell colSpan={7} className="text-center text-gray-300 py-8">
                        No bills found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBills.map((bill) => {
                      const client = getClientById(bill.clientId);
                      return (
                        <TableRow key={bill.id} className="border-b border-white/20 hover:bg-white/5">
                          <TableCell className="font-medium text-gray-200">{bill.billNumber}</TableCell>
                          <TableCell className="text-gray-200">{client?.companyName}</TableCell>
                          <TableCell className="text-gray-200">₹{bill.totalAmount.toFixed(2)}</TableCell>
                          <TableCell className="text-gray-200">₹{bill.advanceReceived.toFixed(2)}</TableCell>
                          <TableCell className="text-gray-200">₹{bill.balanceAmount.toFixed(2)}</TableCell>
                          <TableCell>
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
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-200"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => navigate(`/orders/billing/${bill.id}`)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => downloadBillPDF(bill)}
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => printBill(bill)}
                                >
                                  <Printer className="mr-2 h-4 w-4" />
                                  Print
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => shareBillOnWhatsApp(bill)}
                                >
                                  <Share2 className="mr-2 h-4 w-4" />
                                  Share
                                </DropdownMenuItem>
                                {bill.paymentStatus === 'Paid' && (
                                  <DropdownMenuItem
                                    onClick={() => sendBillThankYou(bill)}
                                  >
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Send Thank You
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
});

OrderManagement.displayName = 'OrderManagement';

export default OrderManagement;