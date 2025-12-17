// =====================================================
// CONSENT CAPTURE COMPONENT
// Captures user consent for various actions
// =====================================================

import React, { useState } from 'react';
import { Shield, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import apiClient from '../../services/core/APIClient';
import toast from 'react-hot-toast';

const ConsentCapture = ({ returnVersionId, scope, level = 'global', fieldPath = null, onConsentGiven }) => {
  const [consented, setConsented] = useState(false);
  const [loading, setLoading] = useState(false);

  const consentTexts = {
    filing: 'I consent to file my Income Tax Return using the provided information.',
    data_sharing: 'I consent to share my data with authorized tax authorities and service providers.',
    e_sign: 'I consent to electronically sign my Income Tax Return.',
    document_access: 'I consent to access and process my uploaded documents for tax filing purposes.',
    auto_fill: 'I consent to automatically fill my return using data from AIS, Form26AS, and other authorized sources.',
    ai_recommendations: 'I consent to receive AI-powered tax optimization recommendations.',
  };

  const handleConsent = async (giveConsent) => {
    if (!giveConsent) {
      toast.error('Consent is required to proceed');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/itr/consents', {
        returnVersionId,
        scope,
        level,
        fieldPath,
        metadata: {
          ipAddress: null, // Could be captured from backend
          userAgent: navigator.userAgent,
          consentText: consentTexts[scope] || 'I consent to the requested action.',
        },
      });

      if (response.data.success) {
        setConsented(true);
        toast.success('Consent recorded successfully');
        if (onConsentGiven) {
          onConsentGiven(response.data.data);
        }
      }
    } catch (error) {
      toast.error('Failed to record consent: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
      <div className="flex items-start space-x-3">
        <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900 mb-2">Consent Required</h4>
          <p className="text-body-regular text-slate-700 mb-4">
            {consentTexts[scope] || 'Your consent is required to proceed.'}
          </p>
          {!consented ? (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleConsent(true)}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>I Consent</span>
              </button>
              <button
                onClick={() => handleConsent(false)}
                disabled={loading}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <XCircle className="w-4 h-4" />
                <span>Decline</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Consent recorded</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsentCapture;

