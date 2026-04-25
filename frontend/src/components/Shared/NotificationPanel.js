import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Shield,
  X,
} from 'lucide-react';
import { getNotifications, markAsRead, markAllAsRead } from '../../services/notificationService';

const TYPE_ICONS = {
  deadline: Calendar,
  expiry: AlertTriangle,
  filing_state: CheckCircle,
  security: Shield,
};

const TYPE_COLORS = {
  deadline: 'text-[var(--color-warning)]',
  expiry: 'text-[var(--color-error)]',
  filing_state: 'text-[var(--color-success)]',
  security: 'text-[var(--color-info)]',
};

function relativeTime(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/**
 * NotificationPanel — Dropdown notification list.
 *
 * Desktop: 360px dropdown. Mobile: full-width.
 * Reads from notificationService, uses React Query.
 *
 * @param {boolean} isOpen
 * @param {() => void} onClose
 */
export default function NotificationPanel({ isOpen, onClose }) {
  const panelRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => getNotifications(10),
    enabled: isOpen,
    staleTime: 30_000,
  });

  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markReadMutation.mutate(notification.id);
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
      onClose();
    }
  };

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 z-[55] w-full sm:w-[var(--notification-panel-width)] rounded-[var(--radius-lg)] border border-[var(--border-light)] bg-[var(--bg-card)] shadow-[0_10px_15px_rgba(0,0,0,0.10)]"
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
          role="region"
          aria-label="Notifications"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border-light)] px-4 py-3">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Notifications</h3>
            <div className="flex items-center gap-2">
              {hasUnread && (
                <button
                  type="button"
                  onClick={() => markAllMutation.mutate()}
                  disabled={markAllMutation.isPending}
                  className="text-xs font-medium text-[var(--brand-primary)] hover:underline disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"
                >
                  Mark all as read
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded p-1 text-[var(--text-light)] hover:bg-[var(--bg-muted)] focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"
                aria-label="Close notifications"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-xs text-[var(--text-muted)]">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Bell size={24} className="text-[var(--text-light)]" />
                <p className="text-sm font-medium text-[var(--text-muted)]">All caught up!</p>
                <p className="text-xs text-[var(--text-light)]">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const TypeIcon = TYPE_ICONS[n.type] || Bell;
                const typeColor = TYPE_COLORS[n.type] || 'text-[var(--text-muted)]';
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleNotificationClick(n)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--bg-muted)] ${
                      !n.isRead ? 'bg-[var(--brand-primary-light)]/30' : ''
                    }`}
                  >
                    <TypeIcon size={16} className={`mt-0.5 shrink-0 ${typeColor}`} />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm leading-snug ${
                          n.isRead ? 'text-[var(--text-muted)]' : 'text-[var(--text-primary)] font-medium'
                        }`}
                      >
                        {n.message}
                      </p>
                      <span className="mt-1 block text-xs text-[var(--text-light)]">
                        {relativeTime(n.createdAt)}
                      </span>
                    </div>
                    {!n.isRead && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--brand-primary)]" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
