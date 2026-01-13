// =====================================================
// MOBILE-FIRST NOTIFICATIONS PAGE
// Touch-friendly notification management for all devices
// =====================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  ArrowLeft,
  Check,
  X,
  Trash2,
  Settings,
  Filter,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle,
  Info,
  Clock,
  MoreVertical,
  MarkAsRead,
  MarkAsUnread,
  ChevronRight,
  FileText,
  User,
} from 'lucide-react';
import api from '../../services/api';

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch notifications
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', user?.user_id],
    queryFn: async () => {
      const response = await api.get('/notifications/user-notifications');
      return response.data;
    },
    enabled: !!user?.user_id,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  const notifications = notificationsData?.notifications || [];

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      const response = await api.patch(`/notifications/${notificationId}/read`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications', user?.user_id]);
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await api.patch('/notifications/mark-all-read');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications', user?.user_id]);
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId) => {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications', user?.user_id]);
    },
  });

  const handleMarkAsRead = (notificationId) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDeleteNotification = (notificationId) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      deleteNotificationMutation.mutate(notificationId);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-error-600" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
      default:
        return <Bell className="h-4 w-4 text-slate-600" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return 'border-l-success-500 bg-success-50';
      case 'warning':
        return 'border-l-warning-500 bg-warning-50';
      case 'error':
        return 'border-l-error-500 bg-error-50';
      case 'info':
        return 'border-l-burnblack-gold bg-burnblack-gold bg-opacity-10';
      default:
        return 'border-l-neutral-500 bg-neutral-50';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || notification.type === filterType;
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'read' && notification.is_read) ||
                         (filterStatus === 'unread' && !notification.is_read);

    return matchesSearch && matchesType && matchesStatus;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-burnblack-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="loading-spinner"></div>
          <p className="text-body-regular text-neutral-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-burnblack-white">
      {/* Mobile Header */}
      <header className="header-burnblack sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-xl hover:bg-neutral-100 active:scale-95 transition-transform"
              >
                <ArrowLeft className="h-5 w-5 text-burnblack-black" />
              </button>
              <div>
                <h1 className="text-heading-4 font-semibold text-burnblack-black">Notifications</h1>
                <p className="text-body-small text-neutral-500">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={markAllAsReadMutation.isPending}
                  className="btn-burnblack p-2 rounded-xl active:scale-95 transition-transform disabled:opacity-50"
                >
                  {markAllAsReadMutation.isPending ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </button>
              )}
              <button
                onClick={() => navigate('/settings')}
                className="p-2 rounded-xl hover:bg-neutral-100 active:scale-95 transition-transform"
              >
                <Settings className="h-5 w-5 text-burnblack-black" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4 space-y-4">
        {/* Search and Filters */}
        <div className="space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 active:scale-95 transition-transform"
          >
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-slate-600" />
              <span className="text-body-regular font-medium text-slate-900">Filters</span>
            </div>
            <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${showFilters ? 'rotate-90' : ''}`} />
          </button>

          {/* Filter Options */}
          {showFilters && (
            <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3">
              {/* Type Filter */}
              <div>
                <label className="text-body-small font-medium text-slate-700 mb-2 block">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl text-body-regular focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="info">Information</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-body-small font-medium text-slate-700 mb-2 block">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl text-body-regular focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="dashboard-card-burnblack p-8 text-center">
              <Bell className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-heading-4 font-semibold text-burnblack-black mb-2">No notifications</h3>
              <p className="text-body-regular text-neutral-500">
                {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                  ? 'No notifications match your filters'
                  : 'You\'re all caught up!'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`dashboard-card-burnblack border-l-4 ${getNotificationColor(notification.type)} ${
                  !notification.is_read ? 'shadow-elevation-1' : ''
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-sm font-semibold text-slate-900 ${!notification.is_read ? 'font-bold' : ''}`}>
                          {notification.title}
                        </h3>
                        <p className="text-body-regular text-slate-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center space-x-3 mt-2 text-body-small text-slate-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {new Date(notification.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {new Date(notification.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 ml-2">
                      {!notification.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-1 rounded hover:bg-slate-100 active:scale-95 transition-transform"
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4 text-slate-600" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotification(notification.id)}
                        className="p-1 rounded hover:bg-error-100 active:scale-95 transition-transform"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-error-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 md:hidden">
        <div className="flex justify-around">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex flex-col items-center p-2 text-slate-600 hover:text-blue-600"
          >
            <FileText className="h-5 w-5 mb-1" />
            <span className="text-body-small">Dashboard</span>
          </button>
          <button className="flex flex-col items-center p-2 text-blue-600">
            <Bell className="h-5 w-5 mb-1" />
            <span className="text-body-small font-medium">Notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-body-small rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center p-2 text-slate-600 hover:text-blue-600"
          >
            <User className="h-5 w-5 mb-1" />
            <span className="text-body-small">Profile</span>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="flex flex-col items-center p-2 text-slate-600 hover:text-blue-600"
          >
            <Settings className="h-5 w-5 mb-1" />
            <span className="text-body-small">Settings</span>
          </button>
        </div>
      </nav>

      {/* Bottom padding for mobile navigation */}
      <div className="h-20 md:hidden"></div>
    </div>
  );
};

export default Notifications;
