/**
 * KeyboardShortcutsHelp — Modal triggered by pressing `?` key.
 * Displays all keyboard shortcuts categorized.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const SHORTCUT_GROUPS = [
  {
    label: 'General',
    shortcuts: [
      { keys: ['Cmd', 'K'], description: 'Open command palette' },
      { keys: ['Esc'], description: 'Close modals / panels' },
      { keys: ['?'], description: 'Show this help' },
    ],
  },
  {
    label: 'Navigation (G then ...)',
    shortcuts: [
      { keys: ['G', 'D'], description: 'Go to Dashboard' },
      { keys: ['G', 'I'], description: 'Go to Income' },
      { keys: ['G', 'E'], description: 'Go to Expenses' },
      { keys: ['G', 'V'], description: 'Go to Vault' },
      { keys: ['G', 'S'], description: 'Go to Settings' },
    ],
  },
  {
    label: 'Tracker Pages',
    shortcuts: [
      { keys: ['N'], description: 'New entry' },
    ],
  },
];

export default function KeyboardShortcutsHelp({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[100]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 z-[101] w-[90vw] max-w-[400px] rounded-xl overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--border-light)' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Keyboard Shortcuts
              </h2>
              <button onClick={onClose} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {SHORTCUT_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="text-[11px] font-semibold uppercase mb-2" style={{ color: 'var(--text-light)' }}>
                    {group.label}
                  </p>
                  <div className="space-y-1.5">
                    {group.shortcuts.map((s) => (
                      <div key={s.description} className="flex items-center justify-between text-xs">
                        <span style={{ color: 'var(--text-secondary)' }}>{s.description}</span>
                        <div className="flex items-center gap-1">
                          {s.keys.map((k) => (
                            <kbd
                              key={k}
                              className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium"
                              style={{
                                backgroundColor: 'var(--bg-muted)',
                                border: '1px solid var(--border-light)',
                                color: 'var(--text-secondary)',
                                minWidth: '22px',
                              }}
                            >
                              {k}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
