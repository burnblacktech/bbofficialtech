import React from 'react';
import PropTypes from 'prop-types';

/**
 * Card Component - Standardized card following S29 design system
 *
 * @param {React.ReactNode} children - Card content
 * @param {boolean} hover - Enable hover lift effect
 * @param {boolean} clickable - Make card clickable (adds cursor pointer)
 * @param {string} padding - Padding size (none, sm, md, lg)
 * @param {function} onClick - Click handler
 */
export const Card = ({
    children,
    hover = false,
    clickable = false,
    padding = 'md',
    className = '',
    onClick,
    ...props
}) => {
    const baseClasses = 'bg-white rounded-xl border border-slate-200 shadow-sm transition-all';

    const hoverClasses = hover || clickable ? 'hover:shadow-md hover:-translate-y-0.5' : '';
    const clickableClasses = clickable || onClick ? 'cursor-pointer' : '';

    const paddingClasses = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    return (
        <div
            className={`${baseClasses} ${hoverClasses} ${clickableClasses} ${paddingClasses[padding]} ${className}`}
            onClick={onClick}
            {...props}
        >
            {children}
        </div>
    );
};

Card.propTypes = {
    children: PropTypes.node.isRequired,
    hover: PropTypes.bool,
    clickable: PropTypes.bool,
    padding: PropTypes.oneOf(['none', 'sm', 'md', 'lg']),
    className: PropTypes.string,
    onClick: PropTypes.func,
};

/**
 * CardHeader Component - Card header section
 */
export const CardHeader = ({ children, className = '', ...props }) => (
    <div className={`mb-4 ${className}`} {...props}>
        {children}
    </div>
);

CardHeader.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
};

/**
 * CardTitle Component - Card title section
 */
export const CardTitle = ({ children, className = '', ...props }) => (
    <h3 className={`text-lg font-bold text-slate-900 ${className}`} {...props}>
        {children}
    </h3>
);

CardTitle.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
};

/**
 * CardBody Component - Card body section
 */
export const CardBody = ({ children, className = '', ...props }) => (
    <div className={className} {...props}>
        {children}
    </div>
);

CardBody.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
};

/**
 * CardContent Component - Alias for CardBody
 */
export const CardContent = CardBody;

/**
 * CardFooter Component - Card footer section
 */
export const CardFooter = ({ children, className = '', ...props }) => (
    <div className={`mt-4 pt-4 border-t border-slate-200 ${className}`} {...props}>
        {children}
    </div>
);

CardFooter.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
};
