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
      // TODO: Implement API call to get active sessions
      // const response = await apiClient.get('/auth/sessions');

      // Mock data for now
      const mockSessions = [
        {
          id: '1',
          deviceType: 'desktop',
          deviceName: 'Windows PC',
          browser: 'Chrome',
          location: 'Mumbai, India',
          ipAddress: '192.168.1.1',
          lastActive: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
          isCurrent: true,
        },
        {
          id: '2',
          deviceType: 'mobile',
          deviceName: 'iPhone 13',
          browser: 'Safari',
          location: 'Delhi, India',
          ipAddress: '192.168.1.2',
          lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          isCurrent: false,
        },
        {
          id: '3',
          deviceType: 'tablet',
          deviceName: 'iPad Pro',
          browser: 'Safari',
          location: 'Bangalore, India',
          ipAddress: '192.168.1.3',
          lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          isCurrent: false,
        },
      ];

      setSessions(mockSessions);
    } catch (error) {
      setError('Failed to load sessions');
      toast.error('Failed to load active sessions');
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
        // TODO: Implement API call to logout all sessions
        // await apiClient.post('/auth/sessions/logout-all');

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        toast.success('Logged out from all devices');
        logout();
      } else if (logoutConfirm.sessionId) {
        // TODO: Implement API call to logout specific session
        // await apiClient.post(`/auth/sessions/${logoutConfirm.sessionId}/logout`);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        setSessions(sessions.filter(s => s.id !== logoutConfirm.sessionId));
        toast.success('Logged out from device successfully');

        // If current session, redirect to login
        const session = sessions.find(s => s.id === logoutConfirm.sessionId);
        if (session?.isCurrent) {
          logout();
        }
      }
    } catch (error) {
      toast.error(logoutConfirm.isAll ? 'Failed to logout from all devices' : 'Failed to logout from device');
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-heading-xl text-gray-900 mb-2">Active Sessions</h1>
          <p className="text-body-md text-gray-600">
            Manage your active sessions and logout from devices
          </p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-md bg-error-50 border border-error-200 text-error-600 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-heading-md text-gray-900">Current Session</h2>
                <p className="text-body-sm text-gray-600 mt-1">
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
                    <div className={`flex-shrink-0 p-3 rounded-lg ${
                      session.isCurrent ? 'bg-gold-100 text-gold-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {getDeviceIcon(session.deviceType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-heading-sm text-gray-900">
                          {session.deviceName}
                        </h3>
                        {session.isCurrent && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gold-100 text-gold-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Current
                          </span>
                        )}
                      </div>
                      <div className="mt-2 space-y-1">
                        <p className="text-body-sm text-gray-600">
                          <span className="font-medium">Browser:</span> {session.browser}
                        </p>
                        <p className="text-body-sm text-gray-600">
                          <span className="font-medium">Location:</span> {session.location}
                        </p>
                        <p className="text-body-sm text-gray-600">
                          <span className="font-medium">IP Address:</span> {session.ipAddress}
                        </p>
                        <p className="text-body-sm text-gray-600">
                          <span className="font-medium">Last Active:</span> {formatLastActive(session.lastActive)}
                        </p>
                      </div>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <button
                      onClick={() => handleLogoutSession(session.id)}
                      className="ml-4 flex items-center px-3 py-2 text-sm font-medium text-error-600 hover:text-error-700 hover:bg-error-50 rounded-md transition-colors"
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
              <Monitor className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-heading-sm text-gray-900">No active sessions</h3>
              <p className="mt-2 text-body-sm text-gray-600">
                You don't have any active sessions at the moment.
              </p>
            </div>
          )}

          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-heading-sm text-gray-900">Logout from all devices</h3>
                <p className="text-body-sm text-gray-600 mt-1">
                  This will logout you from all devices including this one
                </p>
              </div>
              <button
                onClick={handleLogoutAll}
                className="ml-4 flex items-center px-4 py-2 text-sm font-medium text-white bg-error-600 hover:bg-error-700 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout All
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-info-50 border border-info-200 rounded-lg p-4">
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

