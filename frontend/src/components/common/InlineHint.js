import React from 'react';

/**
 * InlineHint - S29 Component
 * Law-based or CA-like explanations without clutter.
 */
const InlineHint = ({ children, icon = '💡' }) => {
    return (
        <div
            className="inline-hint"
            style={{
                display: 'flex',
                gap: '8px',
                fontSize: 'var(--s29-font-size-xs)',
                color: 'var(--s29-text-muted)',
                marginTop: '6px',
                fontStyle: 'italic',
            }}
        >
            <span>{icon}</span>
            <span>{children}</span>
        </div>
    );
};

export default InlineHint;
