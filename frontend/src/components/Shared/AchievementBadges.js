/**
 * AchievementBadges — Horizontal scrollable row of achievement badges.
 * Earned badges are full-color, unearned are greyed with lock.
 */

import React from 'react';
import { Lock, FileText, FolderOpen, PiggyBank, Activity, Zap, CheckCircle } from 'lucide-react';

const BADGES = [
  { id: 'first-filing', label: 'First Filing', icon: FileText, tier: 'bronze', check: (d) => d.hasFilings },
  { id: 'document-pro', label: 'Document Pro', icon: FolderOpen, tier: 'silver', check: (d) => d.documentCount >= 5 },
  { id: 'tax-saver', label: 'Tax Saver', icon: PiggyBank, tier: 'gold', check: (d) => d.investmentTotal >= 150000 },
  { id: 'year-round', label: 'Year-Round Tracker', icon: Activity, tier: 'silver', check: (d) => d.streak >= 3 },
  { id: 'early-bird', label: 'Early Bird', icon: Zap, tier: 'bronze', check: (d) => d.filedBeforeDeadline },
  { id: 'fully-prepared', label: 'Fully Prepared', icon: CheckCircle, tier: 'gold', check: (d) => d.readiness >= 100 },
];

const TIER_COLORS = {
  bronze: { bg: '#CD7F32', text: '#fff' },
  silver: { bg: '#C0C0C0', text: '#333' },
  gold: { bg: '#D4AF37', text: '#fff' },
};

const LOCKED_STYLE = {
  bg: 'var(--bg-muted)',
  text: 'var(--text-light)',
};

export default function AchievementBadges({ userData = {} }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {BADGES.map((badge) => {
        const earned = badge.check(userData);
        const tier = TIER_COLORS[badge.tier];
        const Icon = badge.icon;

        return (
          <div
            key={badge.id}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0"
            style={{
              backgroundColor: earned ? tier.bg : LOCKED_STYLE.bg,
              color: earned ? tier.text : LOCKED_STYLE.text,
              opacity: earned ? 1 : 0.6,
            }}
            title={earned ? `${badge.label} — Earned!` : `${badge.label} — Locked`}
          >
            {earned ? (
              <Icon size={12} />
            ) : (
              <Lock size={10} />
            )}
            {badge.label}
          </div>
        );
      })}
    </div>
  );
}
