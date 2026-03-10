import { useState, useEffect, ChangeEvent } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { ArrowLeft, Download, Printer, Share2, CheckCircle2, Plus, Edit, Trash2, DollarSign, MoreVertical, Users } from 'lucide-react';
import { toast } from 'sonner';
import { generateJobSheetPDF } from '../utils/pdfGenerator';
import degenixLogo from 'figma:asset/e686929947131e66770ed743ba284a27b15aa8de.png';

export default function JobSheetView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const {
    getJobSheetById,
    getClientById,
    getProductById,
    getQuotationById,
    updateJobSheet,
    addBill,
    getBillByJobSheetId,
    companySettings,
    vendors,
    vendorAssignments,
    addVendorAssignment,
    updateVendorAssignment,
    deleteVendorAssignment,
    getVendorAssignmentsByJobSheet,
    addVendorTransaction,
    vendorTransactions,
  } = useData();

  const [jobSheet, setJobSheet] = useState(getJobSheetById(id!));
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);

  const [assignmentForm, setAssignmentForm] = useState({
    vendorId: '',
    workType: '',
    quantity: 0,
    totalAmount: 0,
    advancePaid: 0,
    notes: '',
  });

  useEffect(() => {
    setJobSheet(getJobSheetById(id!));
  }, [id]);

  if (!jobSheet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Job Sheet not found</h2>
          <Button onClick={() => navigate('/orders')}>Back to Orders</Button>
        </div>
      </div>
    );
  }

  const client = getClientById(jobSheet.clientId);
  const product = getProductById(jobSheet.productId);
  const quotation = getQuotationById(jobSheet.quotationId);
  const existingBill = getBillByJobSheetId(jobSheet.id);
  const vendorAssignmentsForJobSheet = getVendorAssignmentsByJobSheet(jobSheet.id);

  const handleProcessToggle = (process: keyof typeof jobSheet.processStatus) => {
    const newProcessStatus = { ...jobSheet.processStatus, [process]: !jobSheet.processStatus[process] };
    updateJobSheet(jobSheet.id, { processStatus: newProcessStatus });
    setJobSheet({ ...jobSheet, processStatus: newProcessStatus });
    toast.success(`${process} ${newProcessStatus[process] ? 'completed' : 'unchecked'}`);
  };

  const handleMarkCompleted = () => {
    updateJobSheet(jobSheet.id, { status: 'Completed', completedAt: new Date().toISOString() });
    setJobSheet({ ...jobSheet, status: 'Completed' });

    if (!existingBill && quotation) {
      // Create Bill from quotation items
      const billItems = quotation.items.map(item => ({
        description: item.productName,
        quantity: item.quantity,
        rate: item.pricePerUnit,
        amount: item.amount,
      }));

      // Calculate discount
      const discountAmount = quotation.discountValue && quotation.discountValue > 0
        ? (quotation.discountType === 'percentage'
            ? quotation.subtotal * (quotation.discountValue / 100)
            : quotation.discountValue)
        : 0;

      addBill({
        jobSheetId: jobSheet.id,
        quotationId: quotation.id,
        clientId: jobSheet.clientId,
        items: billItems,
        subtotal: quotation.subtotal,
        includeGst: quotation.includeGst,
        gstPercentage: quotation.gstPercentage,
        gstAmount: quotation.gstAmount,
        discountType: quotation.discountType,
        discountValue: quotation.discountValue,
        totalAmount: quotation.totalAmount,
        advanceReceived: quotation.advancePayment || 0,
        balanceAmount: quotation.totalAmount - (quotation.advancePayment || 0),
        paymentStatus: (quotation.totalAmount - (quotation.advancePayment || 0)) === 0 ? 'Paid' : 'Pending',
      });

      toast.success('Job completed and bill generated');
    } else {
      toast.success('Job marked as completed');
    }
  };

  const downloadPDF = () => {
    const pdf = generateJobSheetPDF(jobSheet, client, product, companySettings);
    pdf.save(`JobSheet_${jobSheet.jobSheetNumber}.pdf`);
    toast.success('PDF downloaded');
  };

  const handleAssignmentFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: any } }) => {
    const { name, value } = e.target;
    
    // Convert numeric fields to numbers
    const numericFields = ['quantity', 'totalAmount', 'advancePaid'];
    const processedValue = numericFields.includes(name) ? (parseFloat(value) || 0) : value;
    
    setAssignmentForm({
      ...assignmentForm,
      [name]: processedValue,
    });
  };

  const handleAddAssignment = () => {
    if (!assignmentForm.vendorId || !assignmentForm.workType) {
      toast.error('Please fill in required fields');
      return;
    }

    const balanceAmount = assignmentForm.totalAmount - assignmentForm.advancePaid;
    const paymentStatus = assignmentForm.advancePaid === 0 
      ? 'Pending' 
      : balanceAmount === 0 
        ? 'Paid' 
        : 'Partial';

    if (editingAssignment) {
      updateVendorAssignment(editingAssignment, {
        ...assignmentForm,
        balanceAmount,
        paymentStatus,
      });
      toast.success('Vendor assignment updated');
    } else {
      // Create vendor assignment and get the ID
      const newAssignmentId = addVendorAssignment({
        jobSheetId: jobSheet.id,
        vendorId: assignmentForm.vendorId,
        assignmentDate: new Date().toISOString(),
        workType: assignmentForm.workType,
        quantity: assignmentForm.quantity,
        totalAmount: assignmentForm.totalAmount,
        advancePaid: assignmentForm.advancePaid,
        balanceAmount,
        paymentStatus,
        status: 'Assigned',
        notes: assignmentForm.notes,
      });

      // Create initial assignment transaction (Credit - vendor gives us work/goods = we owe them)
      addVendorTransaction({
        date: new Date().toISOString(),
        vendorId: assignmentForm.vendorId,
        type: 'Due',
        description: `Assignment: ${assignmentForm.workType} - Job Sheet ${jobSheet.jobSheetNumber}`,
        debit: 0,
        credit: assignmentForm.totalAmount,
        referenceType: 'VendorAssignment',
        referenceId: newAssignmentId,
      });

      // If advance is paid, create advance transaction (Debit - we pay them = reduces what we owe)
      if (assignmentForm.advancePaid > 0) {
        addVendorTransaction({
          date: new Date().toISOString(),
          vendorId: assignmentForm.vendorId,
          type: 'Advance',
          description: `Advance for ${assignmentForm.workType} - Job Sheet ${jobSheet.jobSheetNumber}`,
          debit: assignmentForm.advancePaid,
          credit: 0,
          referenceType: 'VendorAssignment',
          referenceId: newAssignmentId,
        });
      }

      toast.success('Vendor assignment added');
    }
    setShowAssignmentDialog(false);
    setEditingAssignment(null);
    setAssignmentForm({
      vendorId: '',
      workType: '',
      quantity: 0,
      totalAmount: 0,
      advancePaid: 0,
      notes: '',
    });
  };

  const handleEditAssignment = (assignmentId: string) => {
    const assignment = vendorAssignments.find(a => a.id === assignmentId);
    if (assignment) {
      setAssignmentForm({
        vendorId: assignment.vendorId,
        workType: assignment.workType,
        quantity: assignment.quantity,
        totalAmount: assignment.totalAmount,
        advancePaid: assignment.advancePaid,
        notes: assignment.notes,
      });
      setEditingAssignment(assignmentId);
      setShowAssignmentDialog(true);
    }
  };

  const handleDeleteAssignment = (assignmentId: string) => {
    deleteVendorAssignment(assignmentId);
    toast.success('Vendor assignment deleted');
  };

  const handleAddPayment = () => {
    if (!selectedAssignment || paymentAmount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    const assignment = vendorAssignments.find(a => a.id === selectedAssignment);
    if (!assignment) {
      toast.error('Assignment not found');
      return;
    }

    // Calculate new balance
    const newAdvancePaid = assignment.advancePaid + paymentAmount;
    const newBalanceAmount = assignment.totalAmount - newAdvancePaid;
    const newPaymentStatus = newBalanceAmount === 0 ? 'Paid' : newAdvancePaid > 0 ? 'Partial' : 'Pending';

    // Update vendor assignment
    updateVendorAssignment(selectedAssignment, {
      advancePaid: newAdvancePaid,
      balanceAmount: newBalanceAmount,
      paymentStatus: newPaymentStatus,
    });

    // Add vendor transaction (Debit - payment made to vendor = reduces what we owe)
    addVendorTransaction({
      date: new Date().toISOString(),
      vendorId: assignment.vendorId,
      type: 'Payment',
      description: `Payment for ${assignment.workType} - Job Sheet ${jobSheet.jobSheetNumber}`,
      debit: paymentAmount,
      credit: 0,
      referenceType: 'VendorAssignment',
      referenceId: selectedAssignment,
    });

    toast.success('Payment added successfully');
    setShowPaymentDialog(false);
    setSelectedAssignment(null);
    setPaymentAmount(0);
  };

  const handleVendorStatusChange = (assignmentId: string, status: 'Assigned' | 'In Progress' | 'Completed') => {
    updateVendorAssignment(assignmentId, { status });
    toast.success(`Vendor assignment status updated to ${status}`);
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
            <h1 className="text-white text-2xl font-bold">Job Sheet Details</h1>
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
                <DropdownMenuItem onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </DropdownMenuItem>
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
                <h2 className="text-xl font-bold mb-2 text-white">{jobSheet.jobSheetNumber}</h2>
                <Badge variant={jobSheet.status === 'Completed' ? 'default' : 'secondary'}>
                  {jobSheet.status}
                </Badge>
              </div>
              {jobSheet.status === 'In Progress' && (
                <Button
                  onClick={handleMarkCompleted}
                  style={{ backgroundColor: '#10b981' }}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark as Completed
                </Button>
              )}
            </div>

            {/* Client Information */}
            <div className="grid grid-cols-2 gap-6 mt-6">
              <div>
                <h3 className="font-semibold mb-2 text-white">Client Information</h3>
                <div className="space-y-1 text-sm text-gray-200">
                  <p><strong className="text-gray-300">Company:</strong> {client?.companyName}</p>
                  <p><strong className="text-gray-300">Name:</strong> {client?.clientName}</p>
                  <p><strong className="text-gray-300">Contact:</strong> {client?.contactNumber}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-white">Job Information</h3>
                <div className="space-y-1 text-sm text-gray-200">
                  <p><strong className="text-gray-300">Product:</strong> {product?.productName}</p>
                  <p><strong className="text-gray-300">Quantity:</strong> {jobSheet.quantity}</p>
                  <p><strong className="text-gray-300">Quotation:</strong> {quotation?.quotationNumber}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Product Specifications */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4 text-white">Product Specifications</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-200">
              <div>
                <p><strong className="text-gray-300">Cover Page:</strong> {jobSheet.specifications.coverPageQuantity} pages @ {jobSheet.specifications.coverPageGsm} GSM</p>
                <p><strong className="text-gray-300">Inner Page:</strong> {jobSheet.specifications.innerPageQuantity} pages @ {jobSheet.specifications.innerPageGsm} GSM</p>
                <p><strong className="text-gray-300">Size:</strong> {product?.size}</p>
              </div>
              <div>
                <p><strong className="text-gray-300">Lamination:</strong> {jobSheet.specifications.laminationType}</p>
                <p><strong className="text-gray-300">U/V Coating:</strong> {jobSheet.specifications.uv ? 'Yes' : 'No'}</p>
                <p><strong className="text-gray-300">Gold Foiling:</strong> {jobSheet.specifications.goldFoiling ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>

          {/* Process Checklist */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4 text-white">Process Checklist</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="printing"
                  checked={jobSheet.processStatus.printing}
                  onCheckedChange={() => handleProcessToggle('printing')}
                  disabled={jobSheet.status === 'Completed'}
                />
                <label htmlFor="printing" className="text-sm font-medium cursor-pointer text-gray-200">
                  In Printing
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="lamination"
                  checked={jobSheet.processStatus.lamination}
                  onCheckedChange={() => handleProcessToggle('lamination')}
                  disabled={jobSheet.status === 'Completed'}
                />
                <label htmlFor="lamination" className="text-sm font-medium cursor-pointer text-gray-200">
                  In Lamination
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="creasingAndPinning"
                  checked={jobSheet.processStatus.creasingAndPinning}
                  onCheckedChange={() => handleProcessToggle('creasingAndPinning')}
                  disabled={jobSheet.status === 'Completed'}
                />
                <label htmlFor="creasingAndPinning" className="text-sm font-medium cursor-pointer text-gray-200">
                  In Creasing and Pinning
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="readyToDeliver"
                  checked={jobSheet.processStatus.readyToDeliver}
                  onCheckedChange={() => handleProcessToggle('readyToDeliver')}
                  disabled={jobSheet.status === 'Completed'}
                />
                <label htmlFor="readyToDeliver" className="text-sm font-medium cursor-pointer text-gray-200">
                  Ready to Deliver
                </label>
              </div>
            </div>
          </div>

          {/* Vendor Assignments */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4 text-white">Vendor Assignments</h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAssignmentDialog(true)}
                className="text-sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Assignment
              </Button>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-200">Vendor</TableHead>
                    <TableHead className="text-gray-200">Work Type</TableHead>
                    <TableHead className="text-gray-200">Quantity</TableHead>
                    <TableHead className="text-gray-200">Total Amount</TableHead>
                    <TableHead className="text-gray-200">Paid</TableHead>
                    <TableHead className="text-gray-200">Balance</TableHead>
                    <TableHead className="text-gray-200">Work Status</TableHead>
                    <TableHead className="text-gray-200">Payment Status</TableHead>
                    <TableHead className="text-gray-200">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendorAssignmentsForJobSheet.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-400">
                        No vendor assignments yet. Click "Add Assignment" to assign work to vendors.
                      </TableCell>
                    </TableRow>
                  ) : (
                    vendorAssignmentsForJobSheet.map(assignment => (
                      <TableRow key={assignment.id} className="border-b border-white/10 hover:bg-white/5">
                        <TableCell className="text-gray-200">{vendors.find(v => v.id === assignment.vendorId)?.companyName}</TableCell>
                        <TableCell className="text-gray-200">{assignment.workType}</TableCell>
                        <TableCell className="text-gray-200">{assignment.quantity}</TableCell>
                        <TableCell className="text-gray-200">₹{assignment.totalAmount.toFixed(2)}</TableCell>
                        <TableCell className="text-gray-200">₹{assignment.advancePaid.toFixed(2)}</TableCell>
                        <TableCell className={assignment.balanceAmount > 0 ? "text-red-400 font-semibold" : "text-green-400"}>
                          ₹{assignment.balanceAmount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={assignment.status}
                            onValueChange={(value) => handleVendorStatusChange(assignment.id, value as 'Assigned' | 'In Progress' | 'Completed')}
                          >
                            <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Assigned">Assigned</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            assignment.paymentStatus === 'Paid' ? 'default' : 
                            assignment.paymentStatus === 'Partial' ? 'secondary' : 
                            'destructive'
                          }>
                            {assignment.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditAssignment(assignment.id)}
                              className="text-gray-200 hover:text-gray-300"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteAssignment(assignment.id)}
                              className="text-gray-200 hover:text-gray-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedAssignment(assignment.id);
                                setShowPaymentDialog(true);
                              }}
                              className="text-gray-200 hover:text-gray-300"
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {existingBill && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">
                Bill generated: <strong>{existingBill.billNumber}</strong>
              </p>
              <Button
                variant="link"
                onClick={() => navigate(`/orders/billing/${existingBill.id}`)}
                className="text-green-600 p-0 h-auto"
              >
                View Bill →
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Add Assignment Dialog */}
      <Dialog open={showAssignmentDialog} onOpenChange={setShowAssignmentDialog}>
        <DialogContent className="sm:max-w-[425px] bg-[#1a1a1a] border border-gray-800 shadow-2xl shadow-black/50">
          <DialogHeader>
            <DialogTitle>Add Vendor Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vendorId">Vendor</Label>
              <Select
                value={assignmentForm.vendorId}
                onValueChange={(value) => handleAssignmentFormChange({ target: { name: 'vendorId', value } })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map(vendor => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="workType">Work Type</Label>
              <Input
                id="workType"
                name="workType"
                value={assignmentForm.workType}
                onChange={handleAssignmentFormChange}
                placeholder="Enter work type"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                value={assignmentForm.quantity}
                onChange={handleAssignmentFormChange}
                placeholder="Enter quantity"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalAmount">Total Amount</Label>
              <Input
                id="totalAmount"
                name="totalAmount"
                type="number"
                value={assignmentForm.totalAmount}
                onChange={handleAssignmentFormChange}
                placeholder="Enter total amount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="advancePaid">Advance Paid</Label>
              <Input
                id="advancePaid"
                name="advancePaid"
                type="number"
                value={assignmentForm.advancePaid}
                onChange={handleAssignmentFormChange}
                placeholder="Enter advance paid"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={assignmentForm.notes}
                onChange={handleAssignmentFormChange}
                placeholder="Enter notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAssignmentDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddAssignment}
            >
              {editingAssignment ? 'Update' : 'Add'} Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[425px] bg-[#1a1a1a] border border-gray-800 shadow-2xl shadow-black/50">
          <DialogHeader>
            <DialogTitle>Add Payment</DialogTitle>
            <DialogDescription>
              Add a payment for the selected vendor assignment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paymentAmount">Payment Amount</Label>
              <Input
                id="paymentAmount"
                name="paymentAmount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                placeholder="Enter payment amount"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPaymentDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddPayment}
            >
              Add Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}