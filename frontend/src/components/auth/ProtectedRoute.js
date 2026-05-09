import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (isLoading) {
    return <div role="status" aria-live="polite" aria-label="Loading application" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><span>Loading...</span></div>;
  }

  if (!user) {
    return <Navigate to={isAdminRoute ? '/admin/login' : '/login'} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
