import { useState, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
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
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ArrowLeft, Plus, Trash2, DollarSign, Users, Calendar, Edit, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '../components/ui/textarea';
import degenixLogo from 'figma:asset/e686929947131e66770ed743ba284a27b15aa8de.png';
import { DateTimeDisplay } from '../components/DateTimeDisplay';

export default function StaffPayroll() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') || 'staff';
  const { staff, addStaff, updateStaff, deleteStaff, payrollRecords, addPayrollRecord, updatePayrollRecord, deletePayrollRecord, companySettings } = useData();

  const [showStaffDialog, setShowStaffDialog] = useState(false);
  const [showPayrollDialog, setShowPayrollDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState<string | null>(null);
  const [editingPayroll, setEditingPayroll] = useState<string | null>(null);

  const [newStaff, setNewStaff] = useState({
    fullName: '',
    designation: '',
    contactNumber: '',
    email: '',
    address: '',
    dateOfJoining: new Date().toISOString().split('T')[0],
    monthlySalary: 0,
    accountNumber: '',
    ifscCode: '',
    panNumber: '',
    aadharNumber: '',
    status: 'Active' as 'Active' | 'Inactive',
  });

  const [newPayroll, setNewPayroll] = useState({
    staffId: '',
    month: new Date().toISOString().slice(0, 7),
    basicSalary: 0,
    allowances: 0,
    deductions: 0,
    netSalary: 0,
    paymentDate: '',
    paymentStatus: 'Pending' as 'Pending' | 'Paid',
    paymentMode: '' as '' | 'Cash' | 'Bank Transfer' | 'Cheque',
    remarks: '',
  });

  const handleAddStaff = () => {
    if (!newStaff.fullName || !newStaff.designation || !newStaff.contactNumber) {
      toast.error('Please fill all required fields');
      return;
    }

    if (editingStaff) {
      updateStaff(editingStaff, newStaff);
      toast.success('Staff updated successfully');
    } else {
      addStaff(newStaff);
      toast.success('Staff added successfully');
    }

    setShowStaffDialog(false);
    setEditingStaff(null);
    resetStaffForm();
  };

  const handleEditStaff = (id: string) => {
    const staffMember = staff.find(s => s.id === id);
    if (staffMember) {
      setNewStaff({
        fullName: staffMember.fullName,
        designation: staffMember.designation,
        contactNumber: staffMember.contactNumber,
        email: staffMember.email,
        address: staffMember.address,
        dateOfJoining: staffMember.dateOfJoining,
        monthlySalary: staffMember.monthlySalary,
        accountNumber: staffMember.accountNumber || '',
        ifscCode: staffMember.ifscCode || '',
        panNumber: staffMember.panNumber || '',
        aadharNumber: staffMember.aadharNumber || '',
        status: staffMember.status,
      });
      setEditingStaff(id);
      setShowStaffDialog(true);
    }
  };

  const handleDeleteStaff = (id: string) => {
    if (confirm('Are you sure you want to delete this staff member?')) {
      deleteStaff(id);
      toast.success('Staff deleted successfully');
    }
  };

  const resetStaffForm = () => {
    setNewStaff({
      fullName: '',
      designation: '',
      contactNumber: '',
      email: '',
      address: '',
      dateOfJoining: new Date().toISOString().split('T')[0],
      monthlySalary: 0,
      accountNumber: '',
      ifscCode: '',
      panNumber: '',
      aadharNumber: '',
      status: 'Active',
    });
  };

  const handleAddPayroll = () => {
    if (!newPayroll.staffId || !newPayroll.month) {
      toast.error('Please fill all required fields');
      return;
    }

    const netSalary = newPayroll.basicSalary + newPayroll.allowances - newPayroll.deductions;

    if (editingPayroll) {
      updatePayrollRecord(editingPayroll, { ...newPayroll, netSalary });
      toast.success('Payroll record updated successfully');
    } else {
      addPayrollRecord({ ...newPayroll, netSalary });
      toast.success('Payroll record added successfully');
    }

    setShowPayrollDialog(false);
    setEditingPayroll(null);
    resetPayrollForm();
  };

  const handleEditPayroll = (id: string) => {
    const payroll = payrollRecords.find(p => p.id === id);
    if (payroll) {
      setNewPayroll({
        staffId: payroll.staffId,
        month: payroll.month,
        basicSalary: payroll.basicSalary,
        allowances: payroll.allowances,
        deductions: payroll.deductions,
        netSalary: payroll.netSalary,
        paymentDate: payroll.paymentDate || '',
        paymentStatus: payroll.paymentStatus,
        paymentMode: payroll.paymentMode || '',
        remarks: payroll.remarks || '',
      });
      setEditingPayroll(id);
      setShowPayrollDialog(true);
    }
  };

  const handleDeletePayroll = (id: string) => {
    if (confirm('Are you sure you want to delete this payroll record?')) {
      deletePayrollRecord(id);
      toast.success('Payroll record deleted successfully');
    }
  };

  const resetPayrollForm = () => {
    setNewPayroll({
      staffId: '',
      month: new Date().toISOString().slice(0, 7),
      basicSalary: 0,
      allowances: 0,
      deductions: 0,
      netSalary: 0,
      paymentDate: '',
      paymentStatus: 'Pending',
      paymentMode: '',
      remarks: '',
    });
  };

  const getStaffName = (staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId);
    return staffMember?.fullName || 'Unknown';
  };

  const activeStaff = staff.filter(s => s.status === 'Active');
  const totalMonthlySalary = activeStaff.reduce((sum, s) => sum + s.monthlySalary, 0);
  const pendingPayments = payrollRecords.filter(p => p.paymentStatus === 'Pending');
  const totalPendingAmount = pendingPayments.reduce((sum, p) => sum + p.netSalary, 0);

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
                Staff & Payroll Management
              </h1>
              <p className="text-gray-300 text-sm font-medium">{companySettings.companyName}</p>
            </div>
          </div>
          <DateTimeDisplay />
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Active Staff Card */}
            <Card className="bg-[#1a1a1a] border border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Total Active Staff</CardTitle>
                <Users className="h-5 w-5 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-1">{activeStaff.length}</div>
                <p className="text-xs text-gray-400">Currently employed</p>
              </CardContent>
            </Card>

            {/* Monthly Salary Card */}
            <Card className="bg-[#1a1a1a] border border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Monthly Salary</CardTitle>
                <IndianRupee className="h-5 w-5 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-1">₹{totalMonthlySalary.toLocaleString()}</div>
                <p className="text-xs text-gray-400">Total payroll cost</p>
              </CardContent>
            </Card>

            {/* Pending Payments Card */}
            <Card className="bg-[#1a1a1a] border border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Pending Payments</CardTitle>
                <DollarSign className="h-5 w-5 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-1">₹{totalPendingAmount.toLocaleString()}</div>
                <p className="text-xs text-gray-400">{pendingPayments.length} payments due</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs Container */}
          <Tabs defaultValue={tabParam} className="space-y-6">
            <TabsList className="bg-[#1a1a1a] border border-gray-700 p-1 h-auto">
              <TabsTrigger value="staff">Staff Management</TabsTrigger>
              <TabsTrigger value="payroll">Payroll Records</TabsTrigger>
            </TabsList>

                {/* Staff Management Tab */}
                <TabsContent value="staff" className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Staff Members</h2>
                    <Button
                      onClick={() => {
                        resetStaffForm();
                        setEditingStaff(null);
                        setShowStaffDialog(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Staff
                    </Button>
                  </div>

                  <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-gray-700 hover:bg-gray-800/50">
                          <TableHead className="text-gray-300">Name</TableHead>
                          <TableHead className="text-gray-300">Designation</TableHead>
                          <TableHead className="text-gray-300">Contact</TableHead>
                          <TableHead className="text-gray-300">Date of Joining</TableHead>
                          <TableHead className="text-gray-300">Monthly Salary</TableHead>
                          <TableHead className="text-gray-300">Status</TableHead>
                          <TableHead className="text-right text-gray-300">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {staff.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-12">
                              <div className="flex flex-col items-center justify-center space-y-3">
                                <Users className="h-12 w-12 text-blue-300/30" />
                                <p className="text-gray-400">No staff members found. Add your first staff member to get started.</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          staff.map((member) => (
                            <TableRow key={member.id} className="border-b border-gray-700 hover:bg-gray-800/50">
                              <TableCell className="font-medium text-white">{member.fullName}</TableCell>
                              <TableCell className="text-gray-300">{member.designation}</TableCell>
                              <TableCell className="text-gray-300">{member.contactNumber}</TableCell>
                              <TableCell className="text-gray-300">{new Date(member.dateOfJoining).toLocaleDateString()}</TableCell>
                              <TableCell className="text-gray-300 font-medium">₹{member.monthlySalary.toLocaleString()}</TableCell>
                              <TableCell>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    member.status === 'Active'
                                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                      : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                                  }`}
                                >
                                  {member.status}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditStaff(member.id)}
                                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteStaff(member.id)}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* Payroll Records Tab */}
                <TabsContent value="payroll" className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Payroll Records</h2>
                    <Button
                      onClick={() => {
                        resetPayrollForm();
                        setEditingPayroll(null);
                        setShowPayrollDialog(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Payroll Record
                    </Button>
                  </div>

                  <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-gray-700 hover:bg-gray-800/50">
                          <TableHead className="text-gray-300">Staff Name</TableHead>
                          <TableHead className="text-gray-300">Month</TableHead>
                          <TableHead className="text-gray-300">Basic Salary</TableHead>
                          <TableHead className="text-gray-300">Allowances</TableHead>
                          <TableHead className="text-gray-300">Deductions</TableHead>
                          <TableHead className="text-gray-300">Net Salary</TableHead>
                          <TableHead className="text-gray-300">Payment Status</TableHead>
                          <TableHead className="text-right text-gray-300">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payrollRecords.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-12">
                              <div className="flex flex-col items-center justify-center space-y-3">
                                <IndianRupee className="h-12 w-12 text-blue-300/30" />
                                <p className="text-gray-400">No payroll records found. Add your first payroll record to get started.</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          payrollRecords
                            .sort((a, b) => b.month.localeCompare(a.month))
                            .map((record) => (
                              <TableRow key={record.id} className="border-b border-gray-700 hover:bg-gray-800/50">
                                <TableCell className="font-medium text-white">{getStaffName(record.staffId)}</TableCell>
                                <TableCell className="text-gray-300">{new Date(record.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</TableCell>
                                <TableCell className="text-gray-300">₹{record.basicSalary.toLocaleString()}</TableCell>
                                <TableCell className="text-green-300">₹{record.allowances.toLocaleString()}</TableCell>
                                <TableCell className="text-red-300">₹{record.deductions.toLocaleString()}</TableCell>
                                <TableCell className="font-medium text-white">₹{record.netSalary.toLocaleString()}</TableCell>
                                <TableCell>
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                                      record.paymentStatus === 'Paid'
                                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                        : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                    }`}
                                  >
                                    {record.paymentStatus}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditPayroll(record.id)}
                                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeletePayroll(record.id)}
                                      className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Glassmorphic Add/Edit Staff Dialog */}
      <Dialog open={showStaffDialog} onOpenChange={setShowStaffDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-[#1a1a1a]/95 border border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
            <DialogDescription className="text-blue-200/70">
              {editingStaff ? 'Update staff member information' : 'Enter staff member details'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName" className="text-white/90">Full Name *</Label>
                <Input
                  id="fullName"
                  value={newStaff.fullName}
                  onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })}
                  placeholder="Enter full name"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400"
                />
              </div>
              <div>
                <Label htmlFor="designation" className="text-white/90">Designation *</Label>
                <Input
                  id="designation"
                  value={newStaff.designation}
                  onChange={(e) => setNewStaff({ ...newStaff, designation: e.target.value })}
                  placeholder="Enter designation"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactNumber" className="text-white/90">Contact Number *</Label>
                <Input
                  id="contactNumber"
                  value={newStaff.contactNumber}
                  onChange={(e) => setNewStaff({ ...newStaff, contactNumber: e.target.value })}
                  placeholder="Enter contact number"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-white/90">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  placeholder="Enter email"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address" className="text-white/90">Address</Label>
              <Textarea
                id="address"
                value={newStaff.address}
                onChange={(e) => setNewStaff({ ...newStaff, address: e.target.value })}
                placeholder="Enter address"
                rows={2}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateOfJoining" className="text-white/90">Date of Joining</Label>
                <Input
                  id="dateOfJoining"
                  type="date"
                  value={newStaff.dateOfJoining}
                  onChange={(e) => setNewStaff({ ...newStaff, dateOfJoining: e.target.value })}
                  className="bg-white/10 border-white/20 text-white focus:border-blue-400"
                />
              </div>
              <div>
                <Label htmlFor="monthlySalary" className="text-white/90">Monthly Salary (₹)</Label>
                <Input
                  id="monthlySalary"
                  type="number"
                  value={newStaff.monthlySalary}
                  onChange={(e) => setNewStaff({ ...newStaff, monthlySalary: parseFloat(e.target.value) || 0 })}
                  placeholder="Enter monthly salary"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="accountNumber" className="text-white/90">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={newStaff.accountNumber}
                  onChange={(e) => setNewStaff({ ...newStaff, accountNumber: e.target.value })}
                  placeholder="Enter account number"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400"
                />
              </div>
              <div>
                <Label htmlFor="ifscCode" className="text-white/90">IFSC Code</Label>
                <Input
                  id="ifscCode"
                  value={newStaff.ifscCode}
                  onChange={(e) => setNewStaff({ ...newStaff, ifscCode: e.target.value })}
                  placeholder="Enter IFSC code"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="panNumber" className="text-white/90">PAN Number</Label>
                <Input
                  id="panNumber"
                  value={newStaff.panNumber}
                  onChange={(e) => setNewStaff({ ...newStaff, panNumber: e.target.value })}
                  placeholder="Enter PAN number"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400"
                />
              </div>
              <div>
                <Label htmlFor="aadharNumber" className="text-white/90">Aadhar Number</Label>
                <Input
                  id="aadharNumber"
                  value={newStaff.aadharNumber}
                  onChange={(e) => setNewStaff({ ...newStaff, aadharNumber: e.target.value })}
                  placeholder="Enter Aadhar number"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status" className="text-white/90">Status</Label>
              <Select
                value={newStaff.status}
                onValueChange={(value: 'Active' | 'Inactive') => setNewStaff({ ...newStaff, status: value })}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowStaffDialog(false)} className="border-white/20 text-white hover:bg-white/10">
                Cancel
              </Button>
              <Button onClick={handleAddStaff} className="bg-blue-600 hover:bg-blue-700">
                {editingStaff ? 'Update Staff' : 'Add Staff'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Glassmorphic Add/Edit Payroll Dialog */}
      <Dialog open={showPayrollDialog} onOpenChange={setShowPayrollDialog}>
        <DialogContent className="max-w-2xl backdrop-blur-xl bg-[#1a1a1a]/95 border border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">{editingPayroll ? 'Edit Payroll Record' : 'Add Payroll Record'}</DialogTitle>
            <DialogDescription className="text-blue-200/70">
              {editingPayroll ? 'Update payroll record information' : 'Enter payroll details'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="staffId" className="text-white/90">Staff Member *</Label>
              <Select
                value={newPayroll.staffId}
                onValueChange={(value) => {
                  const selectedStaff = staff.find(s => s.id === value);
                  setNewPayroll({
                    ...newPayroll,
                    staffId: value,
                    basicSalary: selectedStaff?.monthlySalary || 0,
                  });
                }}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {activeStaff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.fullName} - {member.designation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="month" className="text-white/90">Month *</Label>
              <Input
                id="month"
                type="month"
                value={newPayroll.month}
                onChange={(e) => setNewPayroll({ ...newPayroll, month: e.target.value })}
                className="bg-white/10 border-white/20 text-white focus:border-blue-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="basicSalary" className="text-white/90">Basic Salary (₹)</Label>
                <Input
                  id="basicSalary"
                  type="number"
                  value={newPayroll.basicSalary}
                  onChange={(e) => setNewPayroll({ ...newPayroll, basicSalary: parseFloat(e.target.value) || 0 })}
                  placeholder="Enter basic salary"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400"
                />
              </div>
              <div>
                <Label htmlFor="allowances" className="text-white/90">Allowances (₹)</Label>
                <Input
                  id="allowances"
                  type="number"
                  value={newPayroll.allowances}
                  onChange={(e) => setNewPayroll({ ...newPayroll, allowances: parseFloat(e.target.value) || 0 })}
                  placeholder="Enter allowances"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deductions" className="text-white/90">Deductions (₹)</Label>
                <Input
                  id="deductions"
                  type="number"
                  value={newPayroll.deductions}
                  onChange={(e) => setNewPayroll({ ...newPayroll, deductions: parseFloat(e.target.value) || 0 })}
                  placeholder="Enter deductions"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400"
                />
              </div>
              <div>
                <Label htmlFor="netSalary" className="text-white/90">Net Salary (₹)</Label>
                <Input
                  id="netSalary"
                  type="number"
                  value={newPayroll.basicSalary + newPayroll.allowances - newPayroll.deductions}
                  disabled
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentStatus" className="text-white/90">Payment Status</Label>
                <Select
                  value={newPayroll.paymentStatus}
                  onValueChange={(value: 'Pending' | 'Paid') => setNewPayroll({ ...newPayroll, paymentStatus: value })}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="paymentDate" className="text-white/90">Payment Date</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={newPayroll.paymentDate}
                  onChange={(e) => setNewPayroll({ ...newPayroll, paymentDate: e.target.value })}
                  className="bg-white/10 border-white/20 text-white focus:border-blue-400"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="paymentMode" className="text-white/90">Payment Mode</Label>
              <Select
                value={newPayroll.paymentMode}
                onValueChange={(value: 'Cash' | 'Bank Transfer' | 'Cheque') => setNewPayroll({ ...newPayroll, paymentMode: value })}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="remarks" className="text-white/90">Remarks</Label>
              <Textarea
                id="remarks"
                value={newPayroll.remarks}
                onChange={(e) => setNewPayroll({ ...newPayroll, remarks: e.target.value })}
                placeholder="Enter any remarks"
                rows={2}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowPayrollDialog(false)} className="border-white/20 text-white hover:bg-white/10">
                Cancel
              </Button>
              <Button onClick={handleAddPayroll} className="bg-blue-600 hover:bg-blue-700">
                {editingPayroll ? 'Update Record' : 'Add Record'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}