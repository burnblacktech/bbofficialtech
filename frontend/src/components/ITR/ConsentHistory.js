// =====================================================
// CONSENT HISTORY COMPONENT
// Displays consent history for a return version
// =====================================================

import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Clock, User } from 'lucide-react';
import apiClient from '../../services/core/APIClient';
import toast from 'react-hot-toast';

const ConsentHistory = ({ returnId, versionId }) => {
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (returnId && versionId) {
      fetchConsents();
    }
  }, [returnId, versionId]);

  const fetchConsents = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/itr/returns/${returnId}/versions/${versionId}/consents`);
      if (response.data.success) {
        setConsents(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to load consent history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'given':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'revoked':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'expired':
        return <Clock className="w-4 h-4 text-gold-600" />;
      default:
        return <Shield className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatScope = (scope) => {
    return scope.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-4">
          <Clock className="w-6 h-6 animate-pulse text-blue-600" />
        </div>
      </div>
    );
  }

  if (consents.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-4 text-gray-500">
          <Shield className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No consents recorded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-blue-600" />
          Consent History
        </h3>
        <span className="text-sm text-gray-500">{consents.length} consents</span>
      </div>

      <div className="space-y-3">
        {consents.map((consent) => (
          <div
            key={consent.id}
            className={`border rounded-lg p-3 ${
              consent.status === 'given' ? 'border-green-200 bg-green-50' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  {getStatusIcon(consent.status)}
                  <span className="font-semibold text-gray-900">
                    {formatScope(consent.scope)}
                  </span>
                  <span className="text-xs text-gray-500 capitalize">({consent.level})</span>
                </div>
                {consent.fieldPath && (
                  <p className="text-xs text-gray-600 mb-1">Field: {consent.fieldPath}</p>
                )}
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(consent.timestamp).toLocaleString('en-IN')}
                  </span>
                  {consent.expiresAt && (
                    <span>
                      Expires: {new Date(consent.expiresAt).toLocaleDateString('en-IN')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConsentHistory;

