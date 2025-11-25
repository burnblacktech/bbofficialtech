// =====================================================
// NOTIFICATION COMPONENT
// =====================================================

import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { enterpriseLogger } from '../../utils/logger';

const NotificationComponent = ({ className = '' }) => {
  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearAll,
    removeNotification,
    getRecentNotifications,
    getUnreadNotifications,
    getConnectionStatus,
    reconnect,
  } = useNotificationContext();

  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const getNotificationIcon = (type) => {
    const icons = {
      'filing_status_update': '📄',
      'ticket_update': '🎫',
      'document_verification': '📁',
      'system_maintenance': '🔧',
      'payment_notification': '💳',
      'mfa_notification': '🔐',
      'admin_notification': '👑',
      'general_notification': '🔔',
    };
    return icons[type] || '🔔';
  };

  const getNotificationColor = (type) => {
    const colors = {
      'filing_status_update': 'blue',
      'ticket_update': 'orange',
      'document_verification': 'green',
      'system_maintenance': 'yellow',
      'payment_notification': 'purple',
      'mfa_notification': 'red',
      'admin_notification': 'purple',
      'general_notification': 'blue',
    };
    return colors[type] || 'blue';
  };

  const getNotificationTitle = (type) => {
    const titles = {
      'filing_status_update': 'Filing Update',
      'ticket_update': 'Ticket Update',
      'document_verification': 'Document Verification',
      'system_maintenance': 'System Maintenance',
      'payment_notification': 'Payment Notification',
      'mfa_notification': 'Security Alert',
      'admin_notification': 'Admin Notification',
      'general_notification': 'Notification',
    };
    return titles[type] || 'Notification';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
    setShowNotificationModal(true);

    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  const handleMarkAsRead = (notificationId) => {
    markAsRead(notificationId);
  };

  const handleRemoveNotification = (notificationId) => {
    removeNotification(notificationId);
  };

  const handleClearAll = () => {
    clearAll();
    setShowAllNotifications(false);
  };

  const handleReconnect = () => {
    reconnect();
  };

  const recentNotifications = getRecentNotifications(5);
  const unreadNotifications = getUnreadNotifications();

  return (
    <div className={`notification-component ${className}`}>
      {/* Notification Bell */}
      <div className="notification-bell">
        <Button
          variant="outline"
          size="small"
          onClick={() => setShowAllNotifications(!showAllNotifications)}
          className="bell-button"
        >
          🔔
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount}</span>
          )}
        </Button>

        {/* Connection Status */}
        <div className="connection-status">
          {isConnected ? (
            <StatusBadge status="Connected" color="green" size="small" />
          ) : (
            <StatusBadge status="Disconnected" color="red" size="small" />
          )}
        </div>
      </div>

      {/* Notification Dropdown */}
      {showAllNotifications && (
        <Card className="notification-dropdown">
          <div className="dropdown-header">
            <h3>Notifications</h3>
            <div className="dropdown-actions">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="small"
                  onClick={markAllAsRead}
                >
                  Mark All Read
                </Button>
              )}
              <Button
                variant="outline"
                size="small"
                onClick={handleClearAll}
              >
                Clear All
              </Button>
              {!isConnected && (
                <Button
                  variant="outline"
                  size="small"
                  onClick={handleReconnect}
                >
                  Reconnect
                </Button>
              )}
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="empty-notifications">
              <div className="empty-icon">🔔</div>
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="notification-list">
              {recentNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-header">
                      <h4>{getNotificationTitle(notification.type)}</h4>
                      <span className="notification-time">
                        {formatDate(notification.timestamp)}
                      </span>
                    </div>
                    <p className="notification-message">
                      {notification.data?.message || 'You have a new notification'}
                    </p>
                    {!notification.isRead && (
                      <div className="unread-indicator"></div>
                    )}
                  </div>
                  <div className="notification-actions">
                    {!notification.isRead && (
                      <Button
                        variant="outline"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                      >
                        ✓
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveNotification(notification.id);
                      }}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {notifications.length > 5 && (
            <div className="dropdown-footer">
              <Button
                variant="outline"
                size="small"
                onClick={() => setShowAllNotifications(false)}
              >
                View All ({notifications.length})
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Notification Detail Modal */}
      <Modal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        title="Notification Details"
        size="medium"
      >
        {selectedNotification && (
          <div className="notification-detail">
            <div className="notification-header">
              <div className="notification-icon-large">
                {getNotificationIcon(selectedNotification.type)}
              </div>
              <div className="notification-info">
                <h2>{getNotificationTitle(selectedNotification.type)}</h2>
                <p className="notification-timestamp">
                  {new Date(selectedNotification.timestamp).toLocaleString('en-IN')}
                </p>
                <StatusBadge
                  status={selectedNotification.type}
                  color={getNotificationColor(selectedNotification.type)}
                />
              </div>
            </div>

            <div className="notification-body">
              <h3>Message</h3>
              <p>{selectedNotification.data?.message || 'No message available'}</p>

              {selectedNotification.data && (
                <div className="notification-data">
                  <h3>Details</h3>
                  <pre>{JSON.stringify(selectedNotification.data, null, 2)}</pre>
                </div>
              )}
            </div>

            <div className="notification-actions">
              <Button
                variant="outline"
                onClick={() => setShowNotificationModal(false)}
              >
                Close
              </Button>
              {!selectedNotification.isRead && (
                <Button
                  variant="primary"
                  onClick={() => {
                    markAsRead(selectedNotification.id);
                    setShowNotificationModal(false);
                  }}
                >
                  Mark as Read
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default NotificationComponent;
