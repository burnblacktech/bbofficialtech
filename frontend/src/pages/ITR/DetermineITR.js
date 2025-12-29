// =====================================================
// DETERMINE ITR (CANONICAL) PAGE
// Simplified flow: Show ITR 1/2/3/4 Cards directly.
// User selects -> Goes to Computation.
// =====================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ITRSelectionCards from '../../components/ITR/ITRSelectionCards';
import { ArrowLeft, Wand2 } from 'lucide-react';
import { trackEvent } from '../../utils/analyticsEvents';
import toast from 'react-hot-toast';

// Optional: Import DataSourceSelector if users want the full wizard
import DataSourceSelector from '../../components/ITR/DataSourceSelector';

export default function DetermineITR() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const selectedPerson = location.state?.selectedPerson;

  // Use state to toggle between "Cards View" (Default) and "Auto-Detect Wizard"
  const [showWizard, setShowWizard] = useState(false);
  const [selectedITR, setSelectedITR] = useState(null);

  // Analytics
  useEffect(() => {
    trackEvent('itr_determine_view_cards', { userId: user?.id });
  }, [user]);

  if (!selectedPerson) {
    // Safety redirect
    return (
      <div className="p-8 text-center">
        <p>Redirecting...</p>
        {setTimeout(() => navigate('/itr/select-person'), 100)}
      </div>
    );
  }

  // If user explicitly asks for wizard (Auto-Detect)
  if (showWizard) {
    return (
      <DataSourceSelector
        onProceed={(itrType, state) => {
          navigate('/itr/computation', { state });
        }}
      />
    );
  }

  const handleSelectITR = (itrId) => {
    setSelectedITR(itrId);
    // Proceed immediately or ask for confirmation?
    // UX requirement says "Allow override". Selection implies choice.
    // We navigate immediately for smoothness.
    trackEvent('itr_type_selected', { itrType: itrId });
    navigate('/itr/computation', {
      state: {
        selectedPerson,
        selectedITR: itrId,
        entryPoint: 'manual_selection',
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/itr/start')}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Select ITR Form</h1>
            <p className="text-sm text-slate-600">Choose the return form that applies to you</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Recommendation / Auto-Detect Callout */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 mb-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Wand2 className="w-5 h-5 text-primary-200" />
              <h2 className="font-semibold text-lg">Not sure which ITR to choose?</h2>
            </div>
            <p className="text-primary-100 text-sm max-w-lg">
              We can analyze your income sources (Salary, Business, Capital Gains)
              from your PAN data and recommend the correct form for you.
            </p>
          </div>
          <button
            onClick={() => setShowWizard(true)}
            className="bg-white text-primary-700 px-6 py-3 rounded-xl font-bold hover:bg-primary-50 active:scale-95 transition-all shadow-xl whitespace-nowrap"
          >
            Auto-Detect for Me
          </button>
        </div>

        {/* Cards Grid */}
        <h3 className="text-lg font-bold text-slate-800 mb-4 px-1">Available ITR Forms</h3>
        <div className="h-auto">
          <ITRSelectionCards
            selectedITR={selectedITR}
            onSelect={handleSelectITR}
            onHelp={() => setShowWizard(true)}
          />
        </div>

      </div>
    </div>
  );
}
