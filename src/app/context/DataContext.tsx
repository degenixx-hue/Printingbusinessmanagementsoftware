import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
export interface Client {
  id: string;
  companyName: string;
  clientName: string;
  contactNumber: string;
  email: string;
  address: string;
  gst: string;
  createdAt: string;
}

export interface Product {
  id: string;
  productName: string;
  productCategory: string;
  size: string;
  coverPageQuantity: number;
  coverPageGsm: number;
  innerPageQuantity: number;
  innerPageGsm: number;
  laminationType: 'None' | 'Gloss' | 'Matte' | 'Velvet' | 'Spot' | 'Velvet Spot';
  uv: boolean;
  goldFoiling: boolean;
  digitalCreative: boolean;
  designCount?: number; // Number of designs for digital creative packages
  purchasePrice?: number; // Cost/purchase price of the product
  pricePerUnit: number;
  createdAt: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  clientId: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    coverPageQuantity: number;
    coverPageGsm: number;
    innerPageQuantity: number;
    innerPageGsm: number;
    laminationType: 'None' | 'Gloss' | 'Matte' | 'Velvet' | 'Spot' | 'Velvet Spot';
    uv: boolean;
    goldFoiling: boolean;
    digitalCreative: boolean;
    designCount?: number; // Number of designs for digital creative packages
    creativePackageType?: 'Festive' | 'Ads';
    creativeDateFrom?: string;
    creativeDateTo?: string;
    pricePerUnit: number;
    amount: number;
  }>;
  subtotal: number; // Pre-discount amount (sum of all items)
  includeGst: boolean;
  gstPercentage: number;
  gstAmount: number; // GST calculated on discounted amount
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  totalAmount: number; // Final amount after discount + GST (used for all accounting)
  status: 'Pending' | 'Approved' | 'Rejected';
  advancePayment: number;
  advancePaymentMode?: 'Cash' | 'Online' | 'Cheque' | 'UPI' | 'Other';
  createdAt: string;
  approvedAt?: string;
  isCreativePackage?: boolean;
}

export interface JobSheet {
  id: string;
  jobSheetNumber: string;
  quotationId: string;
  clientId: string;
  productId: string;
  quantity: number;
  specifications: {
    coverPageQuantity: number;
    coverPageGsm: number;
    innerPageQuantity: number;
    innerPageGsm: number;
    laminationType: string;
    uv: boolean;
    goldFoiling: boolean;
  };
  status: 'In Progress' | 'Completed';
  processStatus: {
    printing: boolean;
    lamination: boolean;
    creasingAndPinning: boolean;
    readyToDeliver: boolean;
  };
  createdAt: string;
  completedAt?: string;
}

export interface Bill {
  id: string;
  billNumber: string;
  jobSheetId?: string; // Optional - not required for creative packages
  quotationId: string;
  clientId: string;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  subtotal: number; // Pre-discount amount (sum of all items)
  includeGst: boolean;
  gstPercentage: number;
  gstAmount: number; // GST calculated on discounted amount
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  totalAmount: number; // Final amount after discount + GST (used for all accounting)
  advanceReceived: number;
  balanceAmount: number; // Outstanding calculated from discounted totalAmount
  paymentStatus: 'Pending' | 'Partial' | 'Paid';
  createdAt: string;
  paidAt?: string;
  dueDate?: string;
  paymentNotes?: string;
}

export interface Vendor {
  id: string;
  companyName: string;
  contactPerson: string;
  contactNumber: string;
  email: string;
  address: string;
  gst?: string;
  specialization: string; // e.g., "Printing", "Lamination", "Binding"
  createdAt: string;
}

export interface VendorAssignment {
  id: string;
  vendorId: string;
  jobSheetId: string;
  assignmentDate: string;
  workType: string; // e.g., "Printing", "Lamination", etc.
  quantity: number;
  totalAmount: number;
  advancePaid: number;
  balanceAmount: number;
  paymentStatus: 'Pending' | 'Partial' | 'Paid';
  status: 'Assigned' | 'In Progress' | 'Completed';
  completedAt?: string;
  notes?: string;
}

export interface CreativePackageTracking {
  id: string;
  quotationId: string;
  clientId: string;
  festivalName: string;
  festivalDate: string;
  packageType: 'Festive' | 'Ads';
  totalDesigns: number; // Default 52 for festive
  designsDelivered: number;
  designs: Array<{
    id: string;
    designNumber: number;
    title: string;
    festivalDate?: string; // Date of the festival (from Festival Management)
    deliveryDate?: string; // Date when design was actually delivered
    isDelivered: boolean;
    notes?: string;
    deliveryImage?: string; // Base64 image or URL
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface VendorTransaction {
  id: string;
  date: string;
  vendorId: string;
  type: 'Advance' | 'Payment' | 'Due';
  description: string;
  debit: number;
  credit: number;
  balance: number;
  referenceType?: 'VendorAssignment';
  referenceId?: string;
}

export interface AccountTransaction {
  id: string;
  date: string;
  clientId: string;
  type: 'Advance' | 'Payment' | 'Due' | 'Credit Note' | 'Debit Note';
  description: string;
  debit: number;
  credit: number;
  balance: number;
  paymentMode?: 'Cash' | 'Online' | 'Cheque' | 'UPI' | 'Other';
  referenceType?: 'Quotation' | 'Bill';
  referenceId?: string;
}

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'user';
  fullName: string;
  department?: string; // Department assignment
  permissions: {
    accounts: boolean;
    staffPayroll: boolean;
    userManagement: boolean;
    dataManagement: boolean;
    vendors: boolean;
    festivals: boolean;
  };
  createdAt: string;
}

export interface Staff {
  id: string;
  fullName: string;
  designation: string;
  contactNumber: string;
  email: string;
  address: string;
  dateOfJoining: string;
  monthlySalary: number;
  accountNumber?: string;
  ifscCode?: string;
  panNumber?: string;
  aadharNumber?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface PayrollRecord {
  id: string;
  staffId: string;
  month: string; // Format: YYYY-MM
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  paymentDate?: string;
  paymentStatus: 'Pending' | 'Paid';
  paymentMode?: 'Cash' | 'Bank Transfer' | 'Cheque';
  remarks?: string;
  createdAt: string;
}

export interface CompanySettings {
  companyName: string;
  address: string;
  contactNumber: string;
  email: string;
  gst: string;
  logo?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branch?: string;
  accountHolderName?: string;
}

export interface Festival {
  id: string;
  name: string;
  date: string; // Festival date
  createdAt: string;
}

interface DataContextType {
  // Authentication
  currentUser: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  
  // Company Settings
  companySettings: CompanySettings;
  updateCompanySettings: (settings: CompanySettings) => void;
  
  // Clients
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  getClientById: (id: string) => Client | undefined;
  
  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProductById: (id: string) => Product | undefined;
  
  // Quotations
  quotations: Quotation[];
  addQuotation: (quotation: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt'>) => string;
  updateQuotation: (id: string, quotation: Partial<Quotation>) => void;
  deleteQuotation: (id: string) => void;
  getQuotationById: (id: string) => Quotation | undefined;
  
  // Job Sheets
  jobSheets: JobSheet[];
  addJobSheet: (jobSheet: Omit<JobSheet, 'id' | 'jobSheetNumber' | 'createdAt'>) => void;
  updateJobSheet: (id: string, jobSheet: Partial<JobSheet>) => void;
  deleteJobSheet: (id: string) => void;
  getJobSheetById: (id: string) => JobSheet | undefined;
  getJobSheetByQuotationId: (quotationId: string) => JobSheet | undefined;
  
  // Bills
  bills: Bill[];
  addBill: (bill: Omit<Bill, 'id' | 'billNumber' | 'createdAt'>, advancePaymentMode?: 'Cash' | 'Online' | 'Cheque' | 'UPI' | 'Other') => void;
  updateBill: (id: string, bill: Partial<Bill>, fullPaymentMode?: 'Cash' | 'Online' | 'Cheque' | 'UPI' | 'Other') => void;
  deleteBill: (id: string) => void;
  getBillById: (id: string) => Bill | undefined;
  getBillByJobSheetId: (jobSheetId: string) => Bill | undefined;
  getBillByQuotationId: (quotationId: string) => Bill | undefined;
  
  // Accounts
  transactions: AccountTransaction[];
  addTransaction: (transaction: Omit<AccountTransaction, 'id' | 'balance'>) => void;
  deleteTransaction: (id: string) => void;
  getClientTransactions: (clientId: string) => AccountTransaction[];
  getClientBalance: (clientId: string) => number;
  
  // Users
  users: User[];
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  
  // Staff
  staff: Staff[];
  addStaff: (staff: Omit<Staff, 'id' | 'createdAt'>) => void;
  updateStaff: (id: string, staff: Partial<Staff>) => void;
  deleteStaff: (id: string) => void;
  getStaffById: (id: string) => Staff | undefined;
  
  // Payroll
  payrollRecords: PayrollRecord[];
  addPayrollRecord: (record: Omit<PayrollRecord, 'id' | 'createdAt'>) => void;
  updatePayrollRecord: (id: string, record: Partial<PayrollRecord>) => void;
  deletePayrollRecord: (id: string) => void;
  getPayrollRecordById: (id: string) => PayrollRecord | undefined;
  
  // Vendors
  vendors: Vendor[];
  addVendor: (vendor: Omit<Vendor, 'id' | 'createdAt'>) => void;
  updateVendor: (id: string, vendor: Partial<Vendor>) => void;
  deleteVendor: (id: string) => void;
  getVendorById: (id: string) => Vendor | undefined;
  
  // Vendor Assignments
  vendorAssignments: VendorAssignment[];
  addVendorAssignment: (assignment: Omit<VendorAssignment, 'id'>) => string;
  updateVendorAssignment: (id: string, assignment: Partial<VendorAssignment>) => void;
  deleteVendorAssignment: (id: string) => void;
  getVendorAssignmentById: (id: string) => VendorAssignment | undefined;
  getVendorAssignmentsByJobSheet: (jobSheetId: string) => VendorAssignment[];
  getVendorAssignmentsByVendor: (vendorId: string) => VendorAssignment[];
  
  // Vendor Transactions
  vendorTransactions: VendorTransaction[];
  addVendorTransaction: (transaction: Omit<VendorTransaction, 'id' | 'balance'>) => string;
  deleteVendorTransaction: (id: string) => void;
  getVendorTransactions: (vendorId: string) => VendorTransaction[];
  getVendorBalance: (vendorId: string) => number;
  
  // Creative Packages
  creativePackages: CreativePackageTracking[];
  addCreativePackage: (packageTracking: Omit<CreativePackageTracking, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCreativePackage: (id: string, packageTracking: Partial<CreativePackageTracking>) => void;
  deleteCreativePackage: (id: string) => void;
  getCreativePackageById: (id: string) => CreativePackageTracking | undefined;
  
  // Festivals
  festivals: Festival[];
  addFestival: (festival: Omit<Festival, 'id' | 'createdAt'>) => void;
  addMultipleFestivals: (festivalsToAdd: Omit<Festival, 'id' | 'createdAt'>[]) => void;
  updateFestival: (id: string, festival: Partial<Festival>) => void;
  deleteFestival: (id: string) => void;
  getFestivalById: (id: string) => Festival | undefined;
  
  // Data Management
  exportData: () => string;
  importData: (jsonData: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};

const STORAGE_KEY = 'printing_business_data';

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => ({
    companyName: 'Degenix Graphics',
    address: '',
    contactNumber: '',
    email: '',
    gst: '',
    logo: undefined,
    bankName: undefined,
    accountNumber: undefined,
    ifscCode: undefined,
    branch: undefined,
    accountHolderName: undefined,
  }));
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [jobSheets, setJobSheets] = useState<JobSheet[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [transactions, setTransactions] = useState<AccountTransaction[]>([]);
  const [users, setUsers] = useState<User[]>(() => [
    {
      id: '1',
      username: 'Degenix',
      password: 'Dege1201',
      role: 'admin',
      fullName: 'Administrator',
      department: 'Management',
      permissions: {
        accounts: true,
        staffPayroll: true,
        userManagement: true,
        dataManagement: true,
        vendors: true,
        festivals: true,
      },
      createdAt: new Date().toISOString(),
    },
  ]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorAssignments, setVendorAssignments] = useState<VendorAssignment[]>([]);
  const [vendorTransactions, setVendorTransactions] = useState<VendorTransaction[]>([]);
  const [creativePackages, setCreativePackages] = useState<CreativePackageTracking[]>([]);
  const [festivals, setFestivals] = useState<Festival[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        if (data.companySettings) setCompanySettings(data.companySettings);
        if (data.clients) setClients(data.clients);
        if (data.products) setProducts(data.products);
        if (data.quotations) setQuotations(data.quotations);
        if (data.jobSheets) setJobSheets(data.jobSheets);
        if (data.bills) setBills(data.bills);
        if (data.transactions) setTransactions(data.transactions);
        
        // Ensure default admin user always exists
        if (data.users && Array.isArray(data.users)) {
          const hasDefaultUser = data.users.some(u => u.username === 'Degenix');
          if (!hasDefaultUser) {
            // Add default user if it doesn't exist
            const defaultUser: User = {
              id: '1',
              username: 'Degenix',
              password: 'Dege1201',
              role: 'admin',
              fullName: 'Administrator',
              department: 'Management',
              permissions: {
                accounts: true,
                staffPayroll: true,
                userManagement: true,
                dataManagement: true,
                vendors: true,
                festivals: true,
              },
              createdAt: new Date().toISOString(),
            };
            setUsers([defaultUser, ...data.users]);
          } else {
            setUsers(data.users);
          }
        }
        
        if (data.staff) setStaff(data.staff);
        if (data.payrollRecords) setPayrollRecords(data.payrollRecords);
        if (data.vendors) setVendors(data.vendors);
        if (data.vendorAssignments) setVendorAssignments(data.vendorAssignments);
        if (data.vendorTransactions) setVendorTransactions(data.vendorTransactions);
        if (data.creativePackages) setCreativePackages(data.creativePackages);
        if (data.festivals) setFestivals(data.festivals);
      } catch (error) {
        // Silent error handling for production
        if (import.meta.env.DEV) {
          console.error('Error loading data:', error);
        }
      }
    }
  }, []);

  // Save data to localStorage whenever it changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        const data = {
          companySettings,
          clients,
          products,
          quotations,
          jobSheets,
          bills,
          transactions,
          users,
          staff,
          payrollRecords,
          vendors,
          vendorAssignments,
          vendorTransactions,
          creativePackages,
          festivals,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (error) {
        // Handle quota exceeded error silently
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.warn('localStorage quota exceeded');
        }
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
  }, [companySettings, clients, products, quotations, jobSheets, bills, transactions, users, staff, payrollRecords, vendors, vendorAssignments, vendorTransactions, creativePackages, festivals]);

  // Authentication
  const login = (username: string, password: string): boolean => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  // Company Settings
  const updateCompanySettings = (settings: CompanySettings) => {
    setCompanySettings(settings);
  };

  // Clients
  const addClient = (client: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = {
      ...client,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setClients(prev => [...prev, newClient]);
  };

  const updateClient = (id: string, client: Partial<Client>) => {
    setClients(prev => prev.map(c => (c.id === id ? { ...c, ...client } : c)));
  };

  const deleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
  };

  const getClientById = (id: string) => {
    return clients.find(c => c.id === id);
  };

  // Products
  const addProduct = (product: Omit<Product, 'id' | 'createdAt'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setProducts(prev => [...prev, newProduct]);
  };

  const updateProduct = (id: string, product: Partial<Product>) => {
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, ...product } : p)));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const getProductById = (id: string) => {
    return products.find(p => p.id === id);
  };

  // Quotations
  const addQuotation = (quotation: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt'>): string => {
    // Generate quotation number: DGQN01, DGQN02, etc.
    const nextNumber = quotations.length + 1;
    const quotationNumber = `DGQN${nextNumber.toString().padStart(2, '0')}`;
    const newQuotation: Quotation = {
      ...quotation,
      id: Date.now().toString(),
      quotationNumber,
      createdAt: new Date().toISOString(),
    };
    setQuotations(prev => [...prev, newQuotation]);
    
    // Create account transactions for quotation with advance
    // Note: quotation.totalAmount is the final amount after discount and including GST
    // All accounting follows Indian Golden Rules - Debit what comes in (receivables)
    if (quotation.advancePayment && quotation.advancePayment > 0) {
      const balanceReceivable = quotation.totalAmount - quotation.advancePayment;
      
      // Transaction 1: Total Amount Due (Debit)
      // Using discounted totalAmount for accurate accounting
      addTransaction({
        date: new Date().toISOString(),
        clientId: quotation.clientId,
        type: 'Due',
        description: `Quotation ${quotationNumber} - Total Amount as per Quotation (Receivable: ₹${balanceReceivable.toFixed(2)})`,
        debit: quotation.totalAmount, // Final amount after discount
        credit: 0,
        referenceType: 'Quotation',
        referenceId: newQuotation.id,
      });
      
      // Transaction 2: Advance Payment Received (Credit)
      addTransaction({
        date: new Date().toISOString(),
        clientId: quotation.clientId,
        type: 'Advance',
        description: `Quotation ${quotationNumber} - Advance Payment Received (Balance Receivable: ₹${balanceReceivable.toFixed(2)})`,
        debit: 0,
        credit: quotation.advancePayment,
        paymentMode: quotation.advancePaymentMode || 'Cash',
        referenceType: 'Quotation',
        referenceId: newQuotation.id,
      });
    }
    
    return newQuotation.id;
  };

  const updateQuotation = (id: string, quotation: Partial<Quotation>) => {
    setQuotations(prev => prev.map(q => (q.id === id ? { ...q, ...quotation } : q)));
  };

  const deleteQuotation = (id: string) => {
    setQuotations(prev => prev.filter(q => q.id !== id));
  };

  const getQuotationById = (id: string) => {
    return quotations.find(q => q.id === id);
  };

  // Job Sheets
  const addJobSheet = (jobSheet: Omit<JobSheet, 'id' | 'jobSheetNumber' | 'createdAt'>) => {
    // Generate job sheet number: DGJS01, DGJS02, etc.
    const nextNumber = jobSheets.length + 1;
    const jobSheetNumber = `DGJS${nextNumber.toString().padStart(2, '0')}`;
    const newJobSheet: JobSheet = {
      ...jobSheet,
      id: Date.now().toString(),
      jobSheetNumber,
      createdAt: new Date().toISOString(),
    };
    setJobSheets(prev => [...prev, newJobSheet]);
  };

  const updateJobSheet = (id: string, jobSheet: Partial<JobSheet>) => {
    setJobSheets(prev => prev.map(js => (js.id === id ? { ...js, ...jobSheet } : js)));
  };

  const deleteJobSheet = (id: string) => {
    setJobSheets(prev => prev.filter(js => js.id !== id));
  };

  const getJobSheetById = (id: string) => {
    return jobSheets.find(js => js.id === id);
  };

  const getJobSheetByQuotationId = (quotationId: string) => {
    return jobSheets.find(js => js.quotationId === quotationId);
  };

  // Bills
  const addBill = (bill: Omit<Bill, 'id' | 'billNumber' | 'createdAt'>, advancePaymentMode?: 'Cash' | 'Online' | 'Cheque' | 'UPI' | 'Other') => {
    // Generate bill number: DGIN01, DGIN02, etc.
    const nextNumber = bills.length + 1;
    const billNumber = `DGIN${nextNumber.toString().padStart(2, '0')}`;
    const newBill: Bill = {
      ...bill,
      id: Date.now().toString(),
      billNumber,
      createdAt: new Date().toISOString(),
    };
    setBills(prev => [...prev, newBill]);
    
    // Check if quotation already has transactions (advance was paid)
    const quotation = quotations.find(q => q.id === bill.quotationId);
    const hasQuotationTransactions = quotation && transactions.some(t => t.referenceType === 'Quotation' && t.referenceId === quotation.id);
    
    if (!hasQuotationTransactions) {
      // No transactions from quotation, create fresh transactions with bill details
      // Note: bill.totalAmount is the final amount after discount and including GST
      // All accounting follows Indian Golden Rules - Debit what comes in (receivables)
      const balanceAmount = bill.totalAmount - bill.advanceReceived;
      const isFullPayment = balanceAmount === 0;
      
      if (isFullPayment && bill.advanceReceived > 0) {
        // For full payment, create a single clean transaction showing payment received
        // No need for separate Due/Payment entries as payment is complete
        addTransaction({
          date: new Date().toISOString(),
          clientId: bill.clientId,
          type: 'Payment',
          description: `Bill ${billNumber} - Full Payment Received (₹${bill.totalAmount.toFixed(2)})`,
          debit: 0,
          credit: 0, // Net zero as bill and payment cancel each other
          paymentMode: advancePaymentMode || 'Cash',
          referenceType: 'Bill',
          referenceId: newBill.id,
        });
      } else {
        // For partial payment or no payment, create standard double-entry transactions
        // Create debit transaction for bill amount (what client owes)
        // Using discounted totalAmount for accurate accounting
        addTransaction({
          date: new Date().toISOString(),
          clientId: bill.clientId,
          type: 'Due',
          description: `Bill ${billNumber} - Total Amount as per Bill${balanceAmount > 0 ? ` (Receivable: ₹${balanceAmount.toFixed(2)})` : ''}`,
          debit: bill.totalAmount, // Final amount after discount
          credit: 0,
          referenceType: 'Bill',
          referenceId: newBill.id,
        });
        
        // Create credit transaction for payment received (if any)
        if (bill.advanceReceived > 0) {
          addTransaction({
            date: new Date().toISOString(),
            clientId: bill.clientId,
            type: 'Advance',
            description: `Bill ${billNumber} - Advance Payment Received (Balance Receivable: ₹${balanceAmount.toFixed(2)})`,
            debit: 0,
            credit: bill.advanceReceived,
            paymentMode: advancePaymentMode || 'Cash',
            referenceType: 'Bill',
            referenceId: newBill.id,
          });
        }
      }
    } else {
      // Quotation transactions exist - Always show bill details in ledger
      // Add bill transaction showing the bill was generated
      // Note: All amounts shown are final amounts after discount
      addTransaction({
        date: new Date().toISOString(),
        clientId: bill.clientId,
        type: 'Bill',
        description: `Bill ${billNumber} - Generated (Total: ₹${bill.totalAmount.toFixed(2)}, Advance: ₹${bill.advanceReceived.toFixed(2)}, Balance: ₹${bill.balanceAmount.toFixed(2)})`,
        debit: 0,
        credit: 0,
        referenceType: 'Bill',
        referenceId: newBill.id,
      });
      
      // Only add adjustment transaction if bill amount differs from quotation
      // Both bill.totalAmount and quotation.totalAmount are discounted amounts
      if (quotation && bill.totalAmount !== quotation.totalAmount) {
        const difference = bill.totalAmount - quotation.totalAmount;
        if (difference !== 0) {
          addTransaction({
            date: new Date().toISOString(),
            clientId: bill.clientId,
            type: difference > 0 ? 'Due' : 'Credit Note',
            description: `Bill ${billNumber} - Amount Adjustment (Difference: ₹${Math.abs(difference).toFixed(2)} ${difference > 0 ? 'Additional' : 'Credit'})`,
            debit: difference > 0 ? difference : 0,
            credit: difference < 0 ? Math.abs(difference) : 0,
            referenceType: 'Bill',
            referenceId: newBill.id,
          });
        }
      }
    }
  };

  const updateBill = (id: string, bill: Partial<Bill>, fullPaymentMode?: 'Cash' | 'Online' | 'Cheque' | 'UPI' | 'Other') => {
    setBills(prev => prev.map(b => (b.id === id ? { ...b, ...bill } : b)));
    
    // If payment is made, create transaction
    if (bill.paymentStatus === 'Paid') {
      const billData = bills.find(b => b.id === id);
      if (billData && billData.balanceAmount > 0) {
        const clientBalance = getClientBalance(billData.clientId);
        addTransaction({
          date: new Date().toISOString(),
          clientId: billData.clientId,
          type: 'Payment',
          description: `Payment for ${billData.billNumber}`,
          debit: 0,
          credit: billData.balanceAmount,
          balance: clientBalance - billData.balanceAmount,
          paymentMode: fullPaymentMode || 'Cash',
          referenceType: 'Bill',
          referenceId: id,
        });
      }
    }
  };

  const deleteBill = (id: string) => {
    setBills(prev => prev.filter(b => b.id !== id));
  };

  const getBillById = (id: string) => {
    return bills.find(b => b.id === id);
  };

  const getBillByJobSheetId = (jobSheetId: string) => {
    return bills.find(b => b.jobSheetId === jobSheetId);
  };

  const getBillByQuotationId = (quotationId: string) => {
    return bills.find(b => b.quotationId === quotationId);
  };

  // Accounts
  const addTransaction = (transaction: Omit<AccountTransaction, 'id' | 'balance'>) => {
    // Calculate the new balance based on previous transactions
    const clientTransactions = transactions
      .filter(t => t.clientId === transaction.clientId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const previousBalance = clientTransactions.length > 0 
      ? clientTransactions[clientTransactions.length - 1].balance 
      : 0;
    const newBalance = previousBalance + transaction.debit - transaction.credit;
    
    const newTransaction: AccountTransaction = {
      ...transaction,
      id: Date.now().toString(),
      balance: newBalance,
    };
    setTransactions(prev => [...prev, newTransaction]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const getClientTransactions = (clientId: string) => {
    return transactions.filter(t => t.clientId === clientId).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  const getClientBalance = (clientId: string) => {
    const clientTransactions = getClientTransactions(clientId);
    if (clientTransactions.length === 0) return 0;
    // Return the balance from the most recent transaction
    return clientTransactions[clientTransactions.length - 1].balance;
  };

  // Users
  const addUser = (user: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...user,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (id: string, user: Partial<User>) => {
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...user } : u)));
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  // Staff
  const addStaff = (staff: Omit<Staff, 'id' | 'createdAt'>) => {
    const newStaff: Staff = {
      ...staff,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setStaff(prev => [...prev, newStaff]);
  };

  const updateStaff = (id: string, staff: Partial<Staff>) => {
    setStaff(prev => prev.map(s => (s.id === id ? { ...s, ...staff } : s)));
  };

  const deleteStaff = (id: string) => {
    setStaff(prev => prev.filter(s => s.id !== id));
  };

  const getStaffById = (id: string) => {
    return staff.find(s => s.id === id);
  };

  // Payroll
  const addPayrollRecord = (record: Omit<PayrollRecord, 'id' | 'createdAt'>) => {
    const newRecord: PayrollRecord = {
      ...record,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setPayrollRecords(prev => [...prev, newRecord]);
  };

  const updatePayrollRecord = (id: string, record: Partial<PayrollRecord>) => {
    setPayrollRecords(prev => prev.map(r => (r.id === id ? { ...r, ...record } : r)));
  };

  const deletePayrollRecord = (id: string) => {
    setPayrollRecords(prev => prev.filter(r => r.id !== id));
  };

  const getPayrollRecordById = (id: string) => {
    return payrollRecords.find(r => r.id === id);
  };

  // Vendors
  const addVendor = (vendor: Omit<Vendor, 'id' | 'createdAt'>) => {
    const newVendor: Vendor = {
      ...vendor,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setVendors(prev => [...prev, newVendor]);
  };

  const updateVendor = (id: string, vendor: Partial<Vendor>) => {
    setVendors(prev => prev.map(v => (v.id === id ? { ...v, ...vendor } : v)));
  };

  const deleteVendor = (id: string) => {
    setVendors(prev => prev.filter(v => v.id !== id));
  };

  const getVendorById = (id: string) => {
    return vendors.find(v => v.id === id);
  };

  // Vendor Assignments
  const addVendorAssignment = (assignment: Omit<VendorAssignment, 'id'>) => {
    const newAssignment: VendorAssignment = {
      ...assignment,
      id: Date.now().toString(),
    };
    setVendorAssignments(prev => [...prev, newAssignment]);
    return newAssignment.id; // Return the ID so it can be used for transactions
  };

  const updateVendorAssignment = (id: string, assignment: Partial<VendorAssignment>) => {
    setVendorAssignments(prev => prev.map(a => (a.id === id ? { ...a, ...assignment } : a)));
  };

  const deleteVendorAssignment = (id: string) => {
    setVendorAssignments(prev => prev.filter(a => a.id !== id));
  };

  const getVendorAssignmentById = (id: string) => {
    return vendorAssignments.find(a => a.id === id);
  };

  const getVendorAssignmentsByJobSheet = (jobSheetId: string) => {
    return vendorAssignments.filter(a => a.jobSheetId === jobSheetId);
  };

  const getVendorAssignmentsByVendor = (vendorId: string) => {
    return vendorAssignments.filter(a => a.vendorId === vendorId);
  };

  // Vendor Transactions
  const addVendorTransaction = (transaction: Omit<VendorTransaction, 'id' | 'balance'>) => {
    // Calculate the new balance based on previous transactions
    const transactions = vendorTransactions
      .filter(t => t.vendorId === transaction.vendorId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const previousBalance = transactions.length > 0 ? transactions[transactions.length - 1].balance : 0;
    // For VENDORS (Creditors): Balance = Credit - Debit (what we owe them)
    // Credit = they gave us goods/work (increases what we owe)
    // Debit = we paid them (decreases what we owe)
    const newBalance = previousBalance + transaction.credit - transaction.debit;
    
    const newTransaction: VendorTransaction = {
      ...transaction,
      id: Date.now().toString(),
      balance: newBalance,
    };
    setVendorTransactions(prev => [...prev, newTransaction]);
    return newTransaction.id;
  };

  const deleteVendorTransaction = (id: string) => {
    setVendorTransactions(prev => prev.filter(t => t.id !== id));
  };

  const getVendorTransactions = (vendorId: string) => {
    return vendorTransactions.filter(t => t.vendorId === vendorId).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  const getVendorBalance = (vendorId: string) => {
    // Calculate balance from vendor assignments
    const assignments = getVendorAssignmentsByVendor(vendorId);
    const totalDue = assignments.reduce((sum, assignment) => sum + Number(assignment.totalAmount || 0), 0);
    const totalPaidViaAssignments = assignments.reduce((sum, assignment) => sum + Number(assignment.advancePaid || 0), 0);
    
    // Calculate balance from vendor transactions (additional payments not tracked in assignments)
    const transactions = getVendorTransactions(vendorId);
    const additionalPayments = transactions
      .filter(t => t.type === 'Payment')
      .reduce((sum, t) => sum + t.debit, 0);
    
    // Balance = Total amount owed - Total paid
    const balance = totalDue - totalPaidViaAssignments - additionalPayments;
    
    return balance;
  };

  // Creative Packages
  const addCreativePackage = (packageTracking: Omit<CreativePackageTracking, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPackage: CreativePackageTracking = {
      ...packageTracking,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCreativePackages(prev => [...prev, newPackage]);
  };

  const updateCreativePackage = (id: string, packageTracking: Partial<CreativePackageTracking>) => {
    setCreativePackages(prev => prev.map(p => (p.id === id ? { ...p, ...packageTracking, updatedAt: new Date().toISOString() } : p)));
  };

  const deleteCreativePackage = (id: string) => {
    setCreativePackages(prev => prev.filter(p => p.id !== id));
  };

  const getCreativePackageById = (id: string) => {
    return creativePackages.find(p => p.id === id);
  };

  // Festivals
  const addFestival = (festival: Omit<Festival, 'id' | 'createdAt'>) => {
    const newFestival: Festival = {
      ...festival,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setFestivals(prev => [...prev, newFestival]);
  };

  const addMultipleFestivals = (festivalsToAdd: Omit<Festival, 'id' | 'createdAt'>[]) => {
    const newFestivals: Festival[] = festivalsToAdd.map((festival, index) => ({
      ...festival,
      id: (Date.now() + index).toString(),
      createdAt: new Date().toISOString(),
    }));
    setFestivals(prev => [...prev, ...newFestivals]);
  };

  const updateFestival = (id: string, festival: Partial<Festival>) => {
    setFestivals(prev => prev.map(f => (f.id === id ? { ...f, ...festival } : f)));
  };

  const deleteFestival = (id: string) => {
    setFestivals(prev => prev.filter(f => f.id !== id));
  };

  const getFestivalById = (id: string) => {
    return festivals.find(f => f.id === id);
  };

  // Data Management
  const exportData = (): string => {
    const data = {
      companySettings,
      clients,
      products,
      quotations,
      jobSheets,
      bills,
      transactions,
      users,
      staff,
      payrollRecords,
      vendors,
      vendorAssignments,
      vendorTransactions,
      creativePackages,
      festivals,
      exportDate: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  };

  const importData = (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.companySettings) setCompanySettings(data.companySettings);
      if (data.clients) setClients(data.clients);
      if (data.products) setProducts(data.products);
      if (data.quotations) setQuotations(data.quotations);
      if (data.jobSheets) setJobSheets(data.jobSheets);
      if (data.bills) setBills(data.bills);
      if (data.transactions) setTransactions(data.transactions);
      if (data.users) setUsers(data.users);
      if (data.staff) setStaff(data.staff);
      if (data.payrollRecords) setPayrollRecords(data.payrollRecords);
      if (data.vendors) setVendors(data.vendors);
      if (data.vendorAssignments) setVendorAssignments(data.vendorAssignments);
      if (data.vendorTransactions) setVendorTransactions(data.vendorTransactions);
      if (data.creativePackages) setCreativePackages(data.creativePackages);
      if (data.festivals) setFestivals(data.festivals);
    } catch (error) {
      throw new Error('Invalid data format');
    }
  };

  const value: DataContextType = {
    currentUser,
    login,
    logout,
    companySettings,
    updateCompanySettings,
    clients,
    addClient,
    updateClient,
    deleteClient,
    getClientById,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    quotations,
    addQuotation,
    updateQuotation,
    deleteQuotation,
    getQuotationById,
    jobSheets,
    addJobSheet,
    updateJobSheet,
    deleteJobSheet,
    getJobSheetById,
    getJobSheetByQuotationId,
    bills,
    addBill,
    updateBill,
    deleteBill,
    getBillById,
    getBillByJobSheetId,
    getBillByQuotationId,
    transactions,
    addTransaction,
    deleteTransaction,
    getClientTransactions,
    getClientBalance,
    users,
    addUser,
    updateUser,
    deleteUser,
    staff,
    addStaff,
    updateStaff,
    deleteStaff,
    getStaffById,
    payrollRecords,
    addPayrollRecord,
    updatePayrollRecord,
    deletePayrollRecord,
    getPayrollRecordById,
    vendors,
    addVendor,
    updateVendor,
    deleteVendor,
    getVendorById,
    vendorAssignments,
    addVendorAssignment,
    updateVendorAssignment,
    deleteVendorAssignment,
    getVendorAssignmentById,
    getVendorAssignmentsByJobSheet,
    getVendorAssignmentsByVendor,
    vendorTransactions,
    addVendorTransaction,
    deleteVendorTransaction,
    getVendorTransactions,
    getVendorBalance,
    creativePackages,
    addCreativePackage,
    updateCreativePackage,
    deleteCreativePackage,
    getCreativePackageById,
    festivals,
    addFestival,
    addMultipleFestivals,
    updateFestival,
    deleteFestival,
    getFestivalById,
    exportData,
    importData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};