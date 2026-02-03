import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, verifyToken } = useAdminAuth();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      console.log('[ProtectedRoute] checkAuth called');
      console.log('[ProtectedRoute] isLoading:', isLoading);
      console.log('[ProtectedRoute] isAuthenticated:', isAuthenticated);
      
      if (!isLoading) {
        if (isAuthenticated) {
          console.log('[ProtectedRoute] User is authenticated, verifying token...');
          // Verify token khi đã có authentication
          const isValid = await verifyToken();
          console.log('[ProtectedRoute] Token verification result:', isValid);
          setIsVerifying(false);
          if (!isValid) {
            console.warn('[ProtectedRoute] Token verification failed, will redirect to login');
            // Token không hợp lệ, sẽ redirect trong render
            return;
          }
          console.log('[ProtectedRoute] Token verified successfully');
        } else {
          console.log('[ProtectedRoute] User not authenticated');
          setIsVerifying(false);
        }
      }
    };

    checkAuth();
  }, [isLoading, isAuthenticated, verifyToken]);

  if (isLoading || isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
          <p className="text-slate-600 font-medium">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
