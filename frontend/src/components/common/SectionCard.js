import React from 'react';

/**
 * SectionCard - S29 Pattern
 * "One Thought Per Screen" container.
 */
const SectionCard = ({ title, description, children, footer }) => {
    return (
        <div
            className="s29-section-card"
            style={{
                backgroundColor: 'var(--s29-bg-card)',
                borderRadius: 'var(--s29-radius-large)',
                border: '1px solid var(--s29-border-light)',
                boxShadow: 'var(--s29-shadow-mild)',
                padding: '32px',
                maxWidth: '600px',
                margin: '24px auto',
                animation: 'slideUp 250ms ease-out',
            }}
        >
            {title && (
                <h2 style={{
                    fontSize: 'var(--s29-font-size-h2)',
                    marginBottom: description ? '8px' : '24px',
                    fontWeight: '600',
                }}>
                    {title}
                </h2>
            )}
            {description && (
                <p style={{
                    color: 'var(--s29-text-muted)',
                    fontSize: 'var(--s29-font-size-body)',
                    marginBottom: '24px',
                }}>
                    {description}
                </p>
            )}
            <div className="card-content">
                {children}
            </div>
            {footer && (
                <div style={{
                    marginTop: '32px',
                    paddingTop: '24px',
                    borderTop: '1px solid var(--s29-border-light)',
                }}>
                    {footer}
                </div>
            )}
        </div>
    );
};

export default SectionCard;
