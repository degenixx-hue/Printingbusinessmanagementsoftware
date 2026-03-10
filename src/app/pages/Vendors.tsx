import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useData } from '../context/DataContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { ArrowLeft, Plus, MoreVertical, Search, DollarSign, Trash2, Edit, FileText } from 'lucide-react';
import { toast } from 'sonner';
import degenixLogo from 'figma:asset/e686929947131e66770ed743ba284a27b15aa8de.png';
import { DateTimeDisplay } from '../components/DateTimeDisplay';

export default function Vendors() {
  const navigate = useNavigate();
  const {
    vendors,
    addVendor,
    updateVendor,
    deleteVendor,
    getVendorBalance,
    addVendorTransaction,
    getVendorAssignmentsByVendor,
    vendorAssignments,
    jobSheets,
  } = useData();

  const [showVendorDialog, setShowVendorDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showWorkDialog, setShowWorkDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [editingVendor, setEditingVendor] = useState<string | null>(null);

  const [vendorForm, setVendorForm] = useState({
    companyName: '',
    contactPerson: '',
    contactNumber: '',
    email: '',
    address: '',
    gst: '',
    specialization: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    paymentMethod: 'Cash',
  });

  const handleAddVendor = () => {
    if (!vendorForm.companyName || !vendorForm.contactPerson || !vendorForm.contactNumber) {
      toast.error('Please fill in required fields');
      return;
    }

    if (editingVendor) {
      updateVendor(editingVendor, vendorForm);
      toast.success('Vendor updated successfully');
    } else {
      addVendor(vendorForm);
      toast.success('Vendor added successfully');
    }

    setShowVendorDialog(false);
    setEditingVendor(null);
    setVendorForm({
      companyName: '',
      contactPerson: '',
      contactNumber: '',
      email: '',
      address: '',
      gst: '',
      specialization: '',
    });
  };

  const handleEditVendor = (vendorId: string) => {
    const vendor = vendors.find(v => v.id === vendorId);
    if (vendor) {
      setVendorForm({
        companyName: vendor.companyName,
        contactPerson: vendor.contactPerson,
        contactNumber: vendor.contactNumber,
        email: vendor.email,
        address: vendor.address,
        gst: vendor.gst || '',
        specialization: vendor.specialization,
      });
      setEditingVendor(vendorId);
      setShowVendorDialog(true);
    }
  };

  const handleDeleteVendor = (vendorId: string) => {
    if (confirm('Are you sure you want to delete this vendor?')) {
      deleteVendor(vendorId);
      toast.success('Vendor deleted successfully');
    }
  };

  const handleAddPayment = () => {
    if (!paymentForm.amount || !paymentForm.date || !paymentForm.description) {
      toast.error('Please fill in required fields');
      return;
    }

    const amount = parseFloat(paymentForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (selectedVendor) {
      // Create a payment transaction (Debit - we paid them, reduces what we owe)
      addVendorTransaction({
        date: paymentForm.date,
        vendorId: selectedVendor,
        type: 'Payment',
        description: paymentForm.description,
        debit: amount,
        credit: 0,
      });
      toast.success('Payment recorded successfully');
      setShowPaymentDialog(false);
      setPaymentForm({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        paymentMethod: 'Cash',
      });
    }
  };

  const handleOpenPayment = (vendorId: string) => {
    setSelectedVendor(vendorId);
    const balance = getVendorBalance(vendorId);
    // Auto-fill the balance amount
    setPaymentForm({
      ...paymentForm,
      amount: balance > 0 ? balance.toString() : '',
    });
    setShowPaymentDialog(true);
  };

  const handleOpenWork = (vendorId: string) => {
    setSelectedVendor(vendorId);
    setShowWorkDialog(true);
  };

  return (
    <div 
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)'
      }}
    >
      <div className="py-4 px-6 backdrop-blur-xl bg-[#1a1a1a]/95 border-b border-gray-800 shadow-lg shadow-black/50">
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
            <h1 className="text-white text-2xl font-bold">Printing Vendors</h1>
          </div>
          <div className="flex items-center gap-4">
            <DateTimeDisplay />
            <Button
              onClick={() => setShowVendorDialog(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Vendors Tab */}
          <div className="bg-[#0d1b2a] border border-gray-700 rounded-lg shadow">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/20 hover:bg-white/5">
                  <TableHead className="text-gray-200">Company Name</TableHead>
                  <TableHead className="text-gray-200">Contact Person</TableHead>
                  <TableHead className="text-gray-200">Phone</TableHead>
                  <TableHead className="text-gray-200">Specialization</TableHead>
                  <TableHead className="text-gray-200">Balance</TableHead>
                  <TableHead className="text-gray-200 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                      No vendors found. Add your first vendor to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  vendors.map((vendor) => {
                    const balance = getVendorBalance(vendor.id);
                    return (
                      <TableRow key={vendor.id} className="border-b border-white/10 hover:bg-white/5">
                        <TableCell className="text-white font-medium">{vendor.companyName}</TableCell>
                        <TableCell className="text-gray-300">{vendor.contactPerson}</TableCell>
                        <TableCell className="text-gray-300">{vendor.contactNumber}</TableCell>
                        <TableCell className="text-gray-300">{vendor.specialization}</TableCell>
                        <TableCell>
                          <span className={balance > 0 ? 'text-red-400 font-semibold' : 'text-green-400'}>
                            ₹{Math.abs(balance).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white hover:bg-white/10">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditVendor(vendor.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              {balance > 0 && (
                                <DropdownMenuItem onClick={() => handleOpenPayment(vendor.id)} className="text-green-600">
                                  <DollarSign className="mr-2 h-4 w-4" />
                                  Make Payment
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleDeleteVendor(vendor.id)} className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenWork(vendor.id)}>
                                <Search className="mr-2 h-4 w-4" />
                                View Work
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
        </div>
      </div>

      {/* Add/Edit Vendor Dialog */}
      <Dialog open={showVendorDialog} onOpenChange={setShowVendorDialog}>
        <DialogContent className="max-w-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={vendorForm.companyName}
                onChange={(e) => setVendorForm({ ...vendorForm, companyName: e.target.value })}
                placeholder="Enter company name"
              />
            </div>
            <div>
              <Label htmlFor="contactPerson">Contact Person *</Label>
              <Input
                id="contactPerson"
                value={vendorForm.contactPerson}
                onChange={(e) => setVendorForm({ ...vendorForm, contactPerson: e.target.value })}
                placeholder="Enter contact person"
              />
            </div>
            <div>
              <Label htmlFor="contactNumber">Contact Number *</Label>
              <Input
                id="contactNumber"
                value={vendorForm.contactNumber}
                onChange={(e) => setVendorForm({ ...vendorForm, contactNumber: e.target.value })}
                placeholder="Enter contact number"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={vendorForm.email}
                onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                placeholder="Enter email"
              />
            </div>
            <div>
              <Label htmlFor="specialization">Specialization</Label>
              <Input
                id="specialization"
                value={vendorForm.specialization}
                onChange={(e) => setVendorForm({ ...vendorForm, specialization: e.target.value })}
                placeholder="e.g., Printing, Lamination"
              />
            </div>
            <div>
              <Label htmlFor="gst">GST Number</Label>
              <Input
                id="gst"
                value={vendorForm.gst}
                onChange={(e) => setVendorForm({ ...vendorForm, gst: e.target.value })}
                placeholder="Enter GST number"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={vendorForm.address}
                onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                placeholder="Enter full address"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => {
              setShowVendorDialog(false);
              setEditingVendor(null);
              setVendorForm({
                companyName: '',
                contactPerson: '',
                contactNumber: '',
                email: '',
                address: '',
                gst: '',
                specialization: '',
              });
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddVendor} style={{ backgroundColor: '#1a2b4a' }}>
              {editingVendor ? 'Update' : 'Add'} Vendor
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Make Payment to Vendor</DialogTitle>
            {selectedVendor && (
              <DialogDescription className="text-sm text-muted-foreground pt-2">
                Outstanding Balance: <span className="font-semibold text-red-500">₹{getVendorBalance(selectedVendor).toFixed(2)}</span>
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="amount">Amount *</Label>
                {selectedVendor && getVendorBalance(selectedVendor) > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const balance = getVendorBalance(selectedVendor);
                      setPaymentForm({ ...paymentForm, amount: balance.toString() });
                    }}
                    className="h-7 text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                  >
                    Full Payment
                  </Button>
                )}
              </div>
              <Input
                id="amount"
                type="number"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                placeholder="Enter amount"
              />
            </div>
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={paymentForm.date}
                onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                placeholder="Enter date"
              />
            </div>
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={paymentForm.paymentMethod}
                onValueChange={(value) => setPaymentForm({ ...paymentForm, paymentMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue>{paymentForm.paymentMethod}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="Debit Card">Debit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={paymentForm.description}
                onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                placeholder="Enter payment description"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => {
              setShowPaymentDialog(false);
              setPaymentForm({
                amount: '',
                date: new Date().toISOString().split('T')[0],
                description: '',
                paymentMethod: 'Cash',
              });
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddPayment} className="bg-blue-600 hover:bg-blue-700">
              Add Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Work Dialog */}
      <Dialog open={showWorkDialog} onOpenChange={setShowWorkDialog}>
        <DialogContent className="!max-w-[96vw] w-[96vw] bg-[#1a2b4a] border border-white/20 p-8 shadow-2xl" aria-describedby={undefined}>
          <DialogHeader className="pb-6">
            <DialogTitle className="text-2xl text-white text-center">Vendor Work Assignments</DialogTitle>
            <DialogDescription className="text-base text-gray-300 text-center">
              {selectedVendor && `All work assigned to ${vendors.find(v => v.id === selectedVendor)?.companyName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="w-full">
            {selectedVendor && (
              <>
                {getVendorAssignmentsByVendor(selectedVendor).length === 0 ? (
                  <div className="text-center py-16 text-gray-400 text-lg">
                    No work assignments found for this vendor.
                  </div>
                ) : (
                  <div className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-lg overflow-hidden">
                    <div className="w-full overflow-x-auto">
                      <Table className="w-full">
                        <TableHeader>
                          <TableRow className="border-b border-gray-700 hover:bg-white/5">
                            <TableHead className="text-gray-200 font-semibold text-base whitespace-nowrap px-6 py-4">Job Sheet</TableHead>
                            <TableHead className="text-gray-200 font-semibold text-base whitespace-nowrap px-6 py-4">Job Name</TableHead>
                            <TableHead className="text-gray-200 font-semibold text-base whitespace-nowrap px-6 py-4">Work Type</TableHead>
                            <TableHead className="text-gray-200 font-semibold text-base whitespace-nowrap px-6 py-4">Status</TableHead>
                            <TableHead className="text-gray-200 font-semibold text-base text-right whitespace-nowrap px-6 py-4">Amount</TableHead>
                            <TableHead className="text-gray-200 font-semibold text-base text-right whitespace-nowrap px-6 py-4">Advance</TableHead>
                            <TableHead className="text-gray-200 font-semibold text-base text-right whitespace-nowrap px-6 py-4">Balance</TableHead>
                            <TableHead className="text-gray-200 font-semibold text-base whitespace-nowrap px-6 py-4">Payment Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getVendorAssignmentsByVendor(selectedVendor).map((assignment) => {
                            const jobSheet = jobSheets.find(js => js.id === assignment.jobSheetId);
                            const totalAmount = Number(assignment.totalAmount) || 0;
                            const advancePaid = Number(assignment.advancePaid) || 0;
                            const balance = totalAmount - advancePaid;
                            
                            return (
                              <TableRow key={assignment.id} className="border-b border-white/10 hover:bg-white/5">
                                <TableCell className="font-semibold text-white text-base px-6 py-4 whitespace-nowrap">{jobSheet?.jobSheetNumber || 'N/A'}</TableCell>
                                <TableCell className="text-gray-300 text-base px-6 py-4 whitespace-nowrap">{jobSheet?.jobName || 'N/A'}</TableCell>
                                <TableCell className="text-gray-300 text-base px-6 py-4 whitespace-nowrap">{assignment.workType}</TableCell>
                                <TableCell className="px-6 py-4">
                                  <span className={`px-3 py-1.5 rounded text-sm font-semibold whitespace-nowrap inline-block ${
                                    assignment.status === 'Completed' ? 'bg-green-600 text-white' :
                                    assignment.status === 'In Progress' ? 'bg-blue-600 text-white' :
                                    'bg-yellow-600 text-white'
                                  }`}>
                                    {assignment.status}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right font-semibold text-white text-base px-6 py-4 whitespace-nowrap">₹{totalAmount.toFixed(2)}</TableCell>
                                <TableCell className="text-right text-gray-300 text-base px-6 py-4 whitespace-nowrap">₹{advancePaid.toFixed(2)}</TableCell>
                                <TableCell className="text-right font-semibold text-base px-6 py-4 whitespace-nowrap">
                                  <span className={balance > 0 ? 'text-red-400' : 'text-green-400'}>
                                    ₹{balance.toFixed(2)}
                                  </span>
                                </TableCell>
                                <TableCell className="px-6 py-4">
                                  <span className={`px-3 py-1.5 rounded text-sm font-semibold whitespace-nowrap inline-block ${
                                    assignment.paymentStatus === 'Paid' ? 'bg-green-600 text-white' :
                                    assignment.paymentStatus === 'Partial' ? 'bg-yellow-600 text-white' :
                                    'bg-red-600 text-white'
                                  }`}>
                                    {assignment.paymentStatus}
                                  </span>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex justify-center pt-6 border-t border-white/20 mt-6">
            <Button variant="outline" onClick={() => setShowWorkDialog(false)} className="text-base px-8 py-2.5 border-white/20 text-white hover:bg-white/10">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}