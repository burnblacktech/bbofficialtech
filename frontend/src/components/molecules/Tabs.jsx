/**
 * Tabs - Tab navigation component
 * For switching between different views/sections
 */

import React from 'react';
import { tokens } from '../../styles/tokens';

const Tabs = ({ tabs, activeTab, onChange }) => {
    return (
        <div style={{
            display: 'flex',
            gap: tokens.spacing.xs,
            borderBottom: `2px solid ${tokens.colors.neutral[200]}`,
            marginBottom: tokens.spacing.md,
        }}>
            {tabs.map((tab) => {
                const isActive = tab.id === activeTab;

                return (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        style={{
                            padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderBottom: `2px solid ${isActive ? tokens.colors.accent[600] : 'transparent'}`,
                            marginBottom: '-2px',
                            cursor: 'pointer',
                            fontSize: tokens.typography.fontSize.sm,
                            fontWeight: isActive ? tokens.typography.fontWeight.semibold : tokens.typography.fontWeight.medium,
                            color: isActive ? tokens.colors.accent[600] : tokens.colors.neutral[600],
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
};

export default Tabs;
