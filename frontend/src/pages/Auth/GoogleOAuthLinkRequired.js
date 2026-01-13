import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../components/DesignSystem/components/Button';
import { OrientationPage } from '../../components/templates';
import { Card } from '../../components/UI/Card';
import { typography, spacing, components, layout } from '../../styles/designTokens';

const GoogleOAuthLinkRequired = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const email = params.get('email');

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-elevation-1 p-6">
        <h1 className="text-heading-3 font-semibold text-slate-900">Account linking required</h1>
        <p className="text-slate-600 mt-2">
          An account already exists with this email. For security, we don’t auto-link Google to existing accounts.
        </p>
        {email ? (
          <p className="text-slate-600 mt-2">
            Email: <span className="font-medium text-slate-900">{email}</span>
          </p>
        ) : null}

        <div className="mt-6 space-y-3">
          <Button onClick={() => navigate('/login', { replace: true })} className="w-full">
            Login with password to continue
          </Button>
          <Button variant="outline" onClick={() => navigate('/signup', { replace: true })} className="w-full">
            Create a new account instead
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GoogleOAuthLinkRequired;

