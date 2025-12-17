// =====================================================
// START FILING PAGE - ITR FILING ENTRY POINT
// Redirects to select-person page (consolidated flow)
// =====================================================

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const StartFiling = () => {
  const navigate = useNavigate();

  // Redirect immediately to select-person page
  useEffect(() => {
    navigate('/itr/select-person', { replace: true });
  }, [navigate]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-600">Redirecting...</p>
      </div>
    </div>
  );
};

export default StartFiling;
