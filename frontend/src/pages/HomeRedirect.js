/**
 * HomeRedirect — Send authenticated users to appropriate dashboard
 * SUPER_ADMIN → /admin, everyone else → /dashboard
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function HomeRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: '#6b7280' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'SUPER_ADMIN') return <Navigate to="/admin" replace />;
  return <Navigate to="/dashboard" replace />;
}
