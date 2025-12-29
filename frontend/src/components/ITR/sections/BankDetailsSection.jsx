import React, { useState } from 'react';
import SectionCard from '../../DesignSystem/SectionCard';
import { CreditCard, Plus } from 'lucide-react';
import { FormField } from '../../DesignSystem/components';

// V1 Step 6 (Part 2): Bank Details
const BankDetailsSection = ({
    formData,
    onUpdate,
    ...props
}) => {
    const [localData, setLocalData] = useState(formData?.bankDetails || {});

    const handleChange = (field, value) => {
        const newData = { ...localData, [field]: value };
        setLocalData(newData);
        onUpdate('bankDetails', newData);
    };

    return (
        <SectionCard
            {...props}
            title="Bank Account for Refund"
            description="Where should we send your refund?"
            icon={CreditCard}
        >
            <div className="space-y-4">
                <FormField
                    label="Account Number"
                    type="text"
                    value={localData.accountNumber || ''}
                    onChange={(e) => handleChange('accountNumber', e.target.value)}
                    placeholder="e.g. 1234567890"
                    required
                />
                <FormField
                    label="IFSC Code"
                    type="text"
                    value={localData.ifsc || ''}
                    onChange={(e) => handleChange('ifsc', e.target.value.toUpperCase())}
                    placeholder="e.g. SBIN0001234"
                    required
                />
                <FormField
                    label="Bank Name"
                    type="text"
                    value={localData.bankName || ''}
                    onChange={(e) => handleChange('bankName', e.target.value)}
                    placeholder="e.g. State Bank of India"
                />
            </div>
        </SectionCard>
    );
};

export default BankDetailsSection;
