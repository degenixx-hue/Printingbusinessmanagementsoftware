import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useData } from '../context/DataContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { ArrowLeft, Search, Package, Download, TrendingUp, AlertTriangle, Calendar, FileText, Bell, MessageCircle, Sparkles, Megaphone, DollarSign, ArrowRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import degenixLogo from 'figma:asset/e686929947131e66770ed743ba284a27b15aa8de.png';
import { DateTimeDisplay } from '../components/DateTimeDisplay';

interface CreativePackageItem {
  quotationId: string;
  quotationNumber: string;
  clientId: string;
  clientName: string;
  companyName: string;
  productName: string;
  packageType: 'Festive' | 'Ads';
  dateFrom: string;
  dateTo: string;
  amount: number;
  totalQuotationAmount: number;
  hasBill: boolean;
  billNumber?: string;
  status: 'Active' | 'Expired' | 'Upcoming';
  daysRemaining: number;
}

export default function CreativePackages() {
  const navigate = useNavigate();
  const { quotations, clients, bills } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Festive' | 'Ads'>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Expired' | 'Upcoming'>('All');
  const [remindersSent, setRemindersSent] = useState<Set<string>>(
    new Set(JSON.parse(localStorage.getItem('packageRemindersSent') || '[]'))
  );

  const ownerMobile = '9238888300';

  // Extract creative packages from approved quotations
  const creativePackages = useMemo(() => {
    const packages: CreativePackageItem[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    quotations
      .filter(q => q.status === 'Approved')
      .forEach(quotation => {
        const client = clients.find(c => c.id === quotation.clientId);
        if (!client) return;

        quotation.items.forEach(item => {
          if (item.digitalCreative && item.creativeDateFrom && item.creativeDateTo && item.creativePackageType) {
            const dateFrom = new Date(item.creativeDateFrom);
            const dateTo = new Date(item.creativeDateTo);
            dateFrom.setHours(0, 0, 0, 0);
            dateTo.setHours(0, 0, 0, 0);

            // Calculate status
            let status: 'Active' | 'Expired' | 'Upcoming' = 'Active';
            let daysRemaining = 0;

            if (today < dateFrom) {
              status = 'Upcoming';
              daysRemaining = Math.ceil((dateFrom.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            } else if (today > dateTo) {
              status = 'Expired';
              daysRemaining = -Math.ceil((today.getTime() - dateTo.getTime()) / (1000 * 60 * 60 * 24));
            } else {
              status = 'Active';
              daysRemaining = Math.ceil((dateTo.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            }

            // Check if bill exists
            const bill = bills.find(b => b.quotationId === quotation.id);

            packages.push({
              quotationId: quotation.id,
              quotationNumber: quotation.quotationNumber,
              clientId: client.id,
              clientName: client.clientName,
              companyName: client.companyName,
              productName: item.productName,
              packageType: item.creativePackageType,
              dateFrom: item.creativeDateFrom,
              dateTo: item.creativeDateTo,
              amount: item.amount,
              totalQuotationAmount: quotation.totalAmount,
              hasBill: !!bill,
              billNumber: bill?.billNumber,
              status,
              daysRemaining,
            });
          }
        });
      });

    return packages;
  }, [quotations, clients, bills]);

  // Apply filters
  const filteredPackages = useMemo(() => {
    return creativePackages.filter(pkg => {
      const matchesSearch = 
        pkg.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filterType === 'All' || pkg.packageType === filterType;
      const matchesStatus = filterStatus === 'All' || pkg.status === filterStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [creativePackages, searchTerm, filterType, filterStatus]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalPackages = creativePackages.length;
    const activePackages = creativePackages.filter(p => p.status === 'Active').length;
    const festivePackages = creativePackages.filter(p => p.packageType === 'Festive').length;
    const adsPackages = creativePackages.filter(p => p.packageType === 'Ads').length;
    
    // Calculate revenue based on bill amount (after discount) if billed, otherwise use quotation amount
    const totalRevenue = creativePackages.reduce((sum, p) => {
      if (p.hasBill) {
        const bill = bills.find(b => b.quotationId === p.quotationId);
        return sum + (bill ? bill.totalAmount : p.totalQuotationAmount);
      }
      return sum + p.totalQuotationAmount;
    }, 0);
    
    const billedRevenue = creativePackages.filter(p => p.hasBill).reduce((sum, p) => {
      const bill = bills.find(b => b.quotationId === p.quotationId);
      return sum + (bill ? bill.totalAmount : p.totalQuotationAmount);
    }, 0);

    return {
      totalPackages,
      activePackages,
      festivePackages,
      adsPackages,
      totalRevenue,
      billedRevenue,
      pendingRevenue: totalRevenue - billedRevenue,
    };
  }, [creativePackages, bills]);

  const exportToExcel = () => {
    const data = filteredPackages.map(pkg => ({
      'Quotation #': pkg.quotationNumber,
      'Company': pkg.companyName,
      'Client': pkg.clientName,
      'Product': pkg.productName,
      'Package Type': pkg.packageType,
      'Date From': new Date(pkg.dateFrom).toLocaleDateString(),
      'Date To': new Date(pkg.dateTo).toLocaleDateString(),
      'Status': pkg.status,
      'Days': pkg.status === 'Upcoming' ? `Starts in ${pkg.daysRemaining}d` : 
              pkg.status === 'Expired' ? `Expired ${Math.abs(pkg.daysRemaining)}d ago` :
              `${pkg.daysRemaining}d remaining`,
      'Amount': pkg.amount,
      'Billed': pkg.hasBill ? 'Yes' : 'No',
      'Bill Number': pkg.billNumber || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Creative Packages');
    XLSX.writeFile(wb, `creative_packages_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Exported to Excel');
  };

  // Check for packages ending today or tomorrow and send reminders
  const packagesEndingSoon = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return creativePackages.filter(pkg => {
      if (pkg.status !== 'Active') return false;
      
      const endDate = new Date(pkg.dateTo);
      endDate.setHours(0, 0, 0, 0);
      
      // Check if ending today or tomorrow
      return pkg.daysRemaining <= 1 && pkg.daysRemaining >= 0;
    });
  }, [creativePackages]);

  // Send WhatsApp reminder
  const sendWhatsAppReminder = (pkg: CreativePackageItem) => {
    const message = `🔔 *Creative Package Reminder*\n\n` +
      `*Client:* ${pkg.companyName} (${pkg.clientName})\n` +
      `*Package Type:* ${pkg.packageType}\n` +
      `*Product:* ${pkg.productName}\n` +
      `*End Date:* ${new Date(pkg.dateTo).toLocaleDateString()}\n` +
      `*Days Remaining:* ${pkg.daysRemaining} day${pkg.daysRemaining !== 1 ? 's' : ''}\n` +
      `*Amount:* ₹${pkg.amount.toLocaleString()}\n` +
      `*Quotation #:* ${pkg.quotationNumber}\n` +
      `*Status:* ${pkg.hasBill ? `Billed (${pkg.billNumber})` : 'Not Billed'}\n\n` +
      `⚠️ This package is ending soon. Please follow up with the client.`;
    
    const whatsappUrl = `https://wa.me/${ownerMobile}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // Mark reminder as sent
    const newRemindersSent = new Set(remindersSent);
    newRemindersSent.add(pkg.quotationId + pkg.dateTo);
    setRemindersSent(newRemindersSent);
    localStorage.setItem('packageRemindersSent', JSON.stringify(Array.from(newRemindersSent)));
    
    toast.success(`Reminder opened in WhatsApp for ${pkg.companyName}`);
  };

  // Auto-send browser notification on page load for packages ending today
  useEffect(() => {
    if (packagesEndingSoon.length === 0) return;
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Show browser notifications
    if ('Notification' in window && Notification.permission === 'granted') {
      packagesEndingSoon.forEach(pkg => {
        const reminderKey = pkg.quotationId + pkg.dateTo;
        if (!remindersSent.has(reminderKey) && pkg.daysRemaining === 0) {
          new Notification('Creative Package Ending Today!', {
            body: `${pkg.companyName} - ${pkg.packageType} package ends today`,
            icon: '/favicon.ico',
          });
        }
      });
    }
  }, [packagesEndingSoon, remindersSent]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Active</Badge>;
      case 'Expired':
        return <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">Expired</Badge>;
      case 'Upcoming':
        return <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Upcoming</Badge>;
      default:
        return null;
    }
  };

  const getPackageIcon = (type: string) => {
    return type === 'Festive' ? 
      <Sparkles className="h-4 w-4 text-purple-400" /> : 
      <Megaphone className="h-4 w-4 text-orange-400" />;
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
          <div className="flex items-center gap-4">
            <div>
              <img 
                src={degenixLogo} 
                alt="Degenix Graphics Logo" 
                className="h-14 w-14 object-contain cursor-pointer hover:opacity-80 transition-opacity" 
                onClick={() => navigate('/dashboard')}
              />
            </div>
            <div>
              <h1 className="text-white text-3xl font-bold flex items-center gap-2">
                <Package className="h-8 w-8" />
                Creative Packages
              </h1>
              <p className="text-gray-300 mt-1">Manage digital creative packages for festive and ads campaigns</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DateTimeDisplay />
            <Button
              onClick={() => navigate('/creative-packages/quotation/new')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Create Quotation
            </Button>
            <Button
              onClick={exportToExcel}
              className="bg-green-600 hover:bg-green-700"
              disabled={filteredPackages.length === 0}
            >
              <FileText className="mr-2 h-4 w-4" />
              Export to Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Reminder Alerts for Packages Ending Soon */}
      {packagesEndingSoon.length > 0 && (
        <div className="p-6 pb-0">
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-400 animate-pulse" />
                <h3 className="text-orange-300 font-semibold">
                  {packagesEndingSoon.length} Package{packagesEndingSoon.length > 1 ? 's' : ''} Ending Soon
                </h3>
              </div>
            </div>
            <div className="space-y-2">
              {packagesEndingSoon.map(pkg => (
                <div key={pkg.quotationId + pkg.dateTo} className="bg-[#1a1a1a] border border-orange-500/20 rounded p-3 flex items-center justify-between shadow-lg shadow-black/30">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">{pkg.companyName}</span>
                      <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs">
                        {pkg.daysRemaining === 0 ? 'Ends Today' : 'Ends Tomorrow'}
                      </Badge>
                      {pkg.packageType === 'Festive' ? (
                        <Sparkles className="h-4 w-4 text-purple-400" />
                      ) : (
                        <Megaphone className="h-4 w-4 text-orange-400" />
                      )}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {pkg.productName} • End Date: {new Date(pkg.dateTo).toLocaleDateString()} • ₹{pkg.amount.toLocaleString()}
                    </div>
                  </div>
                  <Button
                    onClick={() => sendWhatsAppReminder(pkg)}
                    className="bg-green-600 hover:bg-green-700 ml-4"
                    size="sm"
                    disabled={remindersSent.has(pkg.quotationId + pkg.dateTo)}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    {remindersSent.has(pkg.quotationId + pkg.dateTo) ? 'Sent' : 'Send Reminder'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 shadow-xl shadow-black/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Total Packages</p>
                <p className="text-white text-2xl font-bold mt-1">{stats.totalPackages}</p>
              </div>
              <Package className="h-10 w-10 text-blue-400" />
            </div>
            <div className="mt-2 flex gap-2 text-xs">
              <span className="text-gray-400">Active: {stats.activePackages}</span>
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 shadow-xl shadow-black/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Festive Packages</p>
                <p className="text-white text-2xl font-bold mt-1">{stats.festivePackages}</p>
              </div>
              <Sparkles className="h-10 w-10 text-blue-400" />
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 shadow-xl shadow-black/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Ads Packages</p>
                <p className="text-white text-2xl font-bold mt-1">{stats.adsPackages}</p>
              </div>
              <Megaphone className="h-10 w-10 text-blue-400" />
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 shadow-xl shadow-black/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Total Revenue</p>
                <p className="text-white text-2xl font-bold mt-1">₹{stats.totalRevenue.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-blue-400" />
            </div>
            <div className="mt-2 flex gap-2 text-xs">
              <span className="text-gray-400">Billed: ₹{stats.billedRevenue.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 mb-6 shadow-xl shadow-black/50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by company, client, product, or quotation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Package Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Types</SelectItem>
                  <SelectItem value="Festive">Festive Creative</SelectItem>
                  <SelectItem value="Ads">Ads Creative</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Upcoming">Upcoming</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Packages Table */}
        <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg overflow-hidden shadow-xl shadow-black/50">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-700 hover:bg-white/5">
                <TableHead className="text-gray-300">Package</TableHead>
                <TableHead className="text-gray-300">Client</TableHead>
                <TableHead className="text-gray-300">Type</TableHead>
                <TableHead className="text-gray-300">Duration</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300">Amount</TableHead>
                <TableHead className="text-gray-300">Billing</TableHead>
                <TableHead className="text-right text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPackages.length === 0 ? (
                <TableRow className="border-b border-gray-700 hover:bg-gray-800/50">
                  <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                    {searchTerm || filterType !== 'All' || filterStatus !== 'All'
                      ? 'No packages found matching your filters'
                      : 'No creative packages yet. Create quotations with digital creative items.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPackages.map((pkg, index) => (
                  <TableRow key={index} className="border-b border-gray-700 hover:bg-gray-800/50">
                    <TableCell className="text-gray-300">
                      <div className="font-medium text-white">{pkg.productName}</div>
                      <div className="text-xs text-gray-400">Quotation #{pkg.quotationNumber}</div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <div className="font-medium text-white">{pkg.companyName}</div>
                      <div className="text-xs text-gray-400">{pkg.clientName}</div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <div className="flex items-center gap-2">
                        {getPackageIcon(pkg.packageType)}
                        <span>{pkg.packageType}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <div className="flex items-center gap-1 text-xs">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(pkg.dateFrom).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <span>to {new Date(pkg.dateTo).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getStatusBadge(pkg.status)}
                        <div className="text-xs text-gray-400">
                          {pkg.status === 'Upcoming' && `Starts in ${pkg.daysRemaining}d`}
                          {pkg.status === 'Active' && `${pkg.daysRemaining}d remaining`}
                          {pkg.status === 'Expired' && `Ended ${Math.abs(pkg.daysRemaining)}d ago`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <div className="font-medium text-white">₹{pkg.amount.toLocaleString()}</div>
                    </TableCell>
                    <TableCell>
                      {pkg.hasBill ? (
                        <div className="space-y-1">
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                            Billed
                          </Badge>
                          <div className="text-xs text-gray-400">#{pkg.billNumber}</div>
                        </div>
                      ) : (
                        <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {pkg.status === 'Active' && pkg.daysRemaining <= 3 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => sendWhatsAppReminder(pkg)}
                            className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                            disabled={remindersSent.has(pkg.quotationId + pkg.dateTo)}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/orders/quotation/${pkg.quotationId}`)}
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                        >
                          View Quotation
                        </Button>
                        {!pkg.hasBill && (
                          <Button
                            size="sm"
                            onClick={() => navigate(`/orders/billing/${pkg.quotationId}`)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Create Bill
                          </Button>
                        )}
                        {pkg.hasBill && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const bill = bills.find(b => b.quotationId === pkg.quotationId);
                              if (bill) navigate(`/orders/billing/${bill.id}`);
                            }}
                            className="border-gray-500 text-gray-300 hover:bg-gray-500/10"
                          >
                            View Bill
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        )}
                        {/* Track Designs button for ALL packages - Festive AND Ads */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/creative-packages/track/${pkg.quotationId}`)}
                          className={pkg.packageType === 'Festive' 
                            ? "border-purple-500 text-purple-300 hover:bg-purple-500/10"
                            : "border-orange-500 text-orange-300 hover:bg-orange-500/10"
                          }
                        >
                          {pkg.packageType === 'Festive' ? <Sparkles className="h-4 w-4 mr-1" /> : <Megaphone className="h-4 w-4 mr-1" />}
                          Track Designs
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary Footer */}
        {filteredPackages.length > 0 && (
          <div className="mt-4 bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 shadow-lg shadow-black/30">
            <div className="flex justify-between items-center text-sm text-gray-300">
              <span>Showing {filteredPackages.length} of {creativePackages.length} packages</span>
              <div className="flex gap-6">
                <span>Total: <strong className="text-white">₹{filteredPackages.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</strong></span>
                <span>Pending Bills: <strong className="text-yellow-400">{filteredPackages.filter(p => !p.hasBill).length}</strong></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}