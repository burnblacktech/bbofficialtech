/**
 * Google OAuth Success — Processes OAuth callback and redirects
 */

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function GoogleOAuthSuccess() {
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
          try { window.location.replace('/home'); } catch { navigate('/home', { replace: true }); }
        }).catch(() => { window.location.href = '/login?error=oauth_failed'; });
      } catch {
        window.location.href = `/login?error=oauth_failed&message=${encodeURIComponent('Failed to process authentication data')}`;
      }
    } else {
      window.location.href = '/login?error=oauth_failed&message=Missing authentication data';
    }
  }, [loginWithOAuth, searchParams, navigate]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="animate-spin" style={{ width: 40, height: 40, border: '3px solid #E8E8E4', borderTopColor: '#D4AF37', borderRadius: '50%', margin: '0 auto 16px' }}></div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>Finalizing your login...</div>
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Please wait while we complete authentication.</div>
      </div>
    </div>
  );
}
