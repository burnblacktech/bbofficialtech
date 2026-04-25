/**
 * notificationService — API methods for in-app notification endpoints.
 */
import api from './api';

export async function getNotifications(limit = 10) {
  const res = await api.get('/notifications/in-app', { params: { limit } });
  return res.data.data;
}

export async function getUnreadCount() {
  const res = await api.get('/notifications/in-app/unread-count');
  return res.data.data;
}

export async function markAsRead(id) {
  const res = await api.patch(`/notifications/in-app/${id}/read`);
  return res.data.data;
}

export async function markAllAsRead() {
  const res = await api.patch('/notifications/in-app/mark-all-read');
  return res.data;
}
