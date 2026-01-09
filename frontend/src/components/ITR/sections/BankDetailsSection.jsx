import React, { useState } from 'react';
import SectionCard from '../../DesignSystem/SectionCard';
import { CreditCard, Plus } from 'lucide-react';
import { Input } from '../../DesignSystem/components';

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

    const handleAccountNumberChange = (e) => handleChange('accountNumber', e.target.value);
    const handleIfscChange = (e) => handleChange('ifsc', e.target.value.toUpperCase());
    const handleBankNameChange = (e) => handleChange('bankName', e.target.value);

    return (
        <SectionCard
            {...props}
            title="Bank Account for Refund"
            description="Where should we send your refund?"
            icon={CreditCard}
        >
            <div className="space-y-4">
                <Input
                    label="Account Number"
                    type="text"
                    value={localData.accountNumber || ''}
                    onChange={handleAccountNumberChange}
                    placeholder="e.g. 1234567890"
                    required
                />
                <Input
                    label="IFSC Code"
                    type="text"
                    value={localData.ifsc || ''}
                    onChange={handleIfscChange}
                    placeholder="e.g. SBIN0001234"
                    required
                />
                <Input
                    label="Bank Name"
                    type="text"
                    value={localData.bankName || ''}
                    onChange={handleBankNameChange}
                    placeholder="e.g. State Bank of India"
                />
            </div>
        </SectionCard>
    );
};

export default BankDetailsSection;
