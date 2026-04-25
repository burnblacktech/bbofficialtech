/**
 * OfflineBanner — Shows below Header when offline.
 * Reconnection flash auto-dismisses after 2s.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';
import useNetworkStatus from '../../hooks/useNetworkStatus';

export default function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
    } else if (wasOffline.current) {
      wasOffline.current = false;
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  const showBanner = !isOnline || showReconnected;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed left-0 right-0 z-[45] flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium"
          style={{ top: '56px' }}
        >
          {!isOnline ? (
            <div
              className="flex items-center gap-2 rounded-lg px-4 py-2 w-full max-w-lg"
              style={{
                backgroundColor: 'var(--color-warning-bg)',
                border: '1px solid var(--color-warning-border)',
                color: 'var(--color-warning)',
              }}
            >
              <WifiOff size={14} className="shrink-0" />
              <span>You&apos;re offline. Changes will sync when you&apos;re back online.</span>
            </div>
          ) : (
            <div
              className="flex items-center gap-2 rounded-lg px-4 py-2 w-full max-w-lg"
              style={{
                backgroundColor: 'var(--color-success-bg)',
                border: '1px solid var(--color-success-border)',
                color: 'var(--color-success)',
              }}
            >
              <Wifi size={14} className="shrink-0" />
              <span>Back online! Syncing your changes...</span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
