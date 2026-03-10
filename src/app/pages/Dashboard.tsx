import { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { useNavigate } from 'react-router';
import { useData } from '../context/DataContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { LogOut, Settings, Users, Package, FileText, Briefcase, DollarSign, TrendingUp, UserPlus, Calendar, X, Bell, ChevronDown, ChevronUp, ClipboardList, Palette, MoreVertical, Check, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import degenixLogo from 'figma:asset/e686929947131e66770ed743ba284a27b15aa8de.png';
import { DateTimeDisplay } from '../components/DateTimeDisplay';

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser, logout, companySettings, updateCompanySettings, quotations, jobSheets, bills, festivals } = useData();
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(companySettings);
  const [hiddenFestivals, setHiddenFestivals] = useState<string[]>([]);
  const [expandedDates, setExpandedDates] = useState<string[]>([]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleSaveSettings = () => {
    updateCompanySettings(settings);
    toast.success('Company settings updated');
    setShowSettings(false);
  };

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMarkDelivered = (festivalId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHiddenFestivals([...hiddenFestivals, festivalId]);
    toast.success('Festival marked as delivered');
  };

  const toggleDateExpansion = (dateStr: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (expandedDates.includes(dateStr)) {
      setExpandedDates(expandedDates.filter(d => d !== dateStr));
    } else {
      setExpandedDates([...expandedDates, dateStr]);
    }
  };

  // Calculate workflow statistics
  const workflowStats = {
    quotations: {
      total: quotations.length,
      pending: quotations.filter(q => q.status === 'Pending').length,
      approved: quotations.filter(q => q.status === 'Approved').length,
      rejected: quotations.filter(q => q.status === 'Rejected').length,
    },
    jobSheets: {
      total: jobSheets.length,
      inProgress: jobSheets.filter(js => js.status === 'In Progress').length,
      completed: jobSheets.filter(js => js.status === 'Completed').length,
    },
    bills: {
      total: bills.length,
      pending: bills.filter(b => b.paymentStatus === 'Pending').length,
      partial: bills.filter(b => b.paymentStatus === 'Partial').length,
      paid: bills.filter(b => b.paymentStatus === 'Paid').length,
    },
  };

  // Calculate packages ending soon
  const packagesEndingSoon = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let count = 0;
    quotations
      .filter(q => q.status === 'Approved')
      .forEach(quotation => {
        quotation.items.forEach(item => {
          if (item.digitalCreative && item.creativeDateTo) {
            const dateTo = new Date(item.creativeDateTo);
            dateTo.setHours(0, 0, 0, 0);
            const daysRemaining = Math.ceil((dateTo.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            // Count if ending within 3 days and not expired
            if (daysRemaining >= 0 && daysRemaining <= 3) {
              count++;
            }
          }
        });
      });
    
    return count;
  }, [quotations]);

  // Calculate upcoming festivals (within 2 days)
  const upcomingFestivals = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return festivals
      .filter(festival => {
        // Filter out hidden festivals
        if (hiddenFestivals.includes(festival.id)) {
          return false;
        }
        
        const festivalDate = new Date(festival.date);
        festivalDate.setHours(0, 0, 0, 0);
        const daysUntilFestival = Math.ceil((festivalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Show festivals within next 2 days (0, 1, or 2 days away)
        return daysUntilFestival >= 0 && daysUntilFestival <= 2;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [festivals, hiddenFestivals]);

  // Group festivals by date
  const groupedFestivals = useMemo(() => {
    const groups: { [key: string]: typeof upcomingFestivals } = {};
    
    upcomingFestivals.forEach(festival => {
      const dateKey = festival.date;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(festival);
    });
    
    return groups;
  }, [upcomingFestivals]);

  const modules = [
    {
      title: 'Client Management',
      icon: Users,
      description: 'Manage all client information',
      path: '/clients',
      color: '#3b82f6',
    },
    {
      title: 'Product Management',
      icon: Package,
      description: 'Manage products and specifications',
      path: '/products',
      color: '#10b981',
    },
    {
      title: 'Order Management',
      icon: FileText,
      description: 'Quotations, Job Sheets & Billing',
      path: '/orders',
      color: '#f59e0b',
    },
    {
      title: 'Printing Vendors',
      icon: Briefcase,
      description: 'Manage vendors and work assignments',
      path: '/vendors',
      color: '#06b6d4',
    },
    {
      title: 'Creative Packages',
      icon: Palette,
      description: 'Festive & Ads Creative Management',
      path: '/creative-packages',
      color: '#a855f7',
    },
    {
      title: 'Staff & Payroll',
      icon: UserPlus,
      description: 'Manage staff and payroll records',
      path: '/staff-payroll',
      color: '#ec4899',
      adminOnly: true,
    },
    {
      title: 'User Management',
      icon: Users,
      description: 'Manage system users and roles',
      path: '/user-management',
      color: '#06b6d4',
      adminOnly: true,
    },
    {
      title: 'Accounts',
      icon: DollarSign,
      description: 'Ledger and financial records',
      path: '/accounts',
      color: '#8b5cf6',
      adminOnly: true,
    },
    {
      title: 'Data Management',
      icon: ClipboardList,
      description: 'Backup and restore data',
      path: '/data-management',
      color: '#ef4444',
      adminOnly: true,
    },
    {
      title: 'Inventory Management',
      icon: ClipboardList,
      description: 'Manage inventory levels and stock',
      path: '/inventory-management',
      color: '#d946ef',
      adminOnly: true,
    },
  ];

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
            <img 
              src={degenixLogo} 
              alt="Degenix Graphics Logo" 
              className="h-16 w-16 object-contain cursor-pointer hover:opacity-80 transition-opacity" 
              onClick={() => navigate('/dashboard')}
            />
            <div>
              <h1 className="text-white text-3xl font-bold">
                {companySettings.companyName}
              </h1>
              <p className="text-gray-400 text-sm mt-1">Welcome, {currentUser?.fullName}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Date and Time Display - Horizontal Layout */}
            <DateTimeDisplay />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/10"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
                {currentUser?.role === 'admin' && (
                  <DropdownMenuItem onClick={() => setShowSettings(true)} className="hover:bg-white/10 cursor-pointer text-white">
                    <Settings className="mr-2 h-4 w-4" />
                    Company Settings
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem onClick={handleLogout} className="hover:bg-red-500/20 cursor-pointer text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-8">
          <h2 className="text-3xl font-bold text-white">
            Dashboard
          </h2>

          {/* Festival Reminders - Red Card Widget */}
          {upcomingFestivals.length > 0 && (
            <div className="w-80">
              <div className="bg-gradient-to-br from-red-600/30 to-red-800/30 backdrop-blur-sm border-2 border-red-500/60 rounded-lg p-4 shadow-lg shadow-red-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-red-600 rounded-lg">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-white">Festival Reminder</h3>
                    <p className="text-xs text-red-100">Create designs!</p>
                  </div>
                  <span className="px-2 py-1 bg-red-600/60 text-white rounded-full text-xs font-bold">
                    {upcomingFestivals.length}
                  </span>
                </div>
                <div className="space-y-2" style={{ maxHeight: 'none', overflow: 'visible' }}>
                  {Object.keys(groupedFestivals).map(dateStr => {
                    const festivalsOnDate = groupedFestivals[dateStr];
                    const festivalDate = new Date(dateStr);
                    festivalDate.setHours(0, 0, 0, 0);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const daysUntil = Math.ceil((festivalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    
                    let urgencyColor = 'bg-green-500/20 border-green-500/40';
                    let urgencyText = 'text-green-300';
                    let urgencyLabel = `${daysUntil}d`;
                    
                    if (daysUntil === 0) {
                      urgencyColor = 'bg-red-500/20 border-red-500/40';
                      urgencyText = 'text-red-300';
                      urgencyLabel = 'Today';
                    } else if (daysUntil === 1) {
                      urgencyColor = 'bg-orange-500/20 border-orange-500/40';
                      urgencyText = 'text-orange-300';
                      urgencyLabel = 'Tmrw';
                    }
                    
                    return (
                      <div
                        key={dateStr}
                        className={`${urgencyColor} border rounded p-2 transition-all hover:scale-105 relative group`}
                      >
                        <div 
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => navigate('/festival-management')}
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="font-semibold text-white text-xs truncate">{festivalsOnDate.map(f => f.name).join(', ')}</div>
                            <div className="text-xs text-gray-300">
                              {new Date(dateStr).toLocaleDateString('en-IN', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`${urgencyText} text-xs font-bold px-2 py-1 rounded ${urgencyColor.split(' ')[0]}`}>
                              {urgencyLabel}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-green-400 hover:bg-green-500/20 hover:text-green-300"
                              onClick={(e) => handleMarkDelivered(festivalsOnDate[0].id, e)}
                              title="Mark as delivered"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((module) => {
            if (module.adminOnly && currentUser?.role !== 'admin') return null;
            
            return (
              <Card
                key={module.path}
                className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-[#1a1a1a] border border-gray-800 shadow-xl shadow-black/50 relative"
                onClick={() => navigate(module.path)}
              >
                {module.title === 'Creative Packages' && packagesEndingSoon > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse z-10">
                    {packagesEndingSoon}
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-white">
                      {module.title}
                    </CardTitle>
                    <div
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: module.color }}
                    >
                      <module.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-400 text-sm">{module.description}</p>
                  {module.title === 'Creative Packages' && packagesEndingSoon > 0 && (
                    <p className="text-orange-400 text-xs mt-2 font-semibold">
                      ⚠️ {packagesEndingSoon} package{packagesEndingSoon > 1 ? 's' : ''} ending soon
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Workflow Status Overview */}
        <div className="mt-10">
          <h2 className="text-3xl font-bold mb-8 text-white">
            Workflow Status Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quotations */}
            <Card className="bg-[#1a1a1a] border border-gray-800 shadow-xl shadow-black/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-white">
                    Quotations
                  </CardTitle>
                  <div className="p-3 rounded-lg bg-orange-500">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-4xl font-bold text-white">
                      {workflowStats.quotations.total}
                    </span>
                    <span className="text-sm text-gray-400">Total</span>
                  </div>
                  <div className="border-t border-gray-700 pt-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Pending</span>
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                        {workflowStats.quotations.pending}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Approved</span>
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                        {workflowStats.quotations.approved}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Rejected</span>
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                        {workflowStats.quotations.rejected}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Job Sheets */}
            <Card className="bg-[#1a1a1a] border border-gray-800 shadow-xl shadow-black/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-white">
                    Job Sheets
                  </CardTitle>
                  <div className="p-3 rounded-lg bg-blue-500">
                    <ClipboardList className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-4xl font-bold text-white">
                      {workflowStats.jobSheets.total}
                    </span>
                    <span className="text-sm text-gray-400">Total</span>
                  </div>
                  <div className="border-t border-gray-700 pt-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">In Progress</span>
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {workflowStats.jobSheets.inProgress}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Completed</span>
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                        {workflowStats.jobSheets.completed}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bills */}
            <Card className="bg-[#1a1a1a] border border-gray-800 shadow-xl shadow-black/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-white">
                    Bills
                  </CardTitle>
                  <div className="p-3 rounded-lg bg-purple-500">
                    <Receipt className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-4xl font-bold text-white">
                      {workflowStats.bills.total}
                    </span>
                    <span className="text-sm text-gray-400">Total</span>
                  </div>
                  <div className="border-t border-gray-700 pt-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Pending</span>
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                        {workflowStats.bills.pending}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Partial</span>
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                        {workflowStats.bills.partial}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Paid</span>
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                        {workflowStats.bills.paid}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Company Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border border-gray-800 shadow-2xl shadow-black/50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">
              Company Settings
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Update your company information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="logo">Company Logo</Label>
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="mt-1"
              />
              {settings.logo && (
                <img src={settings.logo} alt="Logo preview" className="mt-2 h-20 object-contain" />
              )}
            </div>
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactNumber">Contact Number</Label>
                <Input
                  id="contactNumber"
                  value={settings.contactNumber}
                  onChange={(e) => setSettings({ ...settings, contactNumber: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="gst">GST Number</Label>
              <Input
                id="gst"
                value={settings.gst}
                onChange={(e) => setSettings({ ...settings, gst: e.target.value })}
              />
            </div>
            
            {/* Banking Details Section */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-semibold mb-4">Banking Details</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="accountHolderName">Account Holder Name</Label>
                  <Input
                    id="accountHolderName"
                    value={settings.accountHolderName || ''}
                    onChange={(e) => setSettings({ ...settings, accountHolderName: e.target.value })}
                    placeholder="Enter account holder name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      value={settings.bankName || ''}
                      onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                      placeholder="Enter bank name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="branch">Branch</Label>
                    <Input
                      id="branch"
                      value={settings.branch || ''}
                      onChange={(e) => setSettings({ ...settings, branch: e.target.value })}
                      placeholder="Enter branch name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      value={settings.accountNumber || ''}
                      onChange={(e) => setSettings({ ...settings, accountNumber: e.target.value })}
                      placeholder="Enter account number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ifscCode">IFSC Code</Label>
                    <Input
                      id="ifscCode"
                      value={settings.ifscCode || ''}
                      onChange={(e) => setSettings({ ...settings, ifscCode: e.target.value })}
                      placeholder="Enter IFSC code"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowSettings(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSettings} style={{ backgroundColor: '#1a2b4a' }}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}