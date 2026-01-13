import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const GoogleOAuthSuccess = () => {
  const { loginWithOAuth } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const userJson = searchParams.get('user');

    if (token && userJson) {
      try {
        const user = JSON.parse(decodeURIComponent(userJson));
        loginWithOAuth(user, token, refreshToken).then((result) => {
          if (!result.success) {
            window.location.href = `/login?error=oauth_failed&message=${encodeURIComponent(result.message || 'Authentication failed')}`;
            return;
          }

          // Ensure we land on the protected smart redirect route.
          // Using a hard navigation here avoids edge cases where state timing briefly fails ProtectedRoute and bounces elsewhere.
          try {
            window.location.replace('/home');
          } catch {
            navigate('/home', { replace: true });
          }
        }).catch(() => {
          window.location.href = '/login?error=oauth_failed';
        });
      } catch (error) {
        window.location.href = `/login?error=oauth_failed&message=${encodeURIComponent('Failed to process authentication data')}`;
      }
    } else {
      window.location.href = '/login?error=oauth_failed&message=Missing authentication data';
    }
  }, [loginWithOAuth, searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-heading-3 font-semibold text-slate-900">Finalizing your login...</h2>
        <p className="text-slate-600 mt-2">Please wait while we complete your authentication.</p>
      </div>
    </div>
  );
};

export default GoogleOAuthSuccess;
