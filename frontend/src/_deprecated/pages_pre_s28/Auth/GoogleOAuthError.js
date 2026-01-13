import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../components/DesignSystem/components/Button';

const GoogleOAuthError = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const message = params.get('message') || 'Google authentication failed. Please try again.';
  const email = params.get('email');

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-elevation-1 p-6">
        <h1 className="text-heading-3 font-semibold text-slate-900">Google sign-in failed</h1>
        <p className="text-slate-600 mt-2">{message}</p>
        {email ? (
          <p className="text-slate-600 mt-2">
            Email: <span className="font-medium text-slate-900">{email}</span>
          </p>
        ) : null}

        <div className="mt-6 flex gap-3">
          <Button onClick={() => navigate('/login', { replace: true })} className="flex-1">
            Go to Login
          </Button>
          <Button variant="outline" onClick={() => navigate('/', { replace: true })} className="flex-1">
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GoogleOAuthError;

