import React from 'react';

/**
 * ReassuranceBanner - S29 Priority Component
 * Reduces anxiety during sensitive steps (PAN, Submission).
 * Tone: Calm, authoritative, CA-like.
 */
const ReassuranceBanner = ({ message, type = 'info' }) => {
    const styles = {
        info: {
            bg: 'var(--s29-primary-light)',
            text: 'var(--s29-primary-dark)',
            border: 'var(--s29-primary)',
            icon: '🛡️',
        },
        success: {
            bg: 'var(--s29-success-light)',
            text: 'var(--s29-success)',
            border: 'var(--s29-success)',
            icon: '✅',
        },
    };

    const current = styles[type] || styles.info;

    return (
        <div
            className="reassurance-banner"
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                backgroundColor: current.bg,
                color: current.text,
                borderRadius: 'var(--s29-radius-main)',
                borderLeft: `4px solid ${current.border}`,
                fontSize: 'var(--s29-font-size-small)',
                lineHeight: 'var(--s29-line-height-body)',
                margin: '16px 0',
                animation: 'fadeIn 200ms ease-out',
            }}
        >
            <span style={{ marginRight: '12px', fontSize: '18px' }}>{current.icon}</span>
            <span>{message}</span>
        </div>
    );
};

export default ReassuranceBanner;
