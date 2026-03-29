/**
 * ImportHistoryPanel — Compact, collapsible panel showing previous imports
 *
 * Fetches import history via GET /api/filings/:filingId/import/history.
 * Displays: document type icon/label, file name, relative timestamp, field count.
 * Confirmed imports have an "Undo" button (DELETE /api/filings/:filingId/import/:importId).
 * Undone imports shown with strikethrough/dimmed styling and "Undone" badge.
 * Empty state when no imports exist.
 *
 * Embedded in the Filing HUD sidebar as a collapsible panel.
 */

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronRight, FileText, FileJson, Clock, Undo2, Loader2, Inbox,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../../services/api';
import P from '../../../../styles/palette';

// ── Document type configs (matches ImportDocumentModal / ImportReviewScreen) ──
const DOC_CONFIG = {
  form16: { label: 'Form 16', icon: FileText, color: '#059669', bg: '#f0fdf4' },
  '26as': { label: '26AS', icon: FileJson, color: '#0D9488', bg: '#F0FDFA' },
  ais: { label: 'AIS', icon: FileJson, color: '#7c3aed', bg: '#f5f3ff' },
};

// ── Relative timestamp helper ──
function relativeTime(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;

  if (Number.isNaN(diffMs) || diffMs < 0) return dateStr;

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

// ── Single import row ──
function ImportRow({ item, filingId, onUndone }) {
  const [undoing, setUndoing] = useState(false);
  const isUndone = item.status === 'undone';
  const cfg = DOC_CONFIG[item.documentType] || DOC_CONFIG.form16;
  const Icon = cfg.icon;

  const handleUndo = useCallback(async (e) => {
    e.stopPropagation();
    setUndoing(true);
    try {
      await api.delete(`/filings/${filingId}/import/${item.importId}`);
      toast.success('Import undone successfully.');
      onUndone();
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to undo import.';
      toast.error(msg);
    } finally {
      setUndoing(false);
    }
  }, [filingId, item.importId, onUndone]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      style={{
        ...styles.row,
        opacity: isUndone ? 0.5 : 1,
      }}
    >
      {/* Icon */}
      <div style={{ ...styles.iconWrap, background: cfg.bg }}>
        <Icon size={14} style={{ color: cfg.color }} />
      </div>

      {/* Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={styles.rowTop}>
          <span style={{
            ...styles.docLabel,
            color: cfg.color,
            textDecoration: isUndone ? 'line-through' : 'none',
          }}>
            {cfg.label}
          </span>
          {isUndone && (
            <span style={styles.undoneBadge}>Undone</span>
          )}
        </div>
        <div style={{
          ...styles.fileName,
          textDecoration: isUndone ? 'line-through' : 'none',
        }}>
          {item.fileName || 'Unknown file'}
        </div>
        <div style={styles.meta}>
          <Clock size={10} style={{ color: P.textLight, flexShrink: 0 }} />
          <span>{relativeTime(item.importedAt)}</span>
          <span style={styles.metaDot}>·</span>
          <span>{item.fieldCount} field{item.fieldCount !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Undo button (only for confirmed imports) */}
      {!isUndone && (
        <button
          style={styles.undoBtn}
          onClick={handleUndo}
          disabled={undoing}
          title="Undo this import"
        >
          {undoing ? (
            <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} />
          ) : (
            <Undo2 size={12} />
          )}
        </button>
      )}
    </motion.div>
  );
}

// ── Main panel ──
export default function ImportHistoryPanel({ filingId }) {
  const [collapsed, setCollapsed] = useState(false);
  const queryClient = useQueryClient();

  const { data: history = [], isLoading, isError } = useQuery({
    queryKey: ['importHistory', filingId],
    queryFn: async () => {
      const res = await api.get(`/filings/${filingId}/import/history`);
      return res.data;
    },
    enabled: !!filingId,
    staleTime: 30_000,
  });

  const handleUndone = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['importHistory', filingId] });
    queryClient.invalidateQueries({ queryKey: ['filing', filingId] });
  }, [queryClient, filingId]);

  const hasImports = history.length > 0;

  return (
    <div style={styles.panel}>
      {/* Header — always visible */}
      <button
        style={styles.header}
        onClick={() => setCollapsed((c) => !c)}
      >
        <span style={styles.headerTitle}>Import History</span>
        {hasImports && (
          <span style={styles.headerCount}>{history.length}</span>
        )}
        {collapsed
          ? <ChevronRight size={14} style={{ color: P.textLight }} />
          : <ChevronDown size={14} style={{ color: P.textLight }} />}
      </button>

      {/* Body — collapsible */}
      {!collapsed && (
        <div style={styles.body}>
          {isLoading && (
            <div style={styles.loadingState}>
              <Loader2 size={16} style={{ color: P.textLight, animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: 12, color: P.textMuted }}>Loading history…</span>
            </div>
          )}

          {isError && (
            <div style={styles.emptyState}>
              <span style={{ fontSize: 12, color: P.error }}>Failed to load import history.</span>
            </div>
          )}

          {!isLoading && !isError && !hasImports && (
            <div style={styles.emptyState}>
              <Inbox size={20} style={{ color: P.textLight }} />
              <span style={{ fontSize: 12, color: P.textMuted, marginTop: 4 }}>
                No documents imported yet.
              </span>
            </div>
          )}

          {!isLoading && !isError && hasImports && (
            <AnimatePresence>
              {history.map((item) => (
                <ImportRow
                  key={item.importId}
                  item={item}
                  filingId={filingId}
                  onUndone={handleUndone}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      )}
    </div>
  );
}

// ── Styles ──
const styles = {
  panel: {
    border: `1px solid ${P.borderLight}`,
    borderRadius: 10,
    overflow: 'hidden',
    background: P.bgCard,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '10px 14px',
    background: P.bgMuted,
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    minHeight: 'auto',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: P.textPrimary,
    flex: 1,
  },
  headerCount: {
    fontSize: 11,
    fontWeight: 600,
    color: P.textMuted,
    background: P.bgCard,
    border: `1px solid ${P.borderLight}`,
    padding: '1px 7px',
    borderRadius: 10,
  },
  body: {
    padding: '4px 0',
  },
  row: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '10px 14px',
    borderBottom: `1px solid ${P.borderLight}`,
    transition: 'opacity 0.15s',
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 7,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  rowTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 1,
  },
  docLabel: {
    fontSize: 12,
    fontWeight: 700,
  },
  undoneBadge: {
    fontSize: 9,
    fontWeight: 700,
    color: P.textMuted,
    background: P.bgMuted,
    border: `1px solid ${P.borderLight}`,
    padding: '1px 6px',
    borderRadius: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  fileName: {
    fontSize: 12,
    color: P.textSecondary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 180,
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 11,
    color: P.textLight,
    marginTop: 3,
  },
  metaDot: {
    color: P.borderMedium,
  },
  undoBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 26,
    height: 26,
    borderRadius: 6,
    border: `1px solid ${P.borderLight}`,
    background: P.bgCard,
    cursor: 'pointer',
    color: P.textMuted,
    flexShrink: 0,
    marginTop: 2,
    transition: 'border-color 0.15s, color 0.15s',
    minHeight: 'auto',
    minWidth: 'auto',
    padding: 0,
  },
  loadingState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '20px 14px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px 14px',
    textAlign: 'center',
  },
};
