// Stub - DesignSystem main file
import React from 'react';
import AtomButton from '../atoms/Button';
import AtomCard from '../atoms/Card';
import AtomInput from '../atoms/Input';
import AtomBadge from '../atoms/Badge';

export const Button = AtomButton;
export const Input = AtomInput;
export const Card = AtomCard;
export const Badge = AtomBadge;

export const CardHeader = ({ children, className = '', ...props }) => (
    <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>{children}</div>
);

export const CardTitle = ({ children, className = '', ...props }) => (
    <h3 className={`text-xl font-semibold ${className}`} {...props}>{children}</h3>
);

export const CardContent = ({ children, className = '', ...props }) => (
    <div className={`p-6 pt-0 ${className}`} {...props}>{children}</div>
);

export const CardFooter = ({ children, className = '', ...props }) => (
    <div className={`flex items-center p-6 pt-0 ${className}`} {...props}>{children}</div>
);

export const Typography = {
    H1: ({ children, className = '', ...props }) => (
        <h1 className={`text-4xl font-bold ${className}`} {...props}>{children}</h1>
    ),
    H2: ({ children, className = '', ...props }) => (
        <h2 className={`text-3xl font-semibold ${className}`} {...props}>{children}</h2>
    ),
    Body: ({ children, className = '', ...props }) => (
        <p className={`text-base ${className}`} {...props}>{children}</p>
    ),
};

export const LoadingState = () => <div>Loading...</div>;
export const InlineLoader = () => <div>Loading...</div>;

export default {
    Button,
    Input,
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
    Badge,
    Typography,
};
