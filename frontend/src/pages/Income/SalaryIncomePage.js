/**
 * Salary Income Page
 * Detailed salary income tracking with Form 16 upload
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { tokens } from '../../styles/tokens';
import api from '../../services/api';

const SalaryIncomePage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Fetch salary income sources
    const { data: salaryData, isLoading } = useQuery({
        queryKey: ['income', 'salary'],
        queryFn: async () => {
            const response = await api.get('/api/income/salary');
            return response.data;
        },
    });

    // Create salary income mutation
    const createMutation = useMutation({
        mutationFn: async (data) => {
            const response = await api.post('/api/income', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['income']);
            queryClient.invalidateQueries(['dashboard']);
            setShowAddForm(false);
        },
    });

    // Delete salary income mutation
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const response = await api.delete(`/api/income/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['income']);
            queryClient.invalidateQueries(['dashboard']);
        },
    });

    const [formData, setFormData] = useState({
        employerName: '',
        grossSalary: '',
        basicSalary: '',
        hra: '',
        lta: '',
        allowances: '',
        bonus: '',
        tds: '',
        professionalTax: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        const sourceData = {
            employerName: formData.employerName,
            grossSalary: parseFloat(formData.grossSalary),
            basicSalary: parseFloat(formData.basicSalary || 0),
            hra: parseFloat(formData.hra || 0),
            lta: parseFloat(formData.lta || 0),
            allowances: parseFloat(formData.allowances || 0),
            bonus: parseFloat(formData.bonus || 0),
            tds: parseFloat(formData.tds || 0),
            professionalTax: parseFloat(formData.professionalTax || 0),
        };

        createMutation.mutate({
            sourceType: 'salary',
            sourceData,
            amount: parseFloat(formData.grossSalary),
            financialYear: '2024-25',
        });
    };

    const handleDelete = (id) => {
        // eslint-disable-next-line no-alert
        if (window.confirm('Are you sure you want to delete this salary income?')) {
            deleteMutation.mutate(id);
        }
    };

    const salaryIncomes = salaryData?.data || [];
    const totalSalary = salaryIncomes.reduce((sum, income) => sum + parseFloat(income.amount || 0), 0);

    return (
        <div style={{ padding: tokens.spacing.xl, maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing.xl }}>
                <div>
                    <h1 style={{
                        fontSize: tokens.typography.fontSize['3xl'],
                        fontWeight: tokens.typography.fontWeight.bold,
                        color: tokens.colors.neutral[900],
                        marginBottom: tokens.spacing.xs,
                    }}>
                        Salary Income
                    </h1>
                    <p style={{
                        fontSize: tokens.typography.fontSize.lg,
                        color: tokens.colors.neutral[600],
                    }}>
                        Track your employment income and Form 16 details
                    </p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    style={{
                        padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                        backgroundColor: tokens.colors.accent[600],
                        color: tokens.colors.neutral.white,
                        border: 'none',
                        borderRadius: tokens.borderRadius.md,
                        fontSize: tokens.typography.fontSize.sm,
                        fontWeight: tokens.typography.fontWeight.medium,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: tokens.spacing.xs,
                    }}
                >
                    <Plus size={16} />
                    Add Salary Income
                </button>
            </div>

            {/* Total Summary */}
            <div style={{
                padding: tokens.spacing.lg,
                backgroundColor: `${tokens.colors.accent[600]}10`,
                border: `2px solid ${tokens.colors.accent[600]}`,
                borderRadius: tokens.borderRadius.lg,
                marginBottom: tokens.spacing.xl,
            }}>
                <p style={{
                    fontSize: tokens.typography.fontSize.sm,
                    color: tokens.colors.accent[700],
                    marginBottom: tokens.spacing.xs,
                }}>
                    Total Salary Income (FY 2024-25)
                </p>
                <h2 style={{
                    fontSize: tokens.typography.fontSize['4xl'],
                    fontWeight: tokens.typography.fontWeight.bold,
                    color: tokens.colors.accent[900],
                }}>
                    ₹{totalSalary.toLocaleString('en-IN')}
                </h2>
            </div>

            {/* Add Form */}
            {showAddForm && (
                <div style={{
                    padding: tokens.spacing.lg,
                    backgroundColor: tokens.colors.neutral.white,
                    border: `1px solid ${tokens.colors.neutral[200]}`,
                    borderRadius: tokens.borderRadius.lg,
                    marginBottom: tokens.spacing.xl,
                }}>
                    <h3 style={{
                        fontSize: tokens.typography.fontSize.xl,
                        fontWeight: tokens.typography.fontWeight.bold,
                        marginBottom: tokens.spacing.lg,
                    }}>
                        Add Salary Income
                    </h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: tokens.spacing.md }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.medium, marginBottom: tokens.spacing.xs }}>
                                    Employer Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.employerName}
                                    onChange={(e) => setFormData({ ...formData, employerName: e.target.value })}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: tokens.spacing.sm,
                                        border: `1px solid ${tokens.colors.neutral[300]}`,
                                        borderRadius: tokens.borderRadius.md,
                                        fontSize: tokens.typography.fontSize.base,
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.medium, marginBottom: tokens.spacing.xs }}>
                                    Gross Salary *
                                </label>
                                <input
                                    type="number"
                                    value={formData.grossSalary}
                                    onChange={(e) => setFormData({ ...formData, grossSalary: e.target.value })}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: tokens.spacing.sm,
                                        border: `1px solid ${tokens.colors.neutral[300]}`,
                                        borderRadius: tokens.borderRadius.md,
                                        fontSize: tokens.typography.fontSize.base,
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.medium, marginBottom: tokens.spacing.xs }}>
                                    Basic Salary
                                </label>
                                <input
                                    type="number"
                                    value={formData.basicSalary}
                                    onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: tokens.spacing.sm,
                                        border: `1px solid ${tokens.colors.neutral[300]}`,
                                        borderRadius: tokens.borderRadius.md,
                                        fontSize: tokens.typography.fontSize.base,
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.medium, marginBottom: tokens.spacing.xs }}>
                                    HRA
                                </label>
                                <input
                                    type="number"
                                    value={formData.hra}
                                    onChange={(e) => setFormData({ ...formData, hra: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: tokens.spacing.sm,
                                        border: `1px solid ${tokens.colors.neutral[300]}`,
                                        borderRadius: tokens.borderRadius.md,
                                        fontSize: tokens.typography.fontSize.base,
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: tokens.typography.fontSize.sm, fontWeight: tokens.typography.fontWeight.medium, marginBottom: tokens.spacing.xs }}>
                                    TDS Deducted
                                </label>
                                <input
                                    type="number"
                                    value={formData.tds}
                                    onChange={(e) => setFormData({ ...formData, tds: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: tokens.spacing.sm,
                                        border: `1px solid ${tokens.colors.neutral[300]}`,
                                        borderRadius: tokens.borderRadius.md,
                                        fontSize: tokens.typography.fontSize.base,
                                    }}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: tokens.spacing.sm, marginTop: tokens.spacing.lg }}>
                            <button
                                type="submit"
                                disabled={createMutation.isLoading}
                                style={{
                                    padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                                    backgroundColor: tokens.colors.accent[600],
                                    color: tokens.colors.neutral.white,
                                    border: 'none',
                                    borderRadius: tokens.borderRadius.md,
                                    fontSize: tokens.typography.fontSize.sm,
                                    fontWeight: tokens.typography.fontWeight.medium,
                                    cursor: 'pointer',
                                }}
                            >
                                {createMutation.isLoading ? 'Adding...' : 'Add Income'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowAddForm(false)}
                                style={{
                                    padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                                    backgroundColor: tokens.colors.neutral.white,
                                    color: tokens.colors.neutral[700],
                                    border: `1px solid ${tokens.colors.neutral[300]}`,
                                    borderRadius: tokens.borderRadius.md,
                                    fontSize: tokens.typography.fontSize.sm,
                                    fontWeight: tokens.typography.fontWeight.medium,
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Income List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}>
                {salaryIncomes.length === 0 ? (
                    <div style={{
                        padding: tokens.spacing.xl,
                        backgroundColor: tokens.colors.neutral[50],
                        borderRadius: tokens.borderRadius.lg,
                        textAlign: 'center',
                    }}>
                        <p style={{ color: tokens.colors.neutral[600] }}>
                            No salary income added yet. Click "Add Salary Income" to get started.
                        </p>
                    </div>
                ) : (
                    salaryIncomes.map((income) => (
                        <div
                            key={income.id}
                            style={{
                                padding: tokens.spacing.lg,
                                backgroundColor: tokens.colors.neutral.white,
                                border: `1px solid ${tokens.colors.neutral[200]}`,
                                borderRadius: tokens.borderRadius.lg,
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{
                                        fontSize: tokens.typography.fontSize.lg,
                                        fontWeight: tokens.typography.fontWeight.semibold,
                                        marginBottom: tokens.spacing.sm,
                                    }}>
                                        {income.source_data?.employerName || 'Employer'}
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: tokens.spacing.md }}>
                                        <div>
                                            <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600] }}>Gross Salary</p>
                                            <p style={{ fontSize: tokens.typography.fontSize.base, fontWeight: tokens.typography.fontWeight.semibold }}>
                                                ₹{parseFloat(income.amount).toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        {income.source_data?.tds && (
                                            <div>
                                                <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[600] }}>TDS Deducted</p>
                                                <p style={{ fontSize: tokens.typography.fontSize.base, fontWeight: tokens.typography.fontWeight.semibold }}>
                                                    ₹{parseFloat(income.source_data.tds).toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(income.id)}
                                    style={{
                                        padding: tokens.spacing.sm,
                                        backgroundColor: 'transparent',
                                        color: tokens.colors.error[600],
                                        border: 'none',
                                        borderRadius: tokens.borderRadius.md,
                                        cursor: 'pointer',
                                    }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default SalaryIncomePage;
