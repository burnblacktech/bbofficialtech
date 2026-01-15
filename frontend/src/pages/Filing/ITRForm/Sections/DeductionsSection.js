/**
 * Deductions Section - Placeholder
 */

import { ArrowRight, ArrowLeft } from 'lucide-react';
import Card from '../../../../components/atoms/Card';
import Button from '../../../../components/atoms/Button';
import { tokens } from '../../../../styles/tokens';

const DeductionsSection = ({ data, onUpdate, onNext, onBack, onComplete }) => {
    return (
        <div>
            <h1 style={{ fontSize: tokens.typography.fontSize['2xl'], fontWeight: tokens.typography.fontWeight.bold, marginBottom: tokens.spacing.xs }}>
                Deductions
            </h1>
            <p style={{ fontSize: tokens.typography.fontSize.base, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xl }}>
                Claim deductions under various sections
            </p>

            <Card padding="lg">
                <p style={{ color: tokens.colors.neutral[600] }}>
                    Sections: 80C, 80D, 80G, HRA, Home Loan Interest. Auto-populated from Deductions module.
                </p>
            </Card>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: tokens.spacing.xl }}>
                <Button variant="secondary" onClick={onBack} icon={<ArrowLeft size={16} />}>Back</Button>
                <Button variant="primary" onClick={() => { onComplete(); onNext(); }} icon={<ArrowRight size={16} />} iconPosition="right">Continue</Button>
            </div>
        </div>
    );
};

export default DeductionsSection;
