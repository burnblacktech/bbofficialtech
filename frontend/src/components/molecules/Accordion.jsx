/**
 * Accordion - Expandable sections
 * For organizing content in collapsible panels
 */

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { tokens } from '../../styles/tokens';

const AccordionItem = ({ title, children, isOpen, onToggle }) => {
    return (
        <div style={{
            border: `1px solid ${tokens.colors.neutral[200]}`,
            borderRadius: tokens.borderRadius.md,
            marginBottom: tokens.spacing.sm,
            overflow: 'hidden',
        }}>
            {/* Header */}
            <button
                onClick={onToggle}
                style={{
                    width: '100%',
                    padding: tokens.spacing.md,
                    backgroundColor: isOpen ? tokens.colors.neutral[50] : tokens.colors.neutral.white,
                    border: 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                }}
            >
                <span style={{
                    fontSize: tokens.typography.fontSize.sm,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: tokens.colors.neutral[900],
                }}>
                    {title}
                </span>
                <ChevronDown
                    size={18}
                    color={tokens.colors.neutral[600]}
                    style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                    }}
                />
            </button>

            {/* Content */}
            {isOpen && (
                <div style={{
                    padding: tokens.spacing.md,
                    borderTop: `1px solid ${tokens.colors.neutral[200]}`,
                }}>
                    {children}
                </div>
            )}
        </div>
    );
};

const Accordion = ({ items, defaultOpen = 0 }) => {
    const [openIndex, setOpenIndex] = useState(defaultOpen);

    return (
        <div>
            {items.map((item, index) => (
                <AccordionItem
                    key={index}
                    title={item.title}
                    isOpen={openIndex === index}
                    onToggle={() => setOpenIndex(openIndex === index ? -1 : index)}
                >
                    {item.content}
                </AccordionItem>
            ))}
        </div>
    );
};

export default Accordion;
