/**
 * Tax Computation Section - Placeholder
 */

import { ArrowRight, ArrowLeft } from 'lucide-react';
import Card from '../../../../components/atoms/Card';
import Button from '../../../../components/atoms/Button';
import { tokens } from '../../../../styles/tokens';

const TaxComputationSection = ({ data, onUpdate, onNext, onBack, onComplete }) => {
    return (
        <div>
            <h1 style={{ fontSize: tokens.typography.fontSize['2xl'], fontWeight: tokens.typography.fontWeight.bold, marginBottom: tokens.spacing.xs }}>
                Tax Computation
            </h1>
            <p style={{ fontSize: tokens.typography.fontSize.base, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xl }}>
                Review your tax calculation
            </p>

            <Card padding="lg">
                <p style={{ color: tokens.colors.neutral[600] }}>
                    Tax calculation based on selected regime. Shows TDS, advance tax, refund/payable amount.
                </p>
            </Card>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: tokens.spacing.xl }}>
                <Button variant="secondary" onClick={onBack} icon={<ArrowLeft size={16} />}>Back</Button>
                <Button variant="primary" onClick={() => { onComplete(); onNext(); }} icon={<ArrowRight size={16} />} iconPosition="right">Continue</Button>
            </div>
        </div>
    );
};

export default TaxComputationSection;
