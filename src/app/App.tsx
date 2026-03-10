import { createBrowserRouter, RouterProvider, Navigate } from 'react-router';
import { DataProvider } from './context/DataContext';
import { Toaster } from './components/ui/sonner';
import { Suspense, lazy } from 'react';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';

// Eager load critical components
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Lazy load other components for better performance
const ClientManagement = lazy(() => import('./pages/ClientManagement'));
const ProductManagement = lazy(() => import('./pages/ProductManagement'));
const OrderManagement = lazy(() => import('./pages/OrderManagement'));
const Accounts = lazy(() => import('./pages/Accounts'));
const DataManagement = lazy(() => import('./pages/DataManagement'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const CreateQuotation = lazy(() => import('./pages/CreateQuotation'));
const EditQuotation = lazy(() => import('./pages/EditQuotation'));
const QuotationView = lazy(() => import('./pages/QuotationView'));
const JobSheetView = lazy(() => import('./pages/JobSheetView'));
const BillingView = lazy(() => import('./pages/BillingView'));
const StaffPayroll = lazy(() => import('./pages/StaffPayroll'));
const Vendors = lazy(() => import('./pages/Vendors'));
const CreativePackages = lazy(() => import('./pages/CreativePackages'));
const CreativePackageTracking = lazy(() => import('./pages/CreativePackageTracking'));
const CreateCreativeQuotation = lazy(() => import('./pages/CreateCreativeQuotation'));
const FestivalManagement = lazy(() => import('./pages/FestivalManagement'));

// Loading component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1929] via-[#0d1b2a] to-[#1a2332] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#2196F3] border-r-transparent mb-4"></div>
        <p className="text-white/70 text-sm">Loading...</p>
      </div>
    </div>
  );
}

// Create router
const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/dashboard",
    element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
  },
  {
    path: "/clients",
    element: <ProtectedRoute><ClientManagement /></ProtectedRoute>,
  },
  {
    path: "/products",
    element: <ProtectedRoute><ProductManagement /></ProtectedRoute>,
  },
  {
    path: "/orders",
    element: <ProtectedRoute><OrderManagement /></ProtectedRoute>,
  },
  {
    path: "/orders/quotation/new",
    element: <ProtectedRoute><CreateQuotation /></ProtectedRoute>,
  },
  {
    path: "/orders/edit-quotation/:id",
    element: <ProtectedRoute><EditQuotation /></ProtectedRoute>,
  },
  {
    path: "/orders/quotation/:id",
    element: <ProtectedRoute><QuotationView /></ProtectedRoute>,
  },
  {
    path: "/orders/jobsheet/:id",
    element: <ProtectedRoute><JobSheetView /></ProtectedRoute>,
  },
  {
    path: "/orders/billing/:id",
    element: <ProtectedRoute><BillingView /></ProtectedRoute>,
  },
  {
    path: "/vendors",
    element: <ProtectedRoute><Vendors /></ProtectedRoute>,
  },
  {
    path: "/accounts",
    element: <ProtectedRoute adminOnly><Accounts /></ProtectedRoute>,
  },
  {
    path: "/data-management",
    element: <ProtectedRoute adminOnly><DataManagement /></ProtectedRoute>,
  },
  {
    path: "/festival-management",
    element: <ProtectedRoute adminOnly><FestivalManagement /></ProtectedRoute>,
  },
  {
    path: "/user-management",
    element: <ProtectedRoute adminOnly><UserManagement /></ProtectedRoute>,
  },
  {
    path: "/staff-payroll",
    element: <ProtectedRoute><StaffPayroll /></ProtectedRoute>,
  },
  {
    path: "/creative-packages",
    element: <ProtectedRoute><CreativePackages /></ProtectedRoute>,
  },
  {
    path: "/creative-packages/quotation/new",
    element: <ProtectedRoute><CreateCreativeQuotation /></ProtectedRoute>,
  },
  {
    path: "/creative-packages/track/:id",
    element: <ProtectedRoute><CreativePackageTracking /></ProtectedRoute>,
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export default function App() {
  return (
    <ErrorBoundary>
      <DataProvider>
        <Suspense fallback={<LoadingFallback />}>
          <RouterProvider router={router} />
        </Suspense>
        <Toaster position="top-right" />
      </DataProvider>
    </ErrorBoundary>
  );
}