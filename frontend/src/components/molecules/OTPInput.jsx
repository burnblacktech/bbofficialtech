/**
 * OTPInput Component (Molecule)
 * 6-digit OTP input with auto-focus and paste support
 */

import React, { useRef, useState, useEffect } from 'react';
import { tokens } from '../../styles/tokens';

const OTPInput = ({
    length = 6,
    value = '',
    onChange,
    onComplete,
    error = false,
    disabled = false,
}) => {
    const [otp, setOtp] = useState(Array(length).fill(''));
    const inputRefs = useRef([]);

    // Initialize refs
    useEffect(() => {
        inputRefs.current = inputRefs.current.slice(0, length);
    }, [length]);

    // Update internal state when value prop changes
    useEffect(() => {
        if (value) {
            const otpArray = value.split('').slice(0, length);
            setOtp([...otpArray, ...Array(length - otpArray.length).fill('')]);
        }
    }, [value, length]);

    const handleChange = (index, newValue) => {
        // Only allow digits
        if (!/^\d*$/.test(newValue)) return;

        const newOtp = [...otp];
        newOtp[index] = newValue.slice(-1); // Take only last character
        setOtp(newOtp);

        const otpString = newOtp.join('');
        onChange?.(otpString);

        // Auto-focus next input
        if (newValue && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Call onComplete when all digits are filled
        if (otpString.length === length && !otpString.includes('')) {
            onComplete?.(otpString);
        }
    };

    const handleKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }

        // Handle arrow keys
        if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowRight' && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, length);

        if (!/^\d+$/.test(pastedData)) return;

        const newOtp = pastedData.split('');
        while (newOtp.length < length) {
            newOtp.push('');
        }

        setOtp(newOtp);
        onChange?.(pastedData);

        // Focus last filled input or first empty
        const focusIndex = Math.min(pastedData.length, length - 1);
        inputRefs.current[focusIndex]?.focus();

        if (pastedData.length === length) {
            onComplete?.(pastedData);
        }
    };

    const inputStyles = (index) => ({
        width: '48px',
        height: '56px',
        fontSize: tokens.typography.fontSize['2xl'],
        fontWeight: tokens.typography.fontWeight.semibold,
        fontFamily: tokens.typography.fontFamily.mono,
        textAlign: 'center',
        border: `2px solid ${error ? tokens.colors.error[600] : tokens.colors.neutral[300]}`,
        borderRadius: tokens.borderRadius.lg,
        backgroundColor: disabled ? tokens.colors.neutral[50] : tokens.colors.neutral.white,
        color: tokens.colors.neutral[900],
        outline: 'none',
        transition: tokens.transitions.base,
        cursor: disabled ? 'not-allowed' : 'text',
    });

    const focusStyles = {
        borderColor: tokens.colors.accent[600],
        boxShadow: `0 0 0 3px ${tokens.colors.accent[300]}`,
    };

    return (
        <div
            style={{
                display: 'flex',
                gap: tokens.spacing.sm,
                justifyContent: 'center',
            }}
        >
            {otp.map((digit, index) => (
                <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    onFocus={(e) => e.target.select()}
                    disabled={disabled}
                    style={inputStyles(index)}
                    onFocusCapture={(e) => {
                        e.target.style.borderColor = tokens.colors.accent[600];
                        e.target.style.boxShadow = focusStyles.boxShadow;
                    }}
                    onBlurCapture={(e) => {
                        e.target.style.borderColor = error ? tokens.colors.error[600] : tokens.colors.neutral[300];
                        e.target.style.boxShadow = 'none';
                    }}
                />
            ))}
        </div>
    );
};

export default OTPInput;
