// =====================================================
// SESSION MANAGEMENT PAGE
// View active sessions and manage logout
// =====================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services';
import { Monitor, Smartphone, Tablet, LogOut, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../services/core/APIClient';
import { ConfirmationDialog } from '../../components/UI/ConfirmationDialog/ConfirmationDialog';
import { OrientationPage } from '../../components/templates';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';

const SessionManagement = () => {
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [logoutConfirm, setLogoutConfirm] = useState({ isOpen: false, sessionId: null, isAll: false });

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.get('/auth/sessions');
      if (response.data.success) {
        // Transform API response to match component expectations
        const formattedSessions = response.data.sessions.map(session => ({
          id: session.id,
          deviceType: session.deviceType || 'desktop',
          deviceName: session.deviceName || 'Unknown Device',
          browser: session.browser || 'Unknown',
          os: session.os || 'Unknown',
          location: session.location || 'Unknown',
          ipAddress: session.ipAddress || 'Unknown',
          lastActive: new Date(session.lastActive),
          isCurrent: session.isCurrent || false,
        }));
        setSessions(formattedSessions);
      } else {
        throw new Error(response.data.error || 'Failed to load sessions');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load sessions';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoutSession = async (sessionId) => {
    setLogoutConfirm({ isOpen: true, sessionId, isAll: false });
  };

  const handleLogoutAll = async () => {
    setLogoutConfirm({ isOpen: true, sessionId: null, isAll: true });
  };

  const confirmLogout = async () => {
    try {
      if (logoutConfirm.isAll) {
        const response = await apiClient.post('/auth/sessions/logout-all');

        if (response.data.success) {
          toast.success('Logged out from all devices');
          logout();
        } else {
          throw new Error(response.data.error || 'Failed to logout from all devices');
        }
      } else if (logoutConfirm.sessionId) {
        const response = await apiClient.delete(`/auth/sessions/${logoutConfirm.sessionId}`);

        if (response.data.success) {
          setSessions(sessions.filter(s => s.id !== logoutConfirm.sessionId));
          toast.success('Logged out from device successfully');

          // If current session, redirect to login
          const session = sessions.find(s => s.id === logoutConfirm.sessionId);
          if (session?.isCurrent) {
            logout();
          }
        } else {
          throw new Error(response.data.error || 'Failed to logout from device');
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message ||
        (logoutConfirm.isAll ? 'Failed to logout from all devices' : 'Failed to logout from device');
      toast.error(errorMessage);
    } finally {
      setLogoutConfirm({ isOpen: false, sessionId: null, isAll: false });
    }
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="w-5 h-5" />;
      case 'tablet':
        return <Tablet className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  const formatLastActive = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  if (isLoading) {

    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-slate-200 rounded w-1/3"></div>
              <div className="h-32 bg-slate-200 rounded"></div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-heading-xl text-slate-900 mb-2">Active Sessions</h1>
          <p className="text-body-md text-slate-600">
            Manage your active sessions and logout from devices
          </p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-error-50 border border-error-200 text-error-600 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Error</p>
              <p className="text-body-regular mt-1">{error}</p>
            </div>
          </div>
        )}

        <Card>
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-heading-md text-slate-900">Current Session</h2>
                <p className="text-body-sm text-slate-600 mt-1">
                  This is your current active session
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`p-6 ${session.isCurrent ? 'bg-gold-50' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`flex-shrink-0 p-3 rounded-xl ${session.isCurrent ? 'bg-gold-100 text-gold-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                      {getDeviceIcon(session.deviceType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-heading-sm text-slate-900">
                          {session.deviceName}
                        </h3>
                        {session.isCurrent && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-body-small font-medium bg-gold-100 text-gold-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Current
                          </span>
                        )}
                      </div>
                      <div className="mt-2 space-y-1">
                        <p className="text-body-sm text-slate-600">
                          <span className="font-medium">Browser:</span> {session.browser}
                        </p>
                        <p className="text-body-sm text-slate-600">
                          <span className="font-medium">Location:</span> {session.location}
                        </p>
                        <p className="text-body-sm text-slate-600">
                          <span className="font-medium">IP Address:</span> {session.ipAddress}
                        </p>
                        <p className="text-body-sm text-slate-600">
                          <span className="font-medium">Last Active:</span> {formatLastActive(session.lastActive)}
                        </p>
                      </div>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <button
                      onClick={() => handleLogoutSession(session.id)}
                      className="ml-4 flex items-center px-3 py-2 text-body-regular font-medium text-error-600 hover:text-error-700 hover:bg-error-50 rounded-xl transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-1" />
                      Logout
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {sessions.length === 0 && (
            <div className="p-12 text-center">
              <Monitor className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-4 text-heading-sm text-slate-900">No active sessions</h3>
              <p className="mt-2 text-body-sm text-slate-600">
                You don't have any active sessions at the moment.
              </p>
            </div>
          )}
          <div className="p-6 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-heading-sm text-slate-900">Logout from all devices</h3>
                <p className="text-body-sm text-slate-600 mt-1">
                  This will logout you from all devices including this one
                </p>
              </div>
              <button
                onClick={handleLogoutAll}
                className="ml-4 flex items-center px-4 py-2 text-body-regular font-medium text-white bg-error-600 hover:bg-error-700 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout All
              </button>
            </div>
          </div>
        </Card>

        <div className="mt-6 bg-info-50 border border-info-200 rounded-xl p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-info-600 flex-shrink-0 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-heading-sm text-info-900">Security Tips</h3>
              <ul className="mt-2 text-body-sm text-info-700 list-disc list-inside space-y-1">
                <li>Regularly review your active sessions</li>
                <li>Logout from devices you no longer use</li>
                <li>If you see an unknown session, logout immediately and change your password</li>
                <li>Use strong, unique passwords for your account</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={logoutConfirm.isOpen}
        onClose={() => setLogoutConfirm({ isOpen: false, sessionId: null, isAll: false })}
        onConfirm={confirmLogout}
        title={logoutConfirm.isAll ? 'Logout from All Devices' : 'Logout from Device'}
        message={logoutConfirm.isAll
          ? 'Are you sure you want to logout from all devices? You will need to login again.'
          : 'Are you sure you want to logout from this device?'}
        confirmLabel="Logout"
        cancelLabel="Cancel"
        variant="destructive"
      />
    </div>
  );
};

export default SessionManagement;

