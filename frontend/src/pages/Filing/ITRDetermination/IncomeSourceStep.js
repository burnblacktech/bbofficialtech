/**
 * Income Source Selection Step
 * Third step: Select income sources and provide additional details
 */

import React, { useState } from 'react';
import { Briefcase, Home, TrendingUp, DollarSign, ArrowRight, ArrowLeft } from 'lucide-react';
import Button from '../../../components/atoms/Button';
import Card from '../../../components/atoms/Card';
import FormField from '../../../components/molecules/FormField';
import Input from '../../../components/atoms/Input';
import { tokens } from '../../../styles/tokens';

const IncomeSourceStep = ({ data, onNext, onBack }) => {
    const [incomeSources, setIncomeSources] = useState(data.incomeSources || []);
    const [additionalInfo, setAdditionalInfo] = useState(data.additionalInfo || {
        housePropertyCount: 0,
        hasPropertyLosses: false,
        businessTurnover: 0,
        wantsPresumptive: false,
        maintainsBooks: false,
    });

    const toggleIncomeSource = (source) => {
        if (incomeSources.includes(source)) {
            setIncomeSources(incomeSources.filter(s => s !== source));
        } else {
            setIncomeSources([...incomeSources, source]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onNext({ incomeSources, additionalInfo });
    };

    const IncomeSourceCard = ({ icon: Icon, title, description, value, selected, prefilled, onClick }) => (
        <div
            onClick={onClick}
            style={{
                padding: tokens.spacing.md,
                border: `2px solid ${selected ? tokens.colors.accent[600] : tokens.colors.neutral[200]}`,
                borderRadius: tokens.borderRadius.md,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: selected ? `${tokens.colors.accent[600]}10` : tokens.colors.neutral.white,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: tokens.spacing.sm }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: selected ? tokens.colors.accent[600] : tokens.colors.neutral[200],
                    borderRadius: tokens.borderRadius.md,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <Icon size={20} color={selected ? tokens.colors.neutral.white : tokens.colors.neutral[600]} />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm, marginBottom: tokens.spacing.xs }}>
                        <span style={{
                            fontSize: tokens.typography.fontSize.base,
                            fontWeight: tokens.typography.fontWeight.semibold,
                            color: tokens.colors.neutral[900],
                        }}>
                            {title}
                        </span>
                        {prefilled && (
                            <span style={{
                                fontSize: '10px',
                                backgroundColor: tokens.colors.info[100],
                                color: tokens.colors.info[700],
                                padding: '1px 6px',
                                borderRadius: tokens.borderRadius.full,
                                fontWeight: tokens.typography.fontWeight.semibold,
                            }}>
                                Pre-filled
                            </span>
                        )}
                    </div>
                    <div style={{
                        fontSize: tokens.typography.fontSize.sm,
                        color: tokens.colors.neutral[600],
                    }}>
                        {description}
                    </div>
                </div>
                <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => { }}
                    style={{
                        width: '20px',
                        height: '20px',
                        accentColor: tokens.colors.accent[600],
                    }}
                />
            </div>
        </div>
    );

    return (
        <Card padding="xl">
            <div style={{ marginBottom: tokens.spacing.xl }}>
                <h2 style={{
                    fontSize: tokens.typography.fontSize['2xl'],
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: tokens.colors.neutral[900],
                    marginBottom: tokens.spacing.xs,
                }}>
                    Select your income sources
                </h2>
                <p style={{
                    fontSize: tokens.typography.fontSize.base,
                    color: tokens.colors.neutral[600],
                }}>
                    Choose all that apply - we'll ask for details later
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.sm, marginBottom: tokens.spacing.lg }}>
                    <IncomeSourceCard
                        icon={Briefcase}
                        title="Salary / Pension"
                        description="Income from employment or pension"
                        value="salary"
                        selected={incomeSources.includes('salary')}
                        prefilled={data.incomeSources?.includes('salary')}
                        onClick={() => toggleIncomeSource('salary')}
                    />

                    <IncomeSourceCard
                        icon={Home}
                        title="House Property"
                        description="Rental income or own house"
                        value="houseProperty"
                        selected={incomeSources.includes('houseProperty')}
                        prefilled={data.incomeSources?.includes('house_property')}
                        onClick={() => toggleIncomeSource('house_property')}
                    />

                    <IncomeSourceCard
                        icon={TrendingUp}
                        title="Capital Gains"
                        description="Sold shares, mutual funds, property, etc."
                        value="capitalGains"
                        selected={incomeSources.includes('capitalGains')}
                        prefilled={data.incomeSources?.includes('capital_gains')}
                        onClick={() => toggleIncomeSource('capital_gains')}
                    />

                    <IncomeSourceCard
                        icon={Briefcase}
                        title="Business / Profession"
                        description="Self-employed, freelancer, or business owner"
                        value="business"
                        selected={incomeSources.includes('business')}
                        prefilled={data.incomeSources?.includes('business')}
                        onClick={() => toggleIncomeSource('business')}
                    />

                    <IncomeSourceCard
                        icon={DollarSign}
                        title="Other Income"
                        description="Interest, dividends, gifts, etc."
                        value="other"
                        selected={incomeSources.includes('other')}
                        prefilled={data.incomeSources?.includes('other')}
                        onClick={() => toggleIncomeSource('other')}
                    />
                </div>

                {/* Additional Questions based on selection */}
                {incomeSources.includes('houseProperty') && (
                    <div style={{ marginBottom: tokens.spacing.lg, padding: tokens.spacing.md, backgroundColor: tokens.colors.neutral[50], borderRadius: tokens.borderRadius.md }}>
                        <FormField label="How many house properties do you have?" required>
                            <div style={{ display: 'flex', gap: tokens.spacing.sm }}>
                                {[1, 2, 3, '4+'].map((count) => (
                                    <button
                                        key={count}
                                        type="button"
                                        onClick={() => setAdditionalInfo({ ...additionalInfo, housePropertyCount: typeof count === 'number' ? count : 4 })}
                                        style={{
                                            flex: 1,
                                            padding: tokens.spacing.sm,
                                            border: `2px solid ${additionalInfo.housePropertyCount === (typeof count === 'number' ? count : 4) ? tokens.colors.accent[600] : tokens.colors.neutral[300]}`,
                                            borderRadius: tokens.borderRadius.md,
                                            backgroundColor: additionalInfo.housePropertyCount === (typeof count === 'number' ? count : 4) ? `${tokens.colors.accent[600]}10` : tokens.colors.neutral.white,
                                            cursor: 'pointer',
                                            fontSize: tokens.typography.fontSize.base,
                                            fontWeight: tokens.typography.fontWeight.medium,
                                        }}
                                    >
                                        {count}
                                    </button>
                                ))}
                            </div>
                        </FormField>
                    </div>
                )}

                {incomeSources.includes('business') && (
                    <div style={{ marginBottom: tokens.spacing.lg, padding: tokens.spacing.md, backgroundColor: tokens.colors.neutral[50], borderRadius: tokens.borderRadius.md }}>
                        <FormField label="Annual business turnover (approx.)" required>
                            <Input
                                type="number"
                                value={additionalInfo.businessTurnover}
                                onChange={(e) => setAdditionalInfo({ ...additionalInfo, businessTurnover: parseInt(e.target.value) || 0 })}
                                placeholder="e.g., 1500000"
                            />
                        </FormField>
                        {additionalInfo.businessTurnover <= 20000000 && (
                            <div style={{ marginTop: tokens.spacing.md }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm, cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={additionalInfo.wantsPresumptive}
                                        onChange={(e) => setAdditionalInfo({ ...additionalInfo, wantsPresumptive: e.target.checked })}
                                        style={{ accentColor: tokens.colors.accent[600] }}
                                    />
                                    <span style={{ fontSize: tokens.typography.fontSize.sm }}>
                                        Use presumptive taxation (simpler, no books required)
                                    </span>
                                </label>
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div style={{
                    display: 'flex',
                    gap: tokens.spacing.sm,
                    justifyContent: 'space-between',
                }}>
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={onBack}
                    >
                        <ArrowLeft size={20} style={{ marginRight: tokens.spacing.xs }} />
                        Back
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        disabled={incomeSources.length === 0}
                    >
                        Continue
                        <ArrowRight size={20} style={{ marginLeft: tokens.spacing.xs }} />
                    </Button>
                </div>
            </form>
        </Card>
    );
};

export default IncomeSourceStep;
