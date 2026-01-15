/**
 * Icon Component (Atom)
 * Wrapper for lucide-react icons with consistent sizing
 */

import React from 'react';
import { tokens } from '../../styles/tokens';

const Icon = ({
    icon: IconComponent,
    size = 'md',
    color,
    className = '',
    ...props
}) => {
    const sizes = {
        xs: 12,
        sm: 16,
        md: 20,
        lg: 24,
        xl: 32,
        '2xl': 40,
    };

    const iconSize = sizes[size];

    const baseStyles = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: color || 'currentColor',
    };

    return (
        <span style={baseStyles} className={className} {...props}>
            <IconComponent size={iconSize} />
        </span>
    );
};

export default Icon;
