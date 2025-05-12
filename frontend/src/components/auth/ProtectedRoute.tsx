import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [hasChecked, setHasChecked] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    const authorized = !!token || isAuthenticated;
    
    console.log('ProtectedRoute - Checking auth:', { 
      path: location.pathname,
      hasToken: !!token, 
      isAuthenticated, 
      authorized 
    });
    
    setIsAuthorized(authorized);
    setHasChecked(true);
  }, [isAuthenticated, location.pathname]);
  
  if (isLoading || !hasChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }
  
  if (!isAuthorized) {
    console.log('Not authorized, redirecting to login');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  
  console.log('User is authorized, rendering protected content');
  return <Outlet />;
};

export default ProtectedRoute;
