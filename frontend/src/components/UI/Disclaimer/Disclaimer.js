// =====================================================
// DISCLAIMER COMPONENT
// Legal disclaimers display
// Per UI.md specifications (lines 8031-8046)
// =====================================================

import React from 'react';
import { Info } from 'lucide-react';
import { cn } from '../../../utils';

/**
 * Disclaimer Component
 * Displays legal disclaimers with info icon
 */
export const Disclaimer = ({
  text,
  link,
  className = '',
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-slate-50 rounded-xl p-3 flex items-start gap-3',
        className,
      )}
      {...props}
    >
      <Info className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" style={{ width: '16px', height: '16px' }} />
      <div className="flex-1">
        <p
          className="text-body-sm text-slate-600"
          style={{ fontSize: '13px', lineHeight: '20px' }}
        >
          <span className="font-medium" style={{ fontWeight: 500 }}>Disclaimer:</span> {text}
        </p>
        {link && (
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-body-sm font-medium text-gold-500 hover:text-gold-600 transition-colors mt-2"
            style={{ fontSize: '13px' }}
          >
            {link.label}
            <span aria-hidden>→</span>
          </a>
        )}
      </div>
    </div>
  );
};

export default Disclaimer;

