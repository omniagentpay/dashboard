import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { PageLoader } from './PageLoader';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { ready, authenticated } = usePrivy();

  if (!ready) {
    return <PageLoader text="Loading..." />;
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
