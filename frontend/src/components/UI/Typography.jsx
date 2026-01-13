import React from 'react';
import PropTypes from 'prop-types';

/**
 * Typography Components - Standardized text following S29 design system
 */

export const Heading1 = ({ children, className = '', ...props }) => (
    <h1 className={`text-heading-1 text-slate-900 ${className}`} {...props}>
        {children}
    </h1>
);

Heading1.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
};

export const Heading2 = ({ children, className = '', ...props }) => (
    <h2 className={`text-heading-2 text-slate-900 ${className}`} {...props}>
        {children}
    </h2>
);

Heading2.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
};

export const Heading3 = ({ children, className = '', ...props }) => (
    <h3 className={`text-heading-3 text-slate-900 ${className}`} {...props}>
        {children}
    </h3>
);

Heading3.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
};

export const Heading4 = ({ children, className = '', ...props }) => (
    <h4 className={`text-heading-4 text-slate-900 ${className}`} {...props}>
        {children}
    </h4>
);

Heading4.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
};

export const Body = ({ children, className = '', muted = false, ...props }) => (
    <p className={`text-body-regular ${muted ? 'text-slate-500' : 'text-slate-700'} ${className}`} {...props}>
        {children}
    </p>
);

Body.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    muted: PropTypes.bool,
};

export const BodyLarge = ({ children, className = '', ...props }) => (
    <p className={`text-body-large text-slate-700 ${className}`} {...props}>
        {children}
    </p>
);

BodyLarge.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
};

export const BodySmall = ({ children, className = '', muted = false, ...props }) => (
    <p className={`text-body-small ${muted ? 'text-slate-500' : 'text-slate-600'} ${className}`} {...props}>
        {children}
    </p>
);

BodySmall.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    muted: PropTypes.bool,
};

export const Label = ({ children, className = '', ...props }) => (
    <span className={`text-label text-slate-600 ${className}`} {...props}>
        {children}
    </span>
);

Label.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
};

export const Amount = ({ children, className = '', ...props }) => (
    <span className={`text-amount text-slate-900 tabular-nums ${className}`} {...props}>
        {children}
    </span>
);

Amount.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
};
