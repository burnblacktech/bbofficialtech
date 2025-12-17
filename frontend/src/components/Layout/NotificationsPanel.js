// =====================================================
// NOTIFICATIONS PANEL - DROPDOWN NOTIFICATIONS
// Clean dropdown panel showing recent notifications
// =====================================================

import React from 'react';
import { Bell, CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const NotificationsPanel = () => {
  // Mock notifications - in real app, this would come from API/context
  const notifications = [
    {
      id: 1,
      type: 'success',
      title: 'ITR Filed Successfully',
      message: 'Your ITR for AY 2024-25 has been filed successfully.',
      time: '2 hours ago',
      read: false,
    },
    {
      id: 2,
      type: 'info',
      title: 'Document Uploaded',
      message: 'Form 16 has been uploaded and processed.',
      time: '5 hours ago',
      read: false,
    },
    {
      id: 3,
      type: 'warning',
      title: 'Action Required',
      message: 'Please verify your PAN details.',
      time: '1 day ago',
      read: true,
    },
  ];

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Info className="h-5 w-5 text-info-500" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-elevation-3 border border-slate-200 z-50 max-h-96 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-info-50 text-info-600 text-body-small font-medium rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <button className="text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto flex-1">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-body-regular text-slate-500">No notifications</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer ${
                  !notification.read ? 'bg-info-50' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-regular font-medium text-slate-900">
                      {notification.title}
                    </p>
                    <p className="text-body-regular text-slate-600 mt-0.5">
                      {notification.message}
                    </p>
                    <p className="text-body-small text-slate-500 mt-1">{notification.time}</p>
                  </div>
                  {!notification.read && (
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-gold-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
          <button className="w-full text-body-regular text-gold-600 hover:text-gold-700 font-medium">
            View All Notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsPanel;

