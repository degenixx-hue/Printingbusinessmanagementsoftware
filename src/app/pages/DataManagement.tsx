import { useState, useRef, ChangeEvent } from 'react';
import { useNavigate } from 'react-router';
import { useData } from '../context/DataContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Download, Upload, Trash2, AlertTriangle, ChevronDown, ChevronUp, Calendar, Code, FileCode } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import degenixLogo from 'figma:asset/e686929947131e66770ed743ba284a27b15aa8de.png';
import { DateTimeDisplay } from '../components/DateTimeDisplay';
import { AutoSyncSettings } from '../components/AutoSyncSettings';
import { DomainSyncSettings } from '../components/DomainSyncSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export default function DataManagement() {
  const navigate = useNavigate();
  const { 
    exportData, 
    importData, 
    clients,
    products,
    quotations,
    jobSheets,
    bills,
    users,
    staff,
    payrollRecords,
    transactions,
    vendors,
    vendorAssignments,
    vendorTransactions,
    festivals,
    addFestival,
    deleteClient,
    deleteProduct,
    deleteQuotation,
    deleteJobSheet,
    deleteBill,
    deleteUser,
    deleteStaff,
    deletePayrollRecord,
    deleteTransaction,
    deleteVendor,
    deleteVendorAssignment,
    deleteVendorTransaction,
    getClientById,
    getProductById,
    getVendorById,
    getJobSheetById,
  } = useData();
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const festivalFileInputRef = useRef<HTMLInputElement>(null);

  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    clients: false,
    products: false,
    quotations: false,
    jobSheets: false,
    bills: false,
    users: false,
    staff: false,
    payroll: false,
    transactions: false,
    vendors: false,
    vendorAssignments: false,
    vendorTransactions: false,
  });

  // Selected items for deletion
  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>({
    clients: [],
    products: [],
    quotations: [],
    jobSheets: [],
    bills: [],
    users: [],
    staff: [],
    payroll: [],
    transactions: [],
    vendors: [],
    vendorAssignments: [],
    vendorTransactions: [],
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleItemSelection = (section: string, itemId: string) => {
    setSelectedItems(prev => {
      const sectionItems = prev[section] || [];
      const isSelected = sectionItems.includes(itemId);
      
      return {
        ...prev,
        [section]: isSelected
          ? sectionItems.filter(id => id !== itemId)
          : [...sectionItems, itemId]
      };
    });
  };

  const toggleAllInSection = (section: string, allIds: string[]) => {
    setSelectedItems(prev => {
      const sectionItems = prev[section] || [];
      const allSelected = allIds.length > 0 && allIds.every(id => sectionItems.includes(id));
      
      return {
        ...prev,
        [section]: allSelected ? [] : allIds
      };
    });
  };

  const getTotalSelectedCount = () => {
    return Object.values(selectedItems).reduce((sum, arr) => sum + arr.length, 0);
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `degenix_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

  const handleImport = () => {
    if (!importText.trim()) {
      toast.error('Please paste JSON data to import');
      return;
    }
    try {
      setIsImporting(true);
      importData(importText);
      toast.success('Data imported successfully! Page will reload...');
      setShowImportDialog(false);
      setImportText('');
      // Reload page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      toast.error('Failed to import data. Please check the format.');
      setIsImporting(false);
    }
  };

  const handleFileImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.name.endsWith('.json')) {
        toast.error('Please select a valid JSON file');
        e.target.value = '';
        return;
      }

      setIsImporting(true);
      toast.loading('Importing data...');
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        try {
          importData(text);
          toast.dismiss();
          toast.success('Data imported successfully! Page will reload...');
          // Reload page after a short delay
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } catch (error) {
          toast.dismiss();
          toast.error('Failed to import data. Please check the file format.');
          setIsImporting(false);
        }
      };
      reader.onerror = () => {
        toast.dismiss();
        toast.error('Failed to read file. Please try again.');
        setIsImporting(false);
      };
      reader.readAsText(file);
    }
    // Reset file input
    e.target.value = '';
  };

  const triggerFileUpload = () => {
    if (isImporting) return;
    fileInputRef.current?.click();
  };

  const handleDelete = () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type "DELETE" to confirm');
      return;
    }

    let deletedCount = 0;

    // Delete selected items
    selectedItems.clients.forEach(clientId => { deleteClient(clientId); deletedCount++; });
    selectedItems.products.forEach(productId => { deleteProduct(productId); deletedCount++; });
    selectedItems.quotations.forEach(quotationId => { deleteQuotation(quotationId); deletedCount++; });
    selectedItems.jobSheets.forEach(jobSheetId => { deleteJobSheet(jobSheetId); deletedCount++; });
    selectedItems.bills.forEach(billId => { deleteBill(billId); deletedCount++; });
    selectedItems.users.forEach(userId => { deleteUser(userId); deletedCount++; });
    selectedItems.staff.forEach(staffId => { deleteStaff(staffId); deletedCount++; });
    selectedItems.payroll.forEach(recordId => { deletePayrollRecord(recordId); deletedCount++; });
    selectedItems.transactions.forEach(transactionId => { deleteTransaction(transactionId); deletedCount++; });
    selectedItems.vendors.forEach(vendorId => { deleteVendor(vendorId); deletedCount++; });
    selectedItems.vendorAssignments.forEach(assignmentId => { deleteVendorAssignment(assignmentId); deletedCount++; });
    selectedItems.vendorTransactions.forEach(transactionId => { deleteVendorTransaction(transactionId); deletedCount++; });

    toast.success(`Successfully deleted ${deletedCount} item(s)!`);
    setShowDeleteDialog(false);
    setDeleteConfirmText('');
    // Reset all selections
    setSelectedItems({
      clients: [],
      products: [],
      quotations: [],
      jobSheets: [],
      bills: [],
      users: [],
      staff: [],
      payroll: [],
      transactions: [],
      vendors: [],
      vendorAssignments: [],
      vendorTransactions: [],
    });
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
            <h1 className="text-white text-2xl font-bold">Data Management</h1>
          </div>
          <DateTimeDisplay />
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Festival Management Quick Access */}
          <Card className="bg-[#1a1a1a] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Festival Management</CardTitle>
              <CardDescription className="text-gray-400">
                Manage festivals for creative packages - these will be available for assignment in tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/festival-management')} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Open Festival Management
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Export Data */}
            <Card className="bg-[#1a1a1a] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Export Data</CardTitle>
                <CardDescription className="text-gray-400">
                  Download a backup of all your business data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleExport} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Download className="mr-2 h-4 w-4" />
                  Download Backup
                </Button>
              </CardContent>
            </Card>

            {/* Import Data */}
            <Card className="bg-[#1a1a1a] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Import Data</CardTitle>
                <CardDescription className="text-gray-400">
                  Restore data from a backup file
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={triggerFileUpload}
                  disabled={isImporting}
                  className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  {isImporting ? 'Importing...' : 'Choose File from PC'}
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#1a1a1a] px-2 text-gray-400">Or</span>
                  </div>
                </div>
                <Button
                  onClick={() => setShowImportDialog(true)}
                  disabled={isImporting}
                  variant="outline"
                  className="w-full border-gray-700 text-gray-200 hover:bg-white/10"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Paste JSON Text
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                  disabled={isImporting}
                />
              </CardContent>
            </Card>
          </div>

          {/* Warning */}
          <Card className="border-blue-500/50 bg-blue-600/20">
            <CardHeader>
              <CardTitle className="text-white">⚠️ Important Notice</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-sm text-white">
                <li>Always create a backup before importing new data</li>
                <li>Importing data will overwrite existing data</li>
                <li>Keep your backup files in a secure location</li>
                <li>Regular backups are recommended to prevent data loss</li>
              </ul>
            </CardContent>
          </Card>

          {/* Delete Data */}
          <Card className="border-red-500/30 bg-[#1a1a1a]">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Delete Data (Administrator Only)
              </CardTitle>
              <CardDescription className="text-red-300">
                Select individual items from any segment below to delete permanently. This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Quotations */}
                <div className="border border-red-500/30 rounded-lg bg-[#1a1a1a]">
                  <div className="p-3 bg-red-500/10 border-b border-red-500/30">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-red-400">Quotations</h3>
                      <div className="flex items-center gap-2">
                        {selectedItems.quotations.length > 0 && (
                          <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">
                            {selectedItems.quotations.length} selected
                          </span>
                        )}
                        <span className="text-xs text-red-300 font-semibold">
                          Total: {quotations.length}
                        </span>
                      </div>
                    </div>
                    {quotations.length > 0 && (
                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox
                          id="quotations-all"
                          checked={quotations.length > 0 && quotations.every(q => selectedItems.quotations.includes(q.id))}
                          onCheckedChange={() => toggleAllInSection('quotations', quotations.map(q => q.id))}
                        />
                        <Label htmlFor="quotations-all" className="text-xs text-red-300 cursor-pointer font-semibold">
                          Select All Quotations
                        </Label>
                      </div>
                    )}
                  </div>
                  <div className="p-2 max-h-48 overflow-y-auto">
                    {quotations.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">No quotations to delete</p>
                    ) : (
                      <div className="space-y-1">
                        {quotations.map(quotation => {
                          const client = getClientById(quotation.clientId);
                          return (
                            <div key={quotation.id} className="flex items-start space-x-2 px-2 py-2 hover:bg-red-500/5 rounded">
                              <Checkbox
                                id={`quotation-${quotation.id}`}
                                checked={selectedItems.quotations.includes(quotation.id)}
                                onCheckedChange={() => toggleItemSelection('quotations', quotation.id)}
                                className="mt-0.5"
                              />
                              <Label htmlFor={`quotation-${quotation.id}`} className="text-xs text-gray-200 cursor-pointer flex-1 leading-tight">
                                <div className="font-semibold">{quotation.quotationNumber}</div>
                                <div className="text-gray-400">{client?.companyName}</div>
                                <div className="text-gray-400">₹{Number(quotation.totalAmount || 0).toFixed(2)} • {new Date(quotation.createdAt).toLocaleDateString()}</div>
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Job Sheets */}
                <div className="border border-red-500/30 rounded-lg bg-[#1a1a1a]">
                  <div className="p-3 bg-red-500/10 border-b border-red-500/30">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-red-400">Job Sheets</h3>
                      <div className="flex items-center gap-2">
                        {selectedItems.jobSheets.length > 0 && (
                          <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">
                            {selectedItems.jobSheets.length} selected
                          </span>
                        )}
                        <span className="text-xs text-red-300 font-semibold">
                          Total: {jobSheets.length}
                        </span>
                      </div>
                    </div>
                    {jobSheets.length > 0 && (
                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox
                          id="jobSheets-all"
                          checked={jobSheets.length > 0 && jobSheets.every(j => selectedItems.jobSheets.includes(j.id))}
                          onCheckedChange={() => toggleAllInSection('jobSheets', jobSheets.map(j => j.id))}
                        />
                        <Label htmlFor="jobSheets-all" className="text-xs text-red-300 cursor-pointer font-semibold">
                          Select All Job Sheets
                        </Label>
                      </div>
                    )}
                  </div>
                  <div className="p-2 max-h-48 overflow-y-auto">
                    {jobSheets.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">No job sheets to delete</p>
                    ) : (
                      <div className="space-y-1">
                        {jobSheets.map(jobSheet => {
                          const client = getClientById(jobSheet.clientId);
                          const product = getProductById(jobSheet.productId);
                          return (
                            <div key={jobSheet.id} className="flex items-start space-x-2 px-2 py-2 hover:bg-red-500/5 rounded">
                              <Checkbox
                                id={`jobSheet-${jobSheet.id}`}
                                checked={selectedItems.jobSheets.includes(jobSheet.id)}
                                onCheckedChange={() => toggleItemSelection('jobSheets', jobSheet.id)}
                                className="mt-0.5"
                              />
                              <Label htmlFor={`jobSheet-${jobSheet.id}`} className="text-xs text-gray-200 cursor-pointer flex-1 leading-tight">
                                <div className="font-semibold">{jobSheet.jobSheetNumber}</div>
                                <div className="text-gray-400">{product?.productName}</div>
                                <div className="text-gray-400">{client?.companyName} • {jobSheet.status}</div>
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bills */}
                <div className="border border-red-500/30 rounded-lg bg-[#1a1a1a]">
                  <div className="p-3 bg-red-500/10 border-b border-red-500/30">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-red-400">Bills</h3>
                      <div className="flex items-center gap-2">
                        {selectedItems.bills.length > 0 && (
                          <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">
                            {selectedItems.bills.length} selected
                          </span>
                        )}
                        <span className="text-xs text-red-300 font-semibold">
                          Total: {bills.length}
                        </span>
                      </div>
                    </div>
                    {bills.length > 0 && (
                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox
                          id="bills-all"
                          checked={bills.length > 0 && bills.every(b => selectedItems.bills.includes(b.id))}
                          onCheckedChange={() => toggleAllInSection('bills', bills.map(b => b.id))}
                        />
                        <Label htmlFor="bills-all" className="text-xs text-red-300 cursor-pointer font-semibold">
                          Select All Bills
                        </Label>
                      </div>
                    )}
                  </div>
                  <div className="p-2 max-h-48 overflow-y-auto">
                    {bills.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">No bills to delete</p>
                    ) : (
                      <div className="space-y-1">
                        {bills.map(bill => {
                          const client = getClientById(bill.clientId);
                          return (
                            <div key={bill.id} className="flex items-start space-x-2 px-2 py-2 hover:bg-red-500/5 rounded">
                              <Checkbox
                                id={`bill-${bill.id}`}
                                checked={selectedItems.bills.includes(bill.id)}
                                onCheckedChange={() => toggleItemSelection('bills', bill.id)}
                                className="mt-0.5"
                              />
                              <Label htmlFor={`bill-${bill.id}`} className="text-xs text-gray-200 cursor-pointer flex-1 leading-tight">
                                <div className="font-semibold">{bill.billNumber}</div>
                                <div className="text-gray-400">{client?.companyName}</div>
                                <div className="text-gray-400">₹{Number(bill.totalAmount || 0).toFixed(2)} • {bill.paymentStatus}</div>
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Clients */}
                <div className="border border-red-500/30 rounded-lg bg-[#1a1a1a]">
                  <div className="p-3 bg-red-500/10 border-b border-red-500/30">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-red-400">Clients</h3>
                      <div className="flex items-center gap-2">
                        {selectedItems.clients.length > 0 && (
                          <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">
                            {selectedItems.clients.length} selected
                          </span>
                        )}
                        <span className="text-xs text-red-300 font-semibold">
                          Total: {clients.length}
                        </span>
                      </div>
                    </div>
                    {clients.length > 0 && (
                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox
                          id="clients-all"
                          checked={clients.length > 0 && clients.every(c => selectedItems.clients.includes(c.id))}
                          onCheckedChange={() => toggleAllInSection('clients', clients.map(c => c.id))}
                        />
                        <Label htmlFor="clients-all" className="text-xs text-red-300 cursor-pointer font-semibold">
                          Select All Clients
                        </Label>
                      </div>
                    )}
                  </div>
                  <div className="p-2 max-h-48 overflow-y-auto">
                    {clients.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">No clients to delete</p>
                    ) : (
                      <div className="space-y-1">
                        {clients.map(client => (
                          <div key={client.id} className="flex items-start space-x-2 px-2 py-2 hover:bg-red-500/5 rounded">
                            <Checkbox
                              id={`client-${client.id}`}
                              checked={selectedItems.clients.includes(client.id)}
                              onCheckedChange={() => toggleItemSelection('clients', client.id)}
                              className="mt-0.5"
                            />
                            <Label htmlFor={`client-${client.id}`} className="text-xs text-gray-200 cursor-pointer flex-1 leading-tight">
                              <div className="font-semibold">{client.companyName}</div>
                              <div className="text-gray-400">{client.clientName}</div>
                              <div className="text-gray-400">{client.contactNumber}</div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Products */}
                <div className="border border-red-500/30 rounded-lg bg-[#1a1a1a]">
                  <div className="p-3 bg-red-500/10 border-b border-red-500/30">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-red-400">Products</h3>
                      <div className="flex items-center gap-2">
                        {selectedItems.products.length > 0 && (
                          <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">
                            {selectedItems.products.length} selected
                          </span>
                        )}
                        <span className="text-xs text-red-300 font-semibold">
                          Total: {products.length}
                        </span>
                      </div>
                    </div>
                    {products.length > 0 && (
                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox
                          id="products-all"
                          checked={products.length > 0 && products.every(p => selectedItems.products.includes(p.id))}
                          onCheckedChange={() => toggleAllInSection('products', products.map(p => p.id))}
                        />
                        <Label htmlFor="products-all" className="text-xs text-red-300 cursor-pointer font-semibold">
                          Select All Products
                        </Label>
                      </div>
                    )}
                  </div>
                  <div className="p-2 max-h-48 overflow-y-auto">
                    {products.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">No products to delete</p>
                    ) : (
                      <div className="space-y-1">
                        {products.map(product => (
                          <div key={product.id} className="flex items-start space-x-2 px-2 py-2 hover:bg-red-500/5 rounded">
                            <Checkbox
                              id={`product-${product.id}`}
                              checked={selectedItems.products.includes(product.id)}
                              onCheckedChange={() => toggleItemSelection('products', product.id)}
                              className="mt-0.5"
                            />
                            <Label htmlFor={`product-${product.id}`} className="text-xs text-gray-200 cursor-pointer flex-1 leading-tight">
                              <div className="font-semibold">{product.productName}</div>
                              <div className="text-gray-400">{product.productCategory}</div>
                              <div className="text-gray-400">₹{Number(product.pricePerUnit || 0).toFixed(2)}</div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Users */}
                <div className="border border-red-500/30 rounded-lg bg-[#1a1a1a]">
                  <div className="p-3 bg-red-500/10 border-b border-red-500/30">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-red-400">Users</h3>
                      <div className="flex items-center gap-2">
                        {selectedItems.users.length > 0 && (
                          <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">
                            {selectedItems.users.length} selected
                          </span>
                        )}
                        <span className="text-xs text-red-300 font-semibold">
                          Total: {users.length}
                        </span>
                      </div>
                    </div>
                    {users.length > 0 && (
                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox
                          id="users-all"
                          checked={users.length > 0 && users.every(u => selectedItems.users.includes(u.id))}
                          onCheckedChange={() => toggleAllInSection('users', users.map(u => u.id))}
                        />
                        <Label htmlFor="users-all" className="text-xs text-red-300 cursor-pointer font-semibold">
                          Select All Users
                        </Label>
                      </div>
                    )}
                  </div>
                  <div className="p-2 max-h-48 overflow-y-auto">
                    {users.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">No users to delete</p>
                    ) : (
                      <div className="space-y-1">
                        {users.map(user => (
                          <div key={user.id} className="flex items-start space-x-2 px-2 py-2 hover:bg-red-500/5 rounded">
                            <Checkbox
                              id={`user-${user.id}`}
                              checked={selectedItems.users.includes(user.id)}
                              onCheckedChange={() => toggleItemSelection('users', user.id)}
                              className="mt-0.5"
                            />
                            <Label htmlFor={`user-${user.id}`} className="text-xs text-gray-200 cursor-pointer flex-1 leading-tight">
                              <div className="font-semibold">{user.username}</div>
                              <div className="text-gray-400">{user.role}</div>
                              <div className="text-gray-400">{user.fullName}</div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Vendors */}
                <div className="border border-red-500/30 rounded-lg bg-[#1a1a1a]">
                  <div className="p-3 bg-red-500/10 border-b border-red-500/30">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-red-400">Vendors</h3>
                      <div className="flex items-center gap-2">
                        {selectedItems.vendors.length > 0 && (
                          <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">
                            {selectedItems.vendors.length} selected
                          </span>
                        )}
                        <span className="text-xs text-red-300 font-semibold">
                          Total: {vendors.length}
                        </span>
                      </div>
                    </div>
                    {vendors.length > 0 && (
                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox
                          id="vendors-all"
                          checked={vendors.length > 0 && vendors.every(v => selectedItems.vendors.includes(v.id))}
                          onCheckedChange={() => toggleAllInSection('vendors', vendors.map(v => v.id))}
                        />
                        <Label htmlFor="vendors-all" className="text-xs text-red-300 cursor-pointer font-semibold">
                          Select All Vendors
                        </Label>
                      </div>
                    )}
                  </div>
                  <div className="p-2 max-h-48 overflow-y-auto">
                    {vendors.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">No vendors to delete</p>
                    ) : (
                      <div className="space-y-1">
                        {vendors.map(vendor => (
                          <div key={vendor.id} className="flex items-start space-x-2 px-2 py-2 hover:bg-red-500/5 rounded">
                            <Checkbox
                              id={`vendor-${vendor.id}`}
                              checked={selectedItems.vendors.includes(vendor.id)}
                              onCheckedChange={() => toggleItemSelection('vendors', vendor.id)}
                              className="mt-0.5"
                            />
                            <Label htmlFor={`vendor-${vendor.id}`} className="text-xs text-gray-200 cursor-pointer flex-1 leading-tight">
                              <div className="font-semibold">{vendor.companyName}</div>
                              <div className="text-gray-400">{vendor.contactPerson}</div>
                              <div className="text-gray-400">{vendor.contactNumber}</div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Transactions */}
                <div className="border border-red-500/30 rounded-lg bg-[#1a1a1a]">
                  <div className="p-3 bg-red-500/10 border-b border-red-500/30">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-red-400">Account Transactions</h3>
                      <div className="flex items-center gap-2">
                        {selectedItems.transactions.length > 0 && (
                          <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">
                            {selectedItems.transactions.length} selected
                          </span>
                        )}
                        <span className="text-xs text-red-300 font-semibold">
                          Total: {transactions.length}
                        </span>
                      </div>
                    </div>
                    {transactions.length > 0 && (
                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox
                          id="transactions-all"
                          checked={transactions.length > 0 && transactions.every(t => selectedItems.transactions.includes(t.id))}
                          onCheckedChange={() => toggleAllInSection('transactions', transactions.map(t => t.id))}
                        />
                        <Label htmlFor="transactions-all" className="text-xs text-red-300 cursor-pointer font-semibold">
                          Select All Transactions
                        </Label>
                      </div>
                    )}
                  </div>
                  <div className="p-2 max-h-48 overflow-y-auto">
                    {transactions.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">No transactions to delete</p>
                    ) : (
                      <div className="space-y-1">
                        {transactions.map(transaction => {
                          const client = getClientById(transaction.clientId);
                          return (
                            <div key={transaction.id} className="flex items-start space-x-2 px-2 py-2 hover:bg-red-500/5 rounded">
                              <Checkbox
                                id={`transaction-${transaction.id}`}
                                checked={selectedItems.transactions.includes(transaction.id)}
                                onCheckedChange={() => toggleItemSelection('transactions', transaction.id)}
                                className="mt-0.5"
                              />
                              <Label htmlFor={`transaction-${transaction.id}`} className="text-xs text-gray-200 cursor-pointer flex-1 leading-tight">
                                <div className="font-semibold">{transaction.type}</div>
                                <div className="text-gray-400">{client?.companyName}</div>
                                <div className="text-gray-400">₹{Number(transaction.debit || transaction.credit || 0).toFixed(2)} • {new Date(transaction.date).toLocaleDateString()}</div>
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Vendor Assignments */}
                <div className="border border-red-500/30 rounded-lg bg-[#1a1a1a]">
                  <div className="p-3 bg-red-500/10 border-b border-red-500/30">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-red-400">Vendor Assignments</h3>
                      <div className="flex items-center gap-2">
                        {selectedItems.vendorAssignments.length > 0 && (
                          <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">
                            {selectedItems.vendorAssignments.length} selected
                          </span>
                        )}
                        <span className="text-xs text-red-300 font-semibold">
                          Total: {vendorAssignments.length}
                        </span>
                      </div>
                    </div>
                    {vendorAssignments.length > 0 && (
                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox
                          id="vendorAssignments-all"
                          checked={vendorAssignments.length > 0 && vendorAssignments.every(va => selectedItems.vendorAssignments.includes(va.id))}
                          onCheckedChange={() => toggleAllInSection('vendorAssignments', vendorAssignments.map(va => va.id))}
                        />
                        <Label htmlFor="vendorAssignments-all" className="text-xs text-red-300 cursor-pointer font-semibold">
                          Select All Vendor Assignments
                        </Label>
                      </div>
                    )}
                  </div>
                  <div className="p-2 max-h-48 overflow-y-auto">
                    {vendorAssignments.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">No vendor assignments to delete</p>
                    ) : (
                      <div className="space-y-1">
                        {vendorAssignments.map(assignment => {
                          const vendor = getVendorById(assignment.vendorId);
                          const jobSheet = getJobSheetById(assignment.jobSheetId);
                          return (
                            <div key={assignment.id} className="flex items-start space-x-2 px-2 py-2 hover:bg-red-500/5 rounded">
                              <Checkbox
                                id={`vendorAssignment-${assignment.id}`}
                                checked={selectedItems.vendorAssignments.includes(assignment.id)}
                                onCheckedChange={() => toggleItemSelection('vendorAssignments', assignment.id)}
                                className="mt-0.5"
                              />
                              <Label htmlFor={`vendorAssignment-${assignment.id}`} className="text-xs text-gray-200 cursor-pointer flex-1 leading-tight">
                                <div className="font-semibold">{vendor?.companyName || 'Unknown Vendor'}</div>
                                <div className="text-gray-400">{jobSheet?.jobSheetNumber || 'N/A'} • {assignment.workType}</div>
                                <div className="text-gray-400">₹{Number(assignment.totalAmount || 0).toFixed(2)} • {assignment.paymentStatus}</div>
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Vendor Transactions */}
                <div className="border border-red-500/30 rounded-lg bg-[#1a1a1a]">
                  <div className="p-3 bg-red-500/10 border-b border-red-500/30">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-red-400">Vendor Payments</h3>
                      <div className="flex items-center gap-2">
                        {selectedItems.vendorTransactions.length > 0 && (
                          <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">
                            {selectedItems.vendorTransactions.length} selected
                          </span>
                        )}
                        <span className="text-xs text-red-300 font-semibold">
                          Total: {vendorTransactions.length}
                        </span>
                      </div>
                    </div>
                    {vendorTransactions.length > 0 && (
                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox
                          id="vendorTransactions-all"
                          checked={vendorTransactions.length > 0 && vendorTransactions.every(vt => selectedItems.vendorTransactions.includes(vt.id))}
                          onCheckedChange={() => toggleAllInSection('vendorTransactions', vendorTransactions.map(vt => vt.id))}
                        />
                        <Label htmlFor="vendorTransactions-all" className="text-xs text-red-300 cursor-pointer font-semibold">
                          Select All Vendor Payments
                        </Label>
                      </div>
                    )}
                  </div>
                  <div className="p-2 max-h-48 overflow-y-auto">
                    {vendorTransactions.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">No vendor payments to delete</p>
                    ) : (
                      <div className="space-y-1">
                        {vendorTransactions.map(transaction => {
                          const vendor = getVendorById(transaction.vendorId);
                          return (
                            <div key={transaction.id} className="flex items-start space-x-2 px-2 py-2 hover:bg-red-500/5 rounded">
                              <Checkbox
                                id={`vendorTransaction-${transaction.id}`}
                                checked={selectedItems.vendorTransactions.includes(transaction.id)}
                                onCheckedChange={() => toggleItemSelection('vendorTransactions', transaction.id)}
                                className="mt-0.5"
                              />
                              <Label htmlFor={`vendorTransaction-${transaction.id}`} className="text-xs text-gray-200 cursor-pointer flex-1 leading-tight">
                                <div className="font-semibold">{vendor?.companyName}</div>
                                <div className="text-gray-400">{transaction.type} • {transaction.description}</div>
                                <div className="text-gray-400">₹{Number(transaction.debit || transaction.credit || 0).toFixed(2)} • {new Date(transaction.date).toLocaleDateString()}</div>
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Delete Button */}
              <div className="mt-6 pt-4 border-t border-red-500/30">
                <Button
                  onClick={() => setShowDeleteDialog(true)}
                  variant="destructive"
                  className="w-full"
                  disabled={getTotalSelectedCount() === 0}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected Items ({getTotalSelectedCount()})
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={(open) => !isImporting && setShowImportDialog(open)}>
        <DialogContent className="max-w-2xl bg-[#1a1a1a] border border-gray-800 shadow-2xl shadow-black/50">
          <DialogHeader>
            <DialogTitle>Import Data from Text</DialogTitle>
            <DialogDescription>
              Paste your backup JSON data below. This is useful if you copied the data from another source.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <textarea
              className="w-full h-64 p-3 border rounded-md font-mono text-sm"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='Paste JSON data here... (e.g., {"companySettings": {...}, "clients": [...], ...})'
              disabled={isImporting}
            />
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowImportDialog(false)}
                disabled={isImporting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleImport} 
                style={{ backgroundColor: '#1a2b4a' }}
                disabled={isImporting}
              >
                <Upload className="mr-2 h-4 w-4" />
                {isImporting ? 'Importing...' : 'Import Data'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-2xl bg-[#1a1a1a] border border-gray-800 shadow-2xl shadow-black/50">
          <DialogHeader>
            <DialogTitle>Delete Data</DialogTitle>
            <DialogDescription>
              Type "DELETE" in the box below to confirm deletion of selected data. This action is irreversible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              className="w-full p-3 border rounded-md text-sm"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder='Type "DELETE" to confirm'
            />
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDelete} 
                style={{ backgroundColor: '#1a2b4a' }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Data
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}