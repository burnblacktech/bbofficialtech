import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const GoogleOAuthSuccess = () => {
  const { loginWithOAuth } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const userJson = searchParams.get('user');

    if (token && userJson) {
      try {
        const user = JSON.parse(decodeURIComponent(userJson));
        loginWithOAuth(user, token, refreshToken).then((result) => {
          if (!result.success) {
            console.error('OAuth login failed:', result.message);
            window.location.href = '/login?error=oauth_failed';
          }
        });
      } catch (error) {
        console.error('Failed to parse user data:', error);
        // Redirect to login with error
        window.location.href = '/login?error=oauth_failed';
      }
    } else {
      console.error('Missing token or user data in OAuth callback');
      // Redirect to login with error
      window.location.href = '/login?error=oauth_failed';
    }
  }, [loginWithOAuth, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900">Finalizing your login...</h2>
        <p className="text-gray-600 mt-2">Please wait while we complete your authentication.</p>
      </div>
    </div>
  );
};

export default GoogleOAuthSuccess;
