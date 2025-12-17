// =====================================================
// NOTIFICATION BADGE COMPONENT
// Badge showing unread notification count
// =====================================================

import React from 'react';
import { Bell } from 'lucide-react';
import { useUnreadNotificationCount } from '../../features/notifications/hooks/use-notifications';
import { useNavigate } from 'react-router-dom';

const NotificationBadge = ({ className = '' }) => {
  const navigate = useNavigate();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();

  if (unreadCount === 0) {
    return (
      <button
        onClick={() => navigate('/notifications')}
        className={`relative p-2 text-slate-600 hover:text-slate-900 ${className}`}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
      </button>
    );
  }

  return (
    <button
      onClick={() => navigate('/notifications')}
      className={`relative p-2 text-slate-600 hover:text-slate-900 ${className}`}
      aria-label={`${unreadCount} unread notifications`}
    >
      <Bell className="h-5 w-5" />
      <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-gold-500 text-white text-body-xs font-bold">
        {unreadCount > 99 ? '99+' : unreadCount}
      </span>
    </button>
  );
};

export default NotificationBadge;

