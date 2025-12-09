// =====================================================
// NOTIFICATIONS CENTER PAGE
// View and manage all notifications
// =====================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Filter, CheckCircle, Trash2, X, FileText, AlertCircle, DollarSign, Calendar, Info } from 'lucide-react';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAsUnread,
  useMarkAllAsRead,
  useDeleteNotification,
  useDeleteAllNotifications,
} from '../../features/notifications/hooks/use-notifications';
import NotificationList from '../../components/Notifications/NotificationList';
import NotificationFilters from '../../components/Notifications/NotificationFilters';
import { ConfirmationDialog } from '../../components/UI/ConfirmationDialog';
import toast from 'react-hot-toast';

const NotificationsCenter = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    type: 'all',
    read: 'all', // 'all', 'read', 'unread'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
  });
  const [showMarkAllReadDialog, setShowMarkAllReadDialog] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);

  const { data: notificationsData, isLoading } = useNotifications(filters, pagination);
  const markAsReadMutation = useMarkAsRead();
  const markAsUnreadMutation = useMarkAsUnread();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteNotificationMutation = useDeleteNotification();
  const deleteAllNotificationsMutation = useDeleteAllNotifications();

  const notifications = notificationsData?.data?.notifications || [];
  const paginationInfo = notificationsData?.data?.pagination || {};

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleMarkAsRead = (notificationId) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAsUnread = (notificationId) => {
    markAsUnreadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    setShowMarkAllReadDialog(true);
  };

  const confirmMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
    setShowMarkAllReadDialog(false);
  };

  const handleDelete = (notificationId) => {
    deleteNotificationMutation.mutate(notificationId);
  };

  const handleDeleteAll = () => {
    setShowDeleteAllDialog(true);
  };

  const confirmDeleteAll = () => {
    deleteAllNotificationsMutation.mutate();
    setShowDeleteAllDialog(false);
  };

  const handleNotificationClick = (notification) => {
    // Mark as read when clicked
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }

    // Navigate to relevant page if actionUrl exists
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Bell className="h-8 w-8 text-gold-600" />
                <h1 className="text-display-md text-gray-900 font-bold">Notifications</h1>
              </div>
              <p className="text-body-lg text-gray-600">
                Stay updated with your ITR filing status and important updates
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending || notifications.length === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-body-sm font-medium"
              >
                <CheckCircle className="h-4 w-4" />
                Mark All Read
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={deleteAllNotificationsMutation.isPending || notifications.length === 0}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-body-sm font-medium"
              >
                <Trash2 className="h-4 w-4" />
                Delete All
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <NotificationFilters
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        {/* Notifications List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
            <p className="text-body-md text-gray-600">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-heading-md text-gray-900 mb-2">No Notifications</h3>
            <p className="text-body-md text-gray-600">
              {filters.read === 'unread'
                ? 'You have no unread notifications'
                : 'You\'re all caught up! No notifications to display.'}
            </p>
          </div>
        ) : (
          <>
            <NotificationList
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onMarkAsUnread={handleMarkAsUnread}
              onDelete={handleDelete}
              onClick={handleNotificationClick}
            />

            {/* Pagination */}
            {paginationInfo.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-body-sm text-gray-600">
                  Page {pagination.page} of {paginationInfo.totalPages}
                </span>
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= paginationInfo.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Confirmation Dialogs */}
        <ConfirmationDialog
          isOpen={showMarkAllReadDialog}
          onClose={() => setShowMarkAllReadDialog(false)}
          onConfirm={confirmMarkAllAsRead}
          title="Mark All as Read"
          message="Are you sure you want to mark all notifications as read?"
          confirmLabel="Mark All Read"
          cancelLabel="Cancel"
          variant="info"
        />

        <ConfirmationDialog
          isOpen={showDeleteAllDialog}
          onClose={() => setShowDeleteAllDialog(false)}
          onConfirm={confirmDeleteAll}
          title="Delete All Notifications"
          message="Are you sure you want to delete all notifications? This action cannot be undone."
          confirmLabel="Delete All"
          cancelLabel="Cancel"
          variant="destructive"
          icon={Trash2}
        />
      </div>
    </div>
  );
};

export default NotificationsCenter;

