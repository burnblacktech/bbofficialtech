import React from 'react';

/**
 * ActionCard — Quick action button card for the dashboard.
 *
 * @param {string} label - Action label (e.g., "File ITR")
 * @param {string} [description] - Optional description
 * @param {import('lucide-react').LucideIcon} icon - Lucide icon component
 * @param {string} iconColor - CSS color for the icon
 * @param {string} bgColor - Light tint background color
 * @param {() => void} onClick - Click handler
 */
export default function ActionCard({ label, description, icon: Icon, iconColor, bgColor, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border-light)] bg-[var(--bg-card)] p-4 text-left transition-all hover:shadow-[var(--shadow-md)] hover:border-[var(--border-medium)] focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)] focus-visible:outline-offset-2 w-full"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)]"
        style={{ backgroundColor: bgColor }}
      >
        <Icon size={20} style={{ color: iconColor }} />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-[var(--text-primary)]">{label}</div>
        {description && (
          <div className="text-xs text-[var(--text-muted)] truncate">{description}</div>
        )}
      </div>
    </button>
  );
}
