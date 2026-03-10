import { Navigate } from 'react-router';
import { useData } from '../context/DataContext';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { currentUser } = useData();

  // Not logged in - redirect to login
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // Admin-only route but user is not admin
  if (adminOnly && currentUser.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
