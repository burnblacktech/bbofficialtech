/**
 * CommandPalette — Cmd+K / Ctrl+K fuzzy search command palette.
 * Centered modal, 560px width, max-height 400px, auto-focused search.
 * Keyboard navigation: ↑/↓ to move, Enter to select, Esc to close.
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Home, TrendingUp, Receipt, PiggyBank, FolderOpen,
  Settings, Users, Activity, FileText, Upload, X,
} from 'lucide-react';

const ALL_ITEMS = [
  // Navigation
  { id: 'nav-dashboard', label: 'Dashboard', keywords: 'home overview', icon: Home, path: '/dashboard', group: 'Navigation' },
  { id: 'nav-income', label: 'Income Tracker', keywords: 'salary earnings', icon: TrendingUp, path: '/finance/income', group: 'Navigation' },
  { id: 'nav-expenses', label: 'Expense Tracker', keywords: 'deductions rent medical', icon: Receipt, path: '/finance/expenses', group: 'Navigation' },
  { id: 'nav-investments', label: 'Investment Logger', keywords: '80c nps elss ppf', icon: PiggyBank, path: '/finance/investments', group: 'Navigation' },
  { id: 'nav-vault', label: 'Document Vault', keywords: 'documents files upload', icon: FolderOpen, path: '/vault', group: 'Navigation' },
  { id: 'nav-settings', label: 'Settings', keywords: 'profile security sessions', icon: Settings, path: '/settings', group: 'Navigation' },
  { id: 'nav-family', label: 'Family', keywords: 'members pan', icon: Users, path: '/family', group: 'Navigation' },
  { id: 'nav-activity', label: 'Activity Log', keywords: 'audit trail events', icon: Activity, path: '/activity', group: 'Navigation' },
  // Actions
  { id: 'act-file', label: 'File ITR', keywords: 'start filing return', icon: FileText, path: '/filing/start', group: 'Actions' },
  { id: 'act-income', label: 'Log Income', keywords: 'add salary', icon: TrendingUp, path: '/finance/income', group: 'Actions' },
  { id: 'act-expense', label: 'Add Expense', keywords: 'record deduction', icon: Receipt, path: '/finance/expenses', group: 'Actions' },
  { id: 'act-invest', label: 'Log Investment', keywords: 'add 80c', icon: PiggyBank, path: '/finance/investments', group: 'Actions' },
  { id: 'act-upload', label: 'Upload Document', keywords: 'form16 receipt', icon: Upload, path: '/vault', group: 'Actions' },
];

function fuzzyMatch(text, query) {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  return lower.includes(q);
}

export default function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = useMemo(() => {
    if (!query.trim()) return ALL_ITEMS.slice(0, 8);
    return ALL_ITEMS.filter(
      (item) => fuzzyMatch(item.label, query) || fuzzyMatch(item.keywords, query),
    ).slice(0, 8);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSelect = useCallback(
    (item) => {
      onClose();
      navigate(item.path);
    },
    [navigate, onClose],
  );

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      handleSelect(filtered[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[100]"
            onClick={onClose}
          />
          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 z-[101] w-[90vw] max-w-[560px] rounded-xl overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border-light)' }}>
              <Search size={18} style={{ color: 'var(--text-muted)' }} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                onKeyDown={handleKeyDown}
                placeholder="Search pages and actions..."
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
              <button onClick={onClose} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[320px] overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  No results for &lsquo;{query}&rsquo;
                </div>
              ) : (
                filtered.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(i)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors"
                      style={{
                        backgroundColor: i === selectedIndex ? 'var(--bg-muted)' : 'transparent',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <Icon size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <span className="flex-1">{item.label}</span>
                      <span className="text-[10px] font-medium" style={{ color: 'var(--text-light)' }}>
                        {item.group}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer hints */}
            <div
              className="flex items-center gap-4 px-4 py-2 text-[10px]"
              style={{ borderTop: '1px solid var(--border-light)', color: 'var(--text-light)' }}
            >
              <span>↑↓ navigate</span>
              <span>↵ select</span>
              <span>esc close</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
