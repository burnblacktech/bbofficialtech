// =====================================================
// NOTIFICATION LIST COMPONENT
// Displays list of notifications
// =====================================================

import React from 'react';
import { CheckCircle, X, Trash2, FileText, AlertCircle, DollarSign, Calendar, Info, Clock, Bell } from 'lucide-react';

// Helper function to format time ago
const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString('en-IN');
};

const NotificationList = ({
  notifications,
  onMarkAsRead,
  onMarkAsUnread,
  onDelete,
  onClick,
}) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'filing_update':
        return FileText;
      case 'document_request':
        return FileText;
      case 'deadline_reminder':
        return Calendar;
      case 'refund_update':
        return DollarSign;
      case 'system_announcement':
        return Info;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'filing_update':
        return 'bg-blue-50 border-blue-200';
      case 'document_request':
        return 'bg-warning-50 border-warning-200';
      case 'deadline_reminder':
        return 'bg-error-50 border-error-200';
      case 'refund_update':
        return 'bg-success-50 border-success-200';
      case 'system_announcement':
        return 'bg-info-50 border-info-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="space-y-3">
      {notifications.map((notification) => {
        const Icon = getNotificationIcon(notification.type);
        const isUnread = !notification.read;
        const timeAgo = formatTimeAgo(notification.createdAt);

        return (
          <div
            key={notification.id}
            className={`bg-white rounded-xl border-2 p-4 transition-all hover:shadow-elevation-2 cursor-pointer ${
              isUnread ? 'border-gold-300 bg-gold-50' : 'border-slate-200'
            } ${getNotificationColor(notification.type)}`}
            onClick={() => onClick && onClick(notification)}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={`p-2 rounded-xl ${
                isUnread ? 'bg-gold-100' : 'bg-slate-100'
              }`}>
                <Icon className={`h-5 w-5 ${
                  isUnread ? 'text-gold-600' : 'text-slate-600'
                }`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className={`text-heading-sm font-semibold mb-1 ${
                      isUnread ? 'text-slate-900' : 'text-slate-700'
                    }`}>
                      {notification.title}
                    </h4>
                    <p className="text-body-sm text-slate-600 mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 text-body-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      <span>{timeAgo}</span>
                    </div>
                  </div>

                  {/* Unread Badge */}
                  {isUnread && (
                    <div className="w-2 h-2 bg-gold-500 rounded-full flex-shrink-0 mt-1"></div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {isUnread ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsRead(notification.id);
                    }}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
                    title="Mark as read"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsUnread(notification.id);
                    }}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
                    title="Mark as unread"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(notification.id);
                  }}
                  className="p-2 text-slate-400 hover:text-error-600 rounded-xl hover:bg-error-50"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NotificationList;

