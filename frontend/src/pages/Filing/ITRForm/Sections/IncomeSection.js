/**
 * Income Section - Placeholder
 * To be fully implemented with income source details
 */

import { ArrowRight, ArrowLeft } from 'lucide-react';
import Card from '../../../../components/atoms/Card';
import Button from '../../../../components/atoms/Button';
import { tokens } from '../../../../styles/tokens';

const IncomeSection = ({ data, onUpdate, onNext, onBack, onComplete }) => {
    return (
        <div>
            <h1 style={{ fontSize: tokens.typography.fontSize['2xl'], fontWeight: tokens.typography.fontWeight.bold, marginBottom: tokens.spacing.xs }}>
                Income Details
            </h1>
            <p style={{ fontSize: tokens.typography.fontSize.base, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xl }}>
                Review and update your income from all sources
            </p>

            <Card padding="lg">
                <p style={{ color: tokens.colors.neutral[600] }}>
                    This section will display income from Salary, Business, House Property, and Other Sources.
                    Auto-populated from your Income module.
                </p>
            </Card>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: tokens.spacing.xl }}>
                <Button variant="secondary" onClick={onBack} icon={<ArrowLeft size={16} />}>
                    Back
                </Button>
                <Button variant="primary" onClick={() => { onComplete(); onNext(); }} icon={<ArrowRight size={16} />} iconPosition="right">
                    Continue
                </Button>
            </div>
        </div>
    );
};

export default IncomeSection;
