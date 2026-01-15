/**
 * Review & Submit Section - Placeholder
 */

import { ArrowLeft, Send } from 'lucide-react';
import Card from '../../../../components/atoms/Card';
import Button from '../../../../components/atoms/Button';
import { tokens } from '../../../../styles/tokens';

const ReviewSubmitSection = ({ data, onUpdate, onBack, onComplete }) => {
    return (
        <div>
            <h1 style={{ fontSize: tokens.typography.fontSize['2xl'], fontWeight: tokens.typography.fontWeight.bold, marginBottom: tokens.spacing.xs }}>
                Review & Submit
            </h1>
            <p style={{ fontSize: tokens.typography.fontSize.base, color: tokens.colors.neutral[600], marginBottom: tokens.spacing.xl }}>
                Final review before submission
            </p>

            <Card padding="lg">
                <p style={{ color: tokens.colors.neutral[600] }}>
                    Summary of all sections, validation checklist, declaration checkbox, submit button.
                </p>
            </Card>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: tokens.spacing.xl }}>
                <Button variant="secondary" onClick={onBack} icon={<ArrowLeft size={16} />}>Back</Button>
                <Button variant="primary" onClick={onComplete} icon={<Send size={16} />} iconPosition="right">Submit ITR</Button>
            </div>
        </div>
    );
};

export default ReviewSubmitSection;
