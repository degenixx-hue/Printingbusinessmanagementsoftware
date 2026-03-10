import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useData } from '../context/DataContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ArrowLeft, Download, DollarSign, TrendingUp, TrendingDown, FileText, Printer, Search, Wallet, AlertCircle, BarChart3, PieChart, Plus } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import degenixLogo from 'figma:asset/e686929947131e66770ed743ba284a27b15aa8de.png';
import { generateLedgerPDF, generateClientLedgerPDF } from '../utils/pdfGenerator';
import { DateTimeDisplay } from '../components/DateTimeDisplay';

export default function Accounts() {
  const navigate = useNavigate();
  const { 
    clients, 
    transactions, 
    getClientTransactions, 
    getClientBalance, 
    companySettings,
    vendors,
    vendorTransactions,
    getVendorTransactions,
    getVendorBalance,
    quotations,
    bills,
    addTransaction,
  } = useData();
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    clientId: '',
    amount: 0,
    paymentMode: 'Cash' as 'Cash' | 'Online' | 'Cheque' | 'UPI' | 'Other',
    description: '',
  });

  // Helper function to format currency consistently
  const formatAmount = (amount: number): string => {
    return amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const clientTransactions = selectedClient ? getClientTransactions(selectedClient) : transactions;
  const clientBalance = selectedClient ? getClientBalance(selectedClient) : 0;

  const vendorTransactionsList = selectedVendor ? getVendorTransactions(selectedVendor) : vendorTransactions;
  const vendorBalance = selectedVendor ? getVendorBalance(selectedVendor) : 0;

  const filteredTransactions = clientTransactions.filter(t => {
    const client = clients.find(c => c.id === t.clientId);
    return (
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client?.companyName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const filteredVendorTransactions = vendorTransactionsList.filter(t => {
    const vendor = vendors.find(c => c.id === t.vendorId);
    return (
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor?.companyName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Calculate summary
  const totalDebit = transactions.reduce((sum, t) => sum + t.debit, 0);
  const totalCredit = transactions.reduce((sum, t) => sum + t.credit, 0);
  const netBalance = totalDebit - totalCredit;

  const exportLedger = () => {
    const data = filteredTransactions.map(transaction => {
      const client = clients.find(c => c.id === transaction.clientId);
      return {
        Date: new Date(transaction.date).toLocaleDateString(),
        Client: client?.companyName || '',
        Type: transaction.type,
        Description: transaction.description,
        Debit: transaction.debit,
        Credit: transaction.credit,
        Balance: transaction.balance,
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ledger');
    XLSX.writeFile(wb, `ledger_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Ledger exported to Excel');
  };

  const exportClientLedger = () => {
    if (!selectedClient) return;
    
    const client = clients.find(c => c.id === selectedClient);
    const data = filteredTransactions.map(transaction => ({
      Date: new Date(transaction.date).toLocaleDateString(),
      Type: transaction.type,
      Description: transaction.description,
      Debit: transaction.debit,
      Credit: transaction.credit,
      Balance: transaction.balance,
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Client Ledger');
    XLSX.writeFile(wb, `${client?.companyName}_ledger_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Client ledger exported to Excel');
  };

  // Handler for recording additional payment
  const handleRecordPayment = () => {
    if (!paymentForm.clientId) {
      toast.error('Please select a client');
      return;
    }
    if (paymentForm.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const client = clients.find(c => c.id === paymentForm.clientId);
    
    // Add payment transaction
    addTransaction({
      date: new Date().toISOString(),
      clientId: paymentForm.clientId,
      type: 'Payment',
      description: paymentForm.description || `Additional Payment Received from ${client?.companyName}`,
      debit: 0,
      credit: paymentForm.amount,
      paymentMode: paymentForm.paymentMode,
      referenceType: 'Manual',
      referenceId: '',
    });

    toast.success(`Payment of Rs. ${formatAmount(paymentForm.amount)} recorded successfully`);
    setShowPaymentDialog(false);
    setPaymentForm({
      clientId: '',
      amount: 0,
      paymentMode: 'Cash',
      description: '',
    });
  };

  const printLedger = () => {
    const data = filteredTransactions.map(transaction => {
      const client = clients.find(c => c.id === transaction.clientId);
      return {
        Date: new Date(transaction.date).toLocaleDateString(),
        Client: client?.companyName || '',
        Type: transaction.type,
        Description: transaction.description,
        Debit: transaction.debit,
        Credit: transaction.credit,
        Balance: transaction.balance,
      };
    });
    generateLedgerPDF(data);
  };

  const printClientLedger = () => {
    if (!selectedClient) return;
    
    const client = clients.find(c => c.id === selectedClient);
    const data = filteredTransactions.map(transaction => ({
      Date: new Date(transaction.date).toLocaleDateString(),
      Type: transaction.type,
      Description: transaction.description,
      Debit: transaction.debit,
      Credit: transaction.credit,
      Balance: transaction.balance,
    }));
    
    generateClientLedgerPDF(data, client?.companyName || '');
  };

  // Calculate comprehensive client outstandings
  interface QuotationOutstanding {
    quotationId: string;
    quotationNumber: string;
    clientId: string;
    clientName: string;
    companyName: string;
    quotationDate: string;
    quotedAmount: number;
    advancePaid: number;
    remainingBalance: number;
  }

  interface BillOutstanding {
    billId: string;
    billNumber: string;
    clientId: string;
    clientName: string;
    companyName: string;
    billDate: string;
    billedAmount: number;
    advancePaid: number;
    remainingBalance: number;
  }

  const calculateQuotationOutstandings = (): QuotationOutstanding[] => {
    return quotations
      .filter(q => q.status === 'Approved')
      .filter(q => {
        // Exclude quotations that have bills generated
        const hasBill = bills.some(b => b.quotationId === q.id);
        return !hasBill;
      })
      .map(quotation => {
        const client = clients.find(c => c.id === quotation.clientId);
        // Note: quotation.totalAmount is the final amount after discount and including GST
        // This ensures all balances are calculated based on the discounted quotation amount
        const advancePaid = quotation.advancePayment || 0;
        const remainingBalance = quotation.totalAmount - advancePaid;

        return {
          quotationId: quotation.id,
          quotationNumber: quotation.quotationNumber,
          clientId: quotation.clientId,
          clientName: client?.contactPerson || '',
          companyName: client?.companyName || '',
          quotationDate: quotation.createdAt,
          quotedAmount: quotation.totalAmount, // Final amount after discount
          advancePaid,
          remainingBalance, // Outstanding after discount
        };
      })
      .filter(q => q.remainingBalance > 0); // Only show if there's outstanding
  };

  const calculateBillOutstandings = (): BillOutstanding[] => {
    return bills.map(bill => {
      const client = clients.find(c => c.id === bill.clientId);
      // Note: bill.totalAmount is the final amount after discount and including GST
      // This ensures all balances are calculated based on the discounted bill amount
      const totalPaid = bill.totalAmount - bill.balanceAmount; // Total paid so far
      const remainingBalance = bill.balanceAmount;

      return {
        billId: bill.id,
        billNumber: bill.billNumber,
        clientId: bill.clientId,
        clientName: client?.contactPerson || '',
        companyName: client?.companyName || '',
        billDate: bill.createdAt,
        billedAmount: bill.totalAmount, // Final amount after discount
        advancePaid: totalPaid, // Show total paid (not just advance)
        remainingBalance, // Outstanding after discount
      };
    }).filter(b => b.remainingBalance > 0); // Only show if there's outstanding
  };

  const quotationOutstandings = calculateQuotationOutstandings();
  const billOutstandings = calculateBillOutstandings();

  const filteredQuotationOutstandings = quotationOutstandings.filter(q =>
    q.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBillOutstandings = billOutstandings.filter(b =>
    b.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.billNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportOutstandings = () => {
    // Export Quotation Outstandings
    const quotationData = filteredQuotationOutstandings.map(q => ({
      'Type': 'Quotation',
      'Number': q.quotationNumber,
      'Company': q.companyName,
      'Contact Person': q.clientName,
      'Date': new Date(q.quotationDate).toLocaleDateString(),
      'Quoted Amount (After Discount)': q.quotedAmount,
      'Advance Paid': q.advancePaid,
      'Remaining Balance': q.remainingBalance,
    }));

    // Export Bill Outstandings
    const billData = filteredBillOutstandings.map(b => ({
      'Type': 'Bill',
      'Number': b.billNumber,
      'Company': b.companyName,
      'Contact Person': b.clientName,
      'Date': new Date(b.billDate).toLocaleDateString(),
      'Billed Amount (After Discount)': b.billedAmount,
      'Amount Paid': b.advancePaid,
      'Remaining Balance': b.remainingBalance,
    }));

    // Combine both sheets
    const wb = XLSX.utils.book_new();
    
    const wsQuotations = XLSX.utils.json_to_sheet(quotationData);
    XLSX.utils.book_append_sheet(wb, wsQuotations, 'Quotation Outstanding');
    
    const wsBills = XLSX.utils.json_to_sheet(billData);
    XLSX.utils.book_append_sheet(wb, wsBills, 'Bill Outstanding');
    
    XLSX.writeFile(wb, `outstandings_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Outstanding balances exported to Excel');
  };

  // Financial Reports Calculations
  const calculateFinancialReports = () => {
    // Calculate Total Revenue (all bills)
    const totalRevenue = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
    
    // Calculate Total Expenses (all vendor payments)
    const totalExpenses = vendorTransactions.reduce((sum, t) => sum + t.debit, 0);
    
    // Calculate Gross Profit
    const grossProfit = totalRevenue - totalExpenses;
    
    // Calculate Total Outstanding (Receivables)
    const totalReceivables = [...billOutstandings, ...quotationOutstandings].reduce((sum, item) => sum + item.remainingBalance, 0);
    
    // Calculate Total Payables (Vendor Outstanding)
    const totalPayables = vendorTransactions.reduce((sum, t) => {
      const vendor = vendors.find(v => v.id === t.vendorId);
      const vendorBal = vendor ? getVendorBalance(vendor.id) : 0;
      return vendorBal < 0 ? sum + Math.abs(vendorBal) : sum;
    }, 0);
    
    // Calculate Current Assets
    const cashInHand = totalCredit; // Total cash received
    const currentAssets = cashInHand + totalReceivables;
    
    // Calculate Current Liabilities
    const currentLiabilities = totalPayables;
    
    // Calculate Net Assets
    const netAssets = currentAssets - currentLiabilities;
    
    // Ratio Analysis
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
    const debtToEquityRatio = netAssets > 0 ? currentLiabilities / netAssets : 0;
    const returnOnAssets = currentAssets > 0 ? (grossProfit / currentAssets) * 100 : 0;
    
    return {
      totalRevenue,
      totalExpenses,
      grossProfit,
      totalReceivables,
      totalPayables,
      cashInHand,
      currentAssets,
      currentLiabilities,
      netAssets,
      profitMargin,
      currentRatio,
      debtToEquityRatio,
      returnOnAssets,
    };
  };

  const financialData = calculateFinancialReports();

  const exportFinancialReports = () => {
    const balanceSheetData = [
      { 'Category': 'ASSETS', 'Particulars': '', 'Amount (₹)': '' },
      { 'Category': 'Current Assets', 'Particulars': 'Cash in Hand', 'Amount (₹)': financialData.cashInHand.toFixed(2) },
      { 'Category': 'Current Assets', 'Particulars': 'Accounts Receivable', 'Amount (₹)': financialData.totalReceivables.toFixed(2) },
      { 'Category': 'Total Assets', 'Particulars': '', 'Amount (₹)': financialData.currentAssets.toFixed(2) },
      { 'Category': '', 'Particulars': '', 'Amount (₹)': '' },
      { 'Category': 'LIABILITIES', 'Particulars': '', 'Amount (₹)': '' },
      { 'Category': 'Current Liabilities', 'Particulars': 'Accounts Payable', 'Amount (₹)': financialData.totalPayables.toFixed(2) },
      { 'Category': 'Total Liabilities', 'Particulars': '', 'Amount (₹)': financialData.currentLiabilities.toFixed(2) },
      { 'Category': '', 'Particulars': '', 'Amount (₹)': '' },
      { 'Category': 'NET ASSETS', 'Particulars': '', 'Amount (₹)': financialData.netAssets.toFixed(2) },
    ];

    const profitLossData = [
      { 'Particulars': 'Total Revenue (Sales)', 'Amount (₹)': financialData.totalRevenue.toFixed(2) },
      { 'Particulars': 'Less: Total Expenses', 'Amount (₹)': financialData.totalExpenses.toFixed(2) },
      { 'Particulars': '', 'Amount (₹)': '' },
      { 'Particulars': 'Gross Profit', 'Amount (₹)': financialData.grossProfit.toFixed(2) },
      { 'Particulars': 'Profit Margin (%)', 'Amount (₹)': financialData.profitMargin.toFixed(2) + '%' },
    ];

    const ratioAnalysisData = [
      { 'Ratio': 'Profit Margin', 'Value': financialData.profitMargin.toFixed(2) + '%', 'Interpretation': 'Profitability measure' },
      { 'Ratio': 'Current Ratio', 'Value': financialData.currentRatio.toFixed(2), 'Interpretation': 'Liquidity measure' },
      { 'Ratio': 'Debt to Equity Ratio', 'Value': financialData.debtToEquityRatio.toFixed(2), 'Interpretation': 'Leverage measure' },
      { 'Ratio': 'Return on Assets (ROA)', 'Value': financialData.returnOnAssets.toFixed(2) + '%', 'Interpretation': 'Efficiency measure' },
    ];

    const wb = XLSX.utils.book_new();
    
    const wsBalanceSheet = XLSX.utils.json_to_sheet(balanceSheetData);
    XLSX.utils.book_append_sheet(wb, wsBalanceSheet, 'Balance Sheet');
    
    const wsProfitLoss = XLSX.utils.json_to_sheet(profitLossData);
    XLSX.utils.book_append_sheet(wb, wsProfitLoss, 'Profit & Loss');
    
    const wsRatioAnalysis = XLSX.utils.json_to_sheet(ratioAnalysisData);
    XLSX.utils.book_append_sheet(wb, wsRatioAnalysis, 'Ratio Analysis');
    
    XLSX.writeFile(wb, `financial_reports_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Financial reports exported to Excel');
  };

  // Calculate Month-wise Sales Register
  interface MonthlySales {
    month: string;
    year: number;
    monthYear: string;
    totalSales: number;
    billCount: number;
    averageSale: number;
    bills: typeof bills;
  }

  const calculateMonthlySales = (): MonthlySales[] => {
    const monthlyData: { [key: string]: MonthlySales } = {};

    bills.forEach(bill => {
      const date = new Date(bill.createdAt);
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const monthName = monthNames[month];
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      const monthYear = `${monthName} ${year}`;

      if (!monthlyData[key]) {
        monthlyData[key] = {
          month: monthName,
          year,
          monthYear,
          totalSales: 0,
          billCount: 0,
          averageSale: 0,
          bills: [],
        };
      }

      monthlyData[key].totalSales += bill.totalAmount;
      monthlyData[key].billCount += 1;
      monthlyData[key].bills.push(bill);
    });

    // Calculate average and convert to array
    const salesArray = Object.values(monthlyData).map(data => ({
      ...data,
      averageSale: data.billCount > 0 ? data.totalSales / data.billCount : 0,
    }));

    // Sort by year and month (newest first)
    return salesArray.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      const monthA = new Date(`${a.month} 1, ${a.year}`).getMonth();
      const monthB = new Date(`${b.month} 1, ${b.year}`).getMonth();
      return monthB - monthA;
    });
  };

  const monthlySalesData = calculateMonthlySales();

  const exportSalesRegister = () => {
    const data = monthlySalesData.map(month => ({
      'Month': month.monthYear,
      'Total Sales (Rs.)': month.totalSales.toFixed(2),
      'Number of Bills': month.billCount,
      'Average Sale (Rs.)': month.averageSale.toFixed(2),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales Register');
    XLSX.writeFile(wb, `sales_register_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Sales register exported to Excel');
  };

  // Calculate Month-wise Purchase Register
  interface MonthlyPurchases {
    month: string;
    year: number;
    monthYear: string;
    totalPurchases: number;
    transactionCount: number;
    averagePurchase: number;
    transactions: typeof vendorTransactions;
  }

  const calculateMonthlyPurchases = (): MonthlyPurchases[] => {
    const monthlyData: { [key: string]: MonthlyPurchases } = {};

    // Use vendor transactions where debit > 0 (purchases/expenses)
    vendorTransactions.filter(t => t.debit > 0).forEach(transaction => {
      const date = new Date(transaction.date);
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const monthName = monthNames[month];
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      const monthYear = `${monthName} ${year}`;

      if (!monthlyData[key]) {
        monthlyData[key] = {
          month: monthName,
          year,
          monthYear,
          totalPurchases: 0,
          transactionCount: 0,
          averagePurchase: 0,
          transactions: [],
        };
      }

      monthlyData[key].totalPurchases += transaction.debit;
      monthlyData[key].transactionCount += 1;
      monthlyData[key].transactions.push(transaction);
    });

    // Calculate average and convert to array
    const purchasesArray = Object.values(monthlyData).map(data => ({
      ...data,
      averagePurchase: data.transactionCount > 0 ? data.totalPurchases / data.transactionCount : 0,
    }));

    // Sort by year and month (newest first)
    return purchasesArray.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      const monthA = new Date(`${a.month} 1, ${a.year}`).getMonth();
      const monthB = new Date(`${b.month} 1, ${b.year}`).getMonth();
      return monthB - monthA;
    });
  };

  const monthlyPurchasesData = calculateMonthlyPurchases();

  const exportPurchaseRegister = () => {
    const data = monthlyPurchasesData.map(month => ({
      'Month': month.monthYear,
      'Total Purchases (Rs.)': month.totalPurchases.toFixed(2),
      'Number of Transactions': month.transactionCount,
      'Average Purchase (Rs.)': month.averagePurchase.toFixed(2),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Purchase Register');
    XLSX.writeFile(wb, `purchase_register_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Purchase register exported to Excel');
  };

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
            <div>
              <h1 className="text-white text-2xl font-bold">
                Accounts & Ledger
              </h1>
              <p className="text-gray-300 text-sm font-medium">{companySettings.companyName}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <DateTimeDisplay />
            <Button 
              onClick={() => setShowPaymentDialog(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Download className="mr-2 h-4 w-4" />
                  Export to Excel
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={selectedClient ? exportClientLedger : exportLedger}>
                  <Download className="mr-2 h-4 w-4" />
                  Export to Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={selectedClient ? printClientLedger : printLedger}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print Ledger
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportOutstandings}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Client Outstandings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportFinancialReports}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Financial Reports
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportSalesRegister}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Sales Register
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportPurchaseRegister}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Purchase Register
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="w-full px-4">
          {/* Glassmorphic Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Receivables Card */}
            <Card className="bg-[#1a1a1a] border border-gray-800 shadow-xl shadow-black/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Total Receivables</CardTitle>
                <div className="p-3 rounded-xl bg-red-500/20 border border-red-400/30">
                  <TrendingUp className="h-5 w-5 text-red-300" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-300 mb-1">Rs. {formatAmount(totalDebit)}</div>
                <p className="text-xs text-gray-400">Amount due from clients</p>
              </CardContent>
            </Card>

            {/* Total Received Card */}
            <Card className="bg-[#1a1a1a] border border-gray-800 shadow-xl shadow-black/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Total Received</CardTitle>
                <div className="p-3 rounded-xl bg-green-500/20 border border-green-400/30">
                  <TrendingDown className="h-5 w-5 text-green-300" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-300 mb-1">Rs. {formatAmount(totalCredit)}</div>
                <p className="text-xs text-gray-400">Amount collected</p>
              </CardContent>
            </Card>

            {/* Net Balance Card */}
            <Card className="bg-[#1a1a1a] border border-gray-800 shadow-xl shadow-black/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Net Balance</CardTitle>
                <div className={`p-3 rounded-xl ${netBalance < 0 ? 'bg-orange-500/20 border-orange-400/30' : 'bg-cyan-500/20 border-cyan-400/30'} border`}>
                  <Wallet className={`h-5 w-5 ${netBalance < 0 ? 'text-orange-300' : 'text-cyan-300'}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold mb-1 ${netBalance < 0 ? 'text-orange-300' : 'text-cyan-300'}`}>
                  Rs. {formatAmount(Math.abs(netBalance))}
                </div>
                <p className={`text-xs ${netBalance < 0 ? 'text-gray-400' : 'text-gray-400'}`}>
                  {netBalance < 0 ? 'Outstanding' : 'Advance'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Container */}
          <div className="bg-[#1a1a1a] border border-gray-700 rounded-2xl shadow-xl shadow-black/50 p-6">
            <Tabs defaultValue="all" className="space-y-6">
              <TabsList className="bg-[#0a0a0a] border border-gray-800">
                <TabsTrigger value="all">All Transactions</TabsTrigger>
                <TabsTrigger value="client">Client Ledger</TabsTrigger>
                <TabsTrigger value="vendor">Vendor Ledger</TabsTrigger>
                <TabsTrigger value="outstanding">Client Outstanding</TabsTrigger>
                <TabsTrigger value="salesregister">Sales Register</TabsTrigger>
                <TabsTrigger value="purchaseregister">Purchase Register</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
              </TabsList>

              {/* All Transactions Tab */}
              <TabsContent value="all" className="space-y-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300/50 h-4 w-4" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-[#0a0a0a] border-gray-800 text-white placeholder:text-gray-500 focus:border-blue-500"
                  />
                </div>

                <div className="bg-[#0a0a0a] rounded-xl border border-gray-800 shadow-lg shadow-black/30 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-white/10 hover:bg-white/5">
                          <TableHead className="text-blue-200 font-semibold">Date</TableHead>
                          <TableHead className="text-blue-200 font-semibold">Client</TableHead>
                          <TableHead className="text-blue-200 font-semibold">Type</TableHead>
                          <TableHead className="text-blue-200 font-semibold">Description</TableHead>
                          <TableHead className="text-right text-blue-200 font-semibold">Debit</TableHead>
                          <TableHead className="text-right text-blue-200 font-semibold">Credit</TableHead>
                          <TableHead className="text-right text-blue-200 font-semibold">Payment Mode</TableHead>
                          <TableHead className="text-right text-blue-200 font-semibold">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTransactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-12">
                              <div className="flex flex-col items-center justify-center space-y-3">
                                <DollarSign className="h-12 w-12 text-blue-300/30" />
                                <p className="text-gray-400">No transactions found</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredTransactions.map((transaction) => {
                            const client = clients.find(c => c.id === transaction.clientId);
                            return (
                              <TableRow key={transaction.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <TableCell className="text-blue-100">{new Date(transaction.date).toLocaleDateString()}</TableCell>
                                <TableCell className="text-white font-medium">{client?.companyName}</TableCell>
                                <TableCell className="text-blue-100">
                                  <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                    {transaction.type}
                                  </span>
                                </TableCell>
                                <TableCell className="text-blue-100">{transaction.description}</TableCell>
                                <TableCell className="text-right text-red-300 font-medium">
                                  {transaction.debit > 0 ? `Rs. ${formatAmount(transaction.debit)}` : '-'}
                                </TableCell>
                                <TableCell className="text-right text-green-300 font-medium">
                                  {transaction.credit > 0 ? `Rs. ${formatAmount(transaction.credit)}` : '-'}
                                </TableCell>
                                <TableCell className="text-right text-cyan-300">
                                  {transaction.paymentMode || '-'}
                                </TableCell>
                                <TableCell className="text-right text-white font-bold">
                                  Rs. {formatAmount(transaction.balance)}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                </div>
              </TabsContent>

              {/* Client Ledger Tab */}
              <TabsContent value="client" className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 max-w-md">
                    <Select value={selectedClient} onValueChange={setSelectedClient}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Select a client" />
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
                  {selectedClient && (
                    <div className="flex-1">
                      <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 shadow-lg shadow-black/30">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Current Balance:</span>
                          <span className={`text-2xl font-bold ${clientBalance < 0 ? 'text-red-300' : 'text-green-300'}`}>
                            Rs. {formatAmount(Math.abs(clientBalance))}
                          </span>
                        </div>
                        <p className={`text-xs mt-1 text-right ${clientBalance < 0 ? 'text-gray-400' : 'text-gray-400'}`}>
                          {clientBalance < 0 ? 'Outstanding' : 'Advance'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {selectedClient && (
                  <>
                    <div className="relative max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300/50 h-4 w-4" />
                      <Input
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-[#0a0a0a] border-gray-800 text-white placeholder:text-gray-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="bg-[#0a0a0a] rounded-xl border border-gray-800 shadow-lg shadow-black/30 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-b border-white/10 hover:bg-white/5">
                              <TableHead className="text-blue-200 font-semibold">Date</TableHead>
                              <TableHead className="text-blue-200 font-semibold">Type</TableHead>
                              <TableHead className="text-blue-200 font-semibold">Description</TableHead>
                              <TableHead className="text-right text-blue-200 font-semibold">Debit</TableHead>
                              <TableHead className="text-right text-blue-200 font-semibold">Credit</TableHead>
                              <TableHead className="text-right text-blue-200 font-semibold">Payment Mode</TableHead>
                              <TableHead className="text-right text-blue-200 font-semibold">Balance</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredTransactions.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-12">
                                  <div className="flex flex-col items-center justify-center space-y-3">
                                    <DollarSign className="h-12 w-12 text-blue-300/30" />
                                    <p className="text-gray-400">No transactions found</p>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredTransactions.map((transaction) => (
                                <TableRow key={transaction.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                  <TableCell className="text-blue-100">{new Date(transaction.date).toLocaleDateString()}</TableCell>
                                  <TableCell className="text-blue-100">
                                    <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                      {transaction.type}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-blue-100">{transaction.description}</TableCell>
                                  <TableCell className="text-right text-red-300 font-medium">
                                    {transaction.debit > 0 ? `Rs. ${formatAmount(transaction.debit)}` : '-'}
                                  </TableCell>
                                  <TableCell className="text-right text-green-300 font-medium">
                                    {transaction.credit > 0 ? `Rs. ${formatAmount(transaction.credit)}` : '-'}
                                  </TableCell>
                                  <TableCell className="text-right text-cyan-300">
                                    {transaction.paymentMode || '-'}
                                  </TableCell>
                                  <TableCell className="text-right text-white font-bold">
                                    Rs. {formatAmount(transaction.balance)}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Vendor Ledger Tab */}
              <TabsContent value="vendor" className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 max-w-md">
                    <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Select a vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedVendor && (
                    <div className="flex-1">
                      <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 shadow-lg shadow-black/30">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Current Balance:</span>
                          <span className={`text-2xl font-bold ${vendorBalance < 0 ? 'text-red-300' : 'text-green-300'}`}>
                            Rs. {formatAmount(Math.abs(vendorBalance))}
                          </span>
                        </div>
                        <p className={`text-xs mt-1 text-right ${vendorBalance < 0 ? 'text-gray-400' : 'text-gray-400'}`}>
                          {vendorBalance < 0 ? 'Outstanding' : 'Advance'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {selectedVendor && (
                  <>
                    <div className="relative max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300/50 h-4 w-4" />
                      <Input
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-[#0a0a0a] border-gray-800 text-white placeholder:text-gray-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="bg-[#0a0a0a] rounded-xl border border-gray-800 shadow-lg shadow-black/30 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-b border-white/10 hover:bg-white/5">
                              <TableHead className="text-blue-200 font-semibold">Date</TableHead>
                              <TableHead className="text-blue-200 font-semibold">Type</TableHead>
                              <TableHead className="text-blue-200 font-semibold">Description</TableHead>
                              <TableHead className="text-right text-blue-200 font-semibold">Debit</TableHead>
                              <TableHead className="text-right text-blue-200 font-semibold">Credit</TableHead>
                              <TableHead className="text-right text-blue-200 font-semibold">Payment Mode</TableHead>
                              <TableHead className="text-right text-blue-200 font-semibold">Balance</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredVendorTransactions.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-12">
                                  <div className="flex flex-col items-center justify-center space-y-3">
                                    <DollarSign className="h-12 w-12 text-blue-300/30" />
                                    <p className="text-gray-400">No transactions found</p>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredVendorTransactions.map((transaction) => (
                                <TableRow key={transaction.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                  <TableCell className="text-blue-100">{new Date(transaction.date).toLocaleDateString()}</TableCell>
                                  <TableCell className="text-blue-100">
                                    <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                      {transaction.type}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-blue-100">{transaction.description}</TableCell>
                                  <TableCell className="text-right text-red-300 font-medium">
                                    {transaction.debit > 0 ? `Rs. ${formatAmount(transaction.debit)}` : '-'}
                                  </TableCell>
                                  <TableCell className="text-right text-green-300 font-medium">
                                    {transaction.credit > 0 ? `Rs. ${formatAmount(transaction.credit)}` : '-'}
                                  </TableCell>
                                  <TableCell className="text-right text-cyan-300">
                                    {transaction.paymentMode || '-'}
                                  </TableCell>
                                  <TableCell className="text-right text-white font-bold">
                                    Rs. {formatAmount(transaction.balance)}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Client Outstanding Tab */}
              <TabsContent value="outstanding" className="space-y-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300/50 h-4 w-4" />
                  <Input
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-[#0a0a0a] border-gray-800 text-white placeholder:text-gray-500 focus:border-blue-500"
                  />
                </div>

                {/* Outstanding as per Quotation */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-400" />
                        Outstanding as per Quotation
                      </h3>
                      <p className="text-xs text-gray-400 mt-1 ml-7">
                        Shows approved quotations without bills. Once billed, outstandings appear in "Outstanding as per Bill" section.
                      </p>
                    </div>
                    <div className="text-sm text-gray-400">
                      Total: <span className="text-orange-300 font-bold">Rs. {formatAmount(filteredQuotationOutstandings.reduce((sum, q) => sum + q.remainingBalance, 0))}</span>
                    </div>
                  </div>
                  
                  <div className="bg-[#0a0a0a] rounded-xl border border-gray-800 shadow-lg shadow-black/30 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-white/10 hover:bg-white/5">
                            <TableHead className="text-blue-200 font-semibold">Quotation #</TableHead>
                            <TableHead className="text-blue-200 font-semibold">Company</TableHead>
                            <TableHead className="text-blue-200 font-semibold">Contact Person</TableHead>
                            <TableHead className="text-blue-200 font-semibold">Date</TableHead>
                            <TableHead className="text-right text-blue-200 font-semibold">Quoted Amount (After Discount)</TableHead>
                            <TableHead className="text-right text-blue-200 font-semibold">Advance Paid</TableHead>
                            <TableHead className="text-right text-blue-200 font-semibold">Remaining Balance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredQuotationOutstandings.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-12">
                                <div className="flex flex-col items-center justify-center space-y-3">
                                  <DollarSign className="h-12 w-12 text-blue-300/30" />
                                  <p className="text-gray-400">No outstanding quotations found</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredQuotationOutstandings.map((quotation) => (
                              <TableRow key={quotation.quotationId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <TableCell className="text-blue-100 font-mono">{quotation.quotationNumber}</TableCell>
                                <TableCell className="text-white font-medium">{quotation.companyName}</TableCell>
                                <TableCell className="text-blue-100">{quotation.clientName}</TableCell>
                                <TableCell className="text-blue-100">{new Date(quotation.quotationDate).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right text-white font-bold">
                                  Rs. {formatAmount(quotation.quotedAmount)}
                                </TableCell>
                                <TableCell className="text-right text-green-300 font-medium">
                                  Rs. {formatAmount(quotation.advancePaid)}
                                </TableCell>
                                <TableCell className="text-right text-orange-300 font-bold">
                                  Rs. {formatAmount(quotation.remainingBalance)}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                  </div>
                </div>

                {/* Outstanding as per Bill */}
                <div className="space-y-4 mt-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                      Outstanding as per Bill
                    </h3>
                    <div className="text-sm text-gray-400">
                      Total: <span className="text-red-300 font-bold">Rs. {formatAmount(filteredBillOutstandings.reduce((sum, b) => sum + b.remainingBalance, 0))}</span>
                    </div>
                  </div>
                  
                  <div className="bg-[#0a0a0a] rounded-xl border border-gray-800 shadow-lg shadow-black/30 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-white/10 hover:bg-white/5">
                            <TableHead className="text-blue-200 font-semibold">Bill #</TableHead>
                            <TableHead className="text-blue-200 font-semibold">Company</TableHead>
                            <TableHead className="text-blue-200 font-semibold">Contact Person</TableHead>
                            <TableHead className="text-blue-200 font-semibold">Date</TableHead>
                            <TableHead className="text-right text-blue-200 font-semibold">Billed Amount (After Discount)</TableHead>
                            <TableHead className="text-right text-blue-200 font-semibold">Amount Paid</TableHead>
                            <TableHead className="text-right text-blue-200 font-semibold">Remaining Balance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredBillOutstandings.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-12">
                                <div className="flex flex-col items-center justify-center space-y-3">
                                  <DollarSign className="h-12 w-12 text-blue-300/30" />
                                  <p className="text-gray-400">No outstanding bills found</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredBillOutstandings.map((bill) => (
                              <TableRow key={bill.billId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <TableCell className="text-blue-100 font-mono">{bill.billNumber}</TableCell>
                                <TableCell className="text-white font-medium">{bill.companyName}</TableCell>
                                <TableCell className="text-blue-100">{bill.clientName}</TableCell>
                                <TableCell className="text-blue-100">{new Date(bill.billDate).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right text-white font-bold">
                                  Rs. {formatAmount(bill.billedAmount)}
                                </TableCell>
                                <TableCell className="text-right text-green-300 font-medium">
                                  Rs. {formatAmount(bill.advancePaid)}
                                </TableCell>
                                <TableCell className="text-right text-red-300 font-bold">
                                  Rs. {formatAmount(bill.remainingBalance)}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                  </div>
                </div>
              </TabsContent>

              {/* Sales Register Tab */}
              <TabsContent value="salesregister" className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                      <FileText className="h-6 w-6 text-blue-400" />
                      Month-wise Sales Register
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">Comprehensive sales tracking by month</p>
                  </div>
                  <Button 
                    onClick={exportSalesRegister}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Sales Register
                  </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card className="bg-[#0a0a0a] border border-blue-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-blue-200">Total Months</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-300">{monthlySalesData.length}</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-[#0a0a0a] border border-green-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-green-200">Total Sales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-300">
                        Rs. {formatAmount(monthlySalesData.reduce((sum, m) => sum + m.totalSales, 0))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-[#0a0a0a] border border-purple-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-purple-200">Total Bills</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-300">
                        {monthlySalesData.reduce((sum, m) => sum + m.billCount, 0)}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-[#0a0a0a] border border-cyan-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-cyan-200">Avg Monthly Sale</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-cyan-300">
                        Rs. {monthlySalesData.length > 0 ? formatAmount(monthlySalesData.reduce((sum, m) => sum + m.totalSales, 0) / monthlySalesData.length) : '0.00'}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Monthly Sales Table */}
                <div className="bg-[#0a0a0a] rounded-xl border border-gray-800 shadow-lg shadow-black/30 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-white/10 hover:bg-white/5">
                          <TableHead className="text-blue-200 font-semibold">Month & Year</TableHead>
                          <TableHead className="text-right text-blue-200 font-semibold">Total Sales</TableHead>
                          <TableHead className="text-right text-blue-200 font-semibold">Number of Bills</TableHead>
                          <TableHead className="text-right text-blue-200 font-semibold">Average Sale</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {monthlySalesData.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-12">
                              <div className="flex flex-col items-center justify-center space-y-3">
                                <FileText className="h-12 w-12 text-blue-300/30" />
                                <p className="text-gray-400">No sales data found</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          monthlySalesData.map((monthData, index) => (
                            <TableRow key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <TableCell className="text-white font-medium">
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-1 bg-blue-500 rounded"></div>
                                  {monthData.monthYear}
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-green-300 font-bold text-lg">
                                Rs. {formatAmount(monthData.totalSales)}
                              </TableCell>
                              <TableCell className="text-right text-purple-300 font-medium">
                                {monthData.billCount} bills
                              </TableCell>
                              <TableCell className="text-right text-cyan-300 font-medium">
                                Rs. {formatAmount(monthData.averageSale)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                        {monthlySalesData.length > 0 && (
                          <TableRow className="border-t-2 border-blue-500/30 bg-blue-500/5">
                            <TableCell className="text-white font-bold text-lg">
                              GRAND TOTAL
                            </TableCell>
                            <TableCell className="text-right text-green-300 font-bold text-xl">
                              Rs. {formatAmount(monthlySalesData.reduce((sum, m) => sum + m.totalSales, 0))}
                            </TableCell>
                            <TableCell className="text-right text-purple-300 font-bold text-lg">
                              {monthlySalesData.reduce((sum, m) => sum + m.billCount, 0)} bills
                            </TableCell>
                            <TableCell className="text-right text-cyan-300 font-medium">
                              Rs. {formatAmount(monthlySalesData.reduce((sum, m) => sum + m.totalSales, 0) / monthlySalesData.reduce((sum, m) => sum + m.billCount, 0))}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                </div>

                {/* Info Card */}
                <Card className="bg-blue-600/10 border border-blue-500/30 mt-6">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-400" />
                      Sales Register Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white">
                      <div>
                        <p className="mb-2">📊 <strong>What is Sales Register?</strong></p>
                        <p className="text-gray-300">A month-wise record of all sales transactions showing total sales, number of bills, and average sale value per month.</p>
                      </div>
                      <div>
                        <p className="mb-2">💡 <strong>Benefits:</strong></p>
                        <ul className="text-gray-300 list-disc list-inside space-y-1">
                          <li>Track monthly sales performance</li>
                          <li>Identify seasonal trends</li>
                          <li>Monitor business growth</li>
                          <li>Export for accounting purposes</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Purchase Register Tab */}
              <TabsContent value="purchaseregister" className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                      <FileText className="h-6 w-6 text-orange-400" />
                      Month-wise Purchase Register
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">Comprehensive purchase/expense tracking by month</p>
                  </div>
                  <Button 
                    onClick={exportPurchaseRegister}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Purchase Register
                  </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card className="bg-[#0a0a0a] border border-blue-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-blue-200">Total Months</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-300">{monthlyPurchasesData.length}</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-[#0a0a0a] border border-orange-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-orange-200">Total Purchases</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-300">
                        Rs. {formatAmount(monthlyPurchasesData.reduce((sum, m) => sum + m.totalPurchases, 0))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-[#0a0a0a] border border-purple-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-purple-200">Total Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-300">
                        {monthlyPurchasesData.reduce((sum, m) => sum + m.transactionCount, 0)}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-[#0a0a0a] border border-cyan-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-cyan-200">Avg Monthly Purchase</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-cyan-300">
                        Rs. {monthlyPurchasesData.length > 0 ? formatAmount(monthlyPurchasesData.reduce((sum, m) => sum + m.totalPurchases, 0) / monthlyPurchasesData.length) : '0.00'}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Monthly Purchases Table */}
                <div className="bg-[#0a0a0a] rounded-xl border border-gray-800 shadow-lg shadow-black/30 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-white/10 hover:bg-white/5">
                          <TableHead className="text-blue-200 font-semibold">Month & Year</TableHead>
                          <TableHead className="text-right text-blue-200 font-semibold">Total Purchases</TableHead>
                          <TableHead className="text-right text-blue-200 font-semibold">Number of Transactions</TableHead>
                          <TableHead className="text-right text-blue-200 font-semibold">Average Purchase</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {monthlyPurchasesData.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-12">
                              <div className="flex flex-col items-center justify-center space-y-3">
                                <FileText className="h-12 w-12 text-blue-300/30" />
                                <p className="text-gray-400">No purchase data found</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          monthlyPurchasesData.map((monthData, index) => (
                            <TableRow key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <TableCell className="text-white font-medium">
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-1 bg-orange-500 rounded"></div>
                                  {monthData.monthYear}
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-orange-300 font-bold text-lg">
                                Rs. {formatAmount(monthData.totalPurchases)}
                              </TableCell>
                              <TableCell className="text-right text-purple-300 font-medium">
                                {monthData.transactionCount} transactions
                              </TableCell>
                              <TableCell className="text-right text-cyan-300 font-medium">
                                Rs. {formatAmount(monthData.averagePurchase)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                        {monthlyPurchasesData.length > 0 && (
                          <TableRow className="border-t-2 border-orange-500/30 bg-orange-500/5">
                            <TableCell className="text-white font-bold text-lg">
                              GRAND TOTAL
                            </TableCell>
                            <TableCell className="text-right text-orange-300 font-bold text-xl">
                              Rs. {formatAmount(monthlyPurchasesData.reduce((sum, m) => sum + m.totalPurchases, 0))}
                            </TableCell>
                            <TableCell className="text-right text-purple-300 font-bold text-lg">
                              {monthlyPurchasesData.reduce((sum, m) => sum + m.transactionCount, 0)} transactions
                            </TableCell>
                            <TableCell className="text-right text-cyan-300 font-medium">
                              Rs. {monthlyPurchasesData.reduce((sum, m) => sum + m.transactionCount, 0) > 0 ? formatAmount(monthlyPurchasesData.reduce((sum, m) => sum + m.totalPurchases, 0) / monthlyPurchasesData.reduce((sum, m) => sum + m.transactionCount, 0)) : '0.00'}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                </div>

                {/* Info Card */}
                <Card className="bg-orange-600/10 border border-orange-500/30 mt-6">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-400" />
                      Purchase Register Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white">
                      <div>
                        <p className="mb-2">📊 <strong>What is Purchase Register?</strong></p>
                        <p className="text-gray-300">A month-wise record of all purchase and expense transactions from vendors showing total purchases, number of transactions, and average purchase value per month.</p>
                      </div>
                      <div>
                        <p className="mb-2">💡 <strong>Benefits:</strong></p>
                        <ul className="text-gray-300 list-disc list-inside space-y-1">
                          <li>Track monthly expense patterns</li>
                          <li>Monitor vendor payments</li>
                          <li>Control purchasing costs</li>
                          <li>Export for accounting purposes</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reports Tab */}
              <TabsContent value="reports" className="space-y-6">
                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card className="bg-[#0a0a0a] border border-blue-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-blue-200">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-300">₹{financialData.totalRevenue.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-[#0a0a0a] border border-red-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-red-200">Total Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-300">₹{financialData.totalExpenses.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-[#0a0a0a] border border-green-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-green-200">Gross Profit</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-300">₹{financialData.grossProfit.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-[#0a0a0a] border border-cyan-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-cyan-200">Profit Margin</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-cyan-300">{financialData.profitMargin.toFixed(2)}%</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Balance Sheet */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-400" />
                      Balance Sheet
                    </h3>
                    <Button 
                      onClick={exportFinancialReports}
                      className="bg-blue-600 hover:bg-blue-700"
                      size="sm"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export Reports
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Assets */}
                    <Card className="bg-[#0a0a0a] border border-gray-800">
                      <CardHeader>
                        <CardTitle className="text-green-400">Assets</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-[#1a1a1a] rounded-lg border border-gray-800">
                            <span className="text-gray-300">Cash in Hand</span>
                            <span className="text-green-300 font-bold">₹{financialData.cashInHand.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-[#1a1a1a] rounded-lg border border-gray-800">
                            <span className="text-gray-300">Accounts Receivable</span>
                            <span className="text-green-300 font-bold">₹{financialData.totalReceivables.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg border border-green-500/30 mt-3">
                            <span className="text-white font-bold">Total Assets</span>
                            <span className="text-green-300 font-bold text-xl">₹{financialData.currentAssets.toLocaleString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Liabilities */}
                    <Card className="bg-[#0a0a0a] border border-gray-800">
                      <CardHeader>
                        <CardTitle className="text-red-400">Liabilities & Equity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-[#1a1a1a] rounded-lg border border-gray-800">
                            <span className="text-gray-300">Accounts Payable</span>
                            <span className="text-red-300 font-bold">₹{financialData.totalPayables.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-red-500/10 rounded-lg border border-red-500/30 mt-3">
                            <span className="text-white font-bold">Total Liabilities</span>
                            <span className="text-red-300 font-bold text-xl">₹{financialData.currentLiabilities.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/30 mt-3">
                            <span className="text-white font-bold">Net Equity</span>
                            <span className="text-cyan-300 font-bold text-xl">₹{financialData.netAssets.toLocaleString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Profit & Loss Statement */}
                <div className="space-y-4 mt-8">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-400" />
                    Profit & Loss Statement
                  </h3>
                  
                  <Card className="bg-[#0a0a0a] border border-gray-800">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-4 bg-[#1a1a1a] rounded-lg border border-gray-800">
                          <span className="text-white font-medium">Total Revenue (Sales)</span>
                          <span className="text-blue-300 font-bold text-lg">₹{financialData.totalRevenue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-[#1a1a1a] rounded-lg border border-gray-800">
                          <span className="text-white font-medium">Less: Total Expenses</span>
                          <span className="text-red-300 font-bold text-lg">- ₹{financialData.totalExpenses.toLocaleString()}</span>
                        </div>
                        <div className="border-t-2 border-gray-700 my-2"></div>
                        <div className="flex justify-between items-center p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                          <div>
                            <div className="text-white font-bold text-lg">Gross Profit</div>
                            <div className="text-sm text-gray-400 mt-1">Profit Margin: {financialData.profitMargin.toFixed(2)}%</div>
                          </div>
                          <span className="text-green-300 font-bold text-2xl">₹{financialData.grossProfit.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Ratio Analysis */}
                <div className="space-y-4 mt-8">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-purple-400" />
                    Ratio Analysis
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Profitability Ratios */}
                    <Card className="bg-[#0a0a0a] border border-gray-800">
                      <CardHeader>
                        <CardTitle className="text-purple-400">Profitability Ratios</CardTitle>
                        <CardDescription className="text-gray-400">Measures company's profitability</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="p-3 bg-[#1a1a1a] rounded-lg border border-gray-800">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300 font-medium">Profit Margin</span>
                              <span className="text-purple-300 font-bold">{financialData.profitMargin.toFixed(2)}%</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Profit as % of revenue</p>
                          </div>
                          <div className="p-3 bg-[#1a1a1a] rounded-lg border border-gray-800">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300 font-medium">Return on Assets (ROA)</span>
                              <span className="text-purple-300 font-bold">{financialData.returnOnAssets.toFixed(2)}%</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Profit generated per rupee of assets</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Liquidity & Leverage Ratios */}
                    <Card className="bg-[#0a0a0a] border border-gray-800">
                      <CardHeader>
                        <CardTitle className="text-cyan-400">Liquidity & Leverage Ratios</CardTitle>
                        <CardDescription className="text-gray-400">Measures financial stability</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="p-3 bg-[#1a1a1a] rounded-lg border border-gray-800">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300 font-medium">Current Ratio</span>
                              <span className="text-cyan-300 font-bold">{financialData.currentRatio.toFixed(2)}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Assets to liabilities ratio ({">"} 1 is good)</p>
                          </div>
                          <div className="p-3 bg-[#1a1a1a] rounded-lg border border-gray-800">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300 font-medium">Debt to Equity Ratio</span>
                              <span className="text-cyan-300 font-bold">{financialData.debtToEquityRatio.toFixed(2)}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Debt relative to equity (lower is better)</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Financial Health Summary */}
                <Card className="bg-blue-600/10 border border-blue-500/30 mt-6">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-400" />
                      Financial Health Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-300 mb-1">💰 <strong>Revenue Status:</strong></p>
                        <p className="text-white">Total Sales: ₹{financialData.totalRevenue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-300 mb-1">📊 <strong>Profitability:</strong></p>
                        <p className={financialData.grossProfit >= 0 ? 'text-green-300' : 'text-red-300'}>
                          {financialData.grossProfit >= 0 ? 'Profitable' : 'Loss'} - {financialData.profitMargin.toFixed(2)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-300 mb-1">💪 <strong>Liquidity Position:</strong></p>
                        <p className={financialData.currentRatio >= 1 ? 'text-green-300' : 'text-red-300'}>
                          {financialData.currentRatio >= 1 ? 'Strong' : 'Needs Attention'} - Ratio {financialData.currentRatio.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Record Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md bg-[#1a1a1a] border border-gray-800 shadow-2xl shadow-black/50" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-white">Record Additional Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="payment-client" className="text-gray-200">Select Client *</Label>
              <Select
                value={paymentForm.clientId}
                onValueChange={(value) => setPaymentForm({ ...paymentForm, clientId: value })}
              >
                <SelectTrigger id="payment-client" className="bg-[#0f0f0f] border-gray-700 text-white">
                  <SelectValue placeholder="Choose client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => {
                    const balance = getClientBalance(client.id);
                    return (
                      <SelectItem key={client.id} value={client.id}>
                        {client.companyName} {balance > 0 && (
                          <span className="text-red-400 text-xs ml-2">(Outstanding: Rs. {formatAmount(balance)})</span>
                        )}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="payment-amount" className="text-gray-200">Payment Amount (₹) *</Label>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="bg-[#0f0f0f] border-gray-700 text-white"
              />
              {paymentForm.clientId && getClientBalance(paymentForm.clientId) > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  Current outstanding: Rs. {formatAmount(getClientBalance(paymentForm.clientId))}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="payment-mode" className="text-gray-200">Payment Mode *</Label>
              <Select
                value={paymentForm.paymentMode}
                onValueChange={(value: any) => setPaymentForm({ ...paymentForm, paymentMode: value })}
              >
                <SelectTrigger id="payment-mode" className="bg-[#0f0f0f] border-gray-700 text-white">
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

            <div>
              <Label htmlFor="payment-description" className="text-gray-200">Description (Optional)</Label>
              <Input
                id="payment-description"
                value={paymentForm.description}
                onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                placeholder="e.g., Advance for upcoming order"
                className="bg-[#0f0f0f] border-gray-700 text-white"
              />
            </div>

            <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-xs text-blue-200">
                💡 <strong>Note:</strong> This payment will be recorded in the client's ledger and will reduce their outstanding balance.
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPaymentDialog(false);
                  setPaymentForm({
                    clientId: '',
                    amount: 0,
                    paymentMode: 'Cash',
                    description: '',
                  });
                }}
                className="border-gray-700 text-gray-200 hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleRecordPayment}
                className="bg-green-600 hover:bg-green-700"
              >
                Record Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}