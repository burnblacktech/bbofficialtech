import { PiggyBank, HeartPulse, GraduationCap, TrendingUp } from 'lucide-react';
import DeductionBucket from '../../common/DeductionBucket';
import {
    Section80C, Section80CCC, Section80CCD,
    Section80D, Section80DD, Section80DDB, Section80U,
    Section80E, Section80EE,
    Section80G, Section80TTA, Section80GGC
} from '../../../features/deductions';
import DeductionBreakdown from '../../../components/ITR/DeductionBreakdown';

const DeductionsSection = ({
    id,
    title,
    description,
    icon,
    isExpanded,
    onToggle,
    formData,
    fullFormData,
    onUpdate,
    readOnly,
}) => {
    // Helper to calculate bucket totals (optional, for activeAmount prop)
    const getBucketTotal = (keys) => {
        let total = 0;
        const ded = fullFormData?.deductions || formData;
        if (!ded) return 0;
        keys.forEach(k => {
            if (ded[k]) total += (Number(ded[k]) || 0);
            // Handle nested objects if necessary (most deduction fields are flat numbers or objects with 'amount')
            // Assuming standard schema where 80C is number, 80D might be object?
            // Actually Features/Deductions components handle complex objects.
            // For simpler total display, might need to rely on DeductionBreakdown's logic or just show 0 if complex.
            // For V1.5, showing "Claimed" is a nice to have. I'll strip it for now or keep it simple.
        });
        return total;
    };

    const sectionState = React.useState({
        invested: false,
        medical: false,
        education: false,
        saveMore: false
    });
    const [buckets, setBuckets] = sectionState[0];
    const toggleBucket = (key) => setBuckets(prev => ({ ...prev, [key]: !prev[key] }));

    return (
        <SectionWrapper
            title={title}
            description={description}
            icon={icon}
            isExpanded={isExpanded}
            onToggle={onToggle}
            isComplete={false}
        >
            <div className="space-y-4">

                {/* Bucket 1: I already invested */}
                <DeductionBucket
                    title="I already invested or spent this"
                    subtitle="PF, LIC, Tuition Fees, Housing Loan Principal"
                    icon={PiggyBank}
                    maxBenefit="1,50,000"
                    isOpen={buckets.invested}
                    onToggle={() => toggleBucket('invested')}
                >
                    <div className="space-y-6">
                        <Section80C
                            data={fullFormData?.deductions || formData}
                            onUpdate={onUpdate}
                            readOnly={readOnly}
                        />
                        <Section80CCC
                            data={fullFormData?.deductions || formData}
                            onUpdate={onUpdate}
                            readOnly={readOnly}
                        />
                    </div>
                </DeductionBucket>

                {/* Bucket 2: Medical & Insurance */}
                <DeductionBucket
                    title="Medical & Insurance"
                    subtitle="Health Insurance, Health Checkups, Disability Support"
                    icon={HeartPulse}
                    maxBenefit="1,00,000"
                    isOpen={buckets.medical}
                    onToggle={() => toggleBucket('medical')}
                >
                    <div className="space-y-6">
                        <Section80D
                            data={fullFormData?.deductions || formData}
                            onUpdate={onUpdate}
                            readOnly={readOnly}
                        />
                        <Section80DD
                            data={fullFormData?.deductions || formData}
                            onUpdate={onUpdate}
                            readOnly={readOnly}
                        />
                        <Section80DDB
                            data={fullFormData?.deductions || formData}
                            onUpdate={onUpdate}
                            readOnly={readOnly}
                        />
                        <Section80U
                            data={fullFormData?.deductions || formData}
                            onUpdate={onUpdate}
                            readOnly={readOnly}
                        />
                    </div>
                </DeductionBucket>

                {/* Bucket 3: Education & Loans */}
                <DeductionBucket
                    title="Education & Home Loans"
                    subtitle="Education Loan Interest, Home Loan Interest (Additional)"
                    icon={GraduationCap}
                    maxBenefit="No Limit"
                    isOpen={buckets.education}
                    onToggle={() => toggleBucket('education')}
                >
                    <div className="space-y-6">
                        <Section80E
                            data={fullFormData?.deductions || formData}
                            onUpdate={onUpdate}
                            readOnly={readOnly}
                        />
                        <Section80EE
                            data={fullFormData?.deductions || formData}
                            onUpdate={onUpdate}
                            readOnly={readOnly}
                        />
                    </div>
                </DeductionBucket>

                {/* Bucket 4: I want to save more tax */}
                <DeductionBucket
                    title="I want to save more tax"
                    subtitle="NPS, Donations, Savings Account Interest"
                    icon={TrendingUp}
                    maxBenefit="50,000+"
                    isOpen={buckets.saveMore}
                    onToggle={() => toggleBucket('saveMore')}
                >
                    <div className="space-y-6">
                        <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-4">
                            These are additional deductions over and above the ₹1.5L limit of 80C.
                        </div>
                        <Section80CCD
                            data={fullFormData?.deductions || formData}
                            onUpdate={onUpdate}
                            readOnly={readOnly}
                        />
                        <Section80TTA
                            data={fullFormData?.deductions || formData}
                            onUpdate={onUpdate}
                            readOnly={readOnly}
                        />
                        <Section80G
                            data={fullFormData?.deductions || formData}
                            onUpdate={onUpdate}
                            readOnly={readOnly}
                        />
                        <Section80GGC
                            data={fullFormData?.deductions || formData}
                            onUpdate={onUpdate}
                            readOnly={readOnly}
                        />
                    </div>
                </DeductionBucket>

                {/* Total Breakdown - Always Visible */}
                <DeductionBreakdown
                    formData={{ deductions: (fullFormData?.deductions || formData) }}
                    onUpdate={onUpdate}
                />
            </div>
        </SectionWrapper>
    );
};

export default DeductionsSection;
