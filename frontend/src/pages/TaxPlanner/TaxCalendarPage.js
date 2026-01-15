/**
 * Tax Calendar Page
 * Displays important tax deadlines and allows tracking progress
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Circle,
    Clock,
    AlertTriangle,
    Bell,
    ExternalLink,
} from 'lucide-react';
import { tokens } from '../../styles/tokens';
import api from '../../services/api';

const TaxCalendarPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Fetch tax calendar tasks
    const { data: tasks, isLoading } = useQuery({
        queryKey: ['tax', 'tasks'],
        queryFn: async () => {
            const response = await api.get('/api/tax/tasks');
            return response.data.data;
        },
    });

    // Toggle task completion
    const toggleMutation = useMutation({
        mutationFn: (taskData) => api.post('/api/tax/tasks/toggle', taskData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tax', 'tasks'] });
        },
    });

    const handleToggle = (task) => {
        toggleMutation.mutate({
            title: task.title,
            dueDate: task.date,
            type: task.type,
            isCompleted: !task.isCompleted,
        });
    };

    const getDeadlineStatus = (dateStr) => {
        // Very basic month-based logic for demo
        const months = {
            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11,
        };
        const parts = dateStr.split(' ');
        const month = months[parts[0]];
        const currentMonth = new Date().getMonth();

        if (month === currentMonth) return 'urgent';
        if (month < currentMonth) return 'passed';
        return 'upcoming';
    };

    const getStatusStyles = (status, isCompleted) => {
        if (isCompleted) return { color: tokens.colors.success[600], bg: `${tokens.colors.success[600]}10`, icon: CheckCircle2 };
        if (status === 'urgent') return { color: tokens.colors.error[600], bg: `${tokens.colors.error[600]}10`, icon: AlertTriangle };
        if (status === 'passed') return { color: tokens.colors.neutral[500], bg: tokens.colors.neutral[100], icon: Clock };
        return { color: tokens.colors.info[600], bg: `${tokens.colors.info[600]}10`, icon: Bell };
    };

    if (isLoading) {
        return (
            <div style={{ padding: tokens.spacing.xl, textAlign: 'center' }}>
                <Clock className="animate-spin" style={{ color: tokens.colors.accent[600], marginBottom: tokens.spacing.md }} size={48} />
                <p>Loading tax calendar...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: tokens.spacing.xl, maxWidth: '900px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: tokens.spacing.xl }}>
                <button
                    onClick={() => navigate('/tax-planner')}
                    style={{
                        padding: tokens.spacing.sm,
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: tokens.colors.accent[600],
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: tokens.spacing.xs,
                        marginBottom: tokens.spacing.sm,
                    }}
                >
                    <ArrowLeft size={16} />
                    Back to Tax Planner
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{
                            fontSize: tokens.typography.fontSize['3xl'],
                            fontWeight: tokens.typography.fontWeight.bold,
                            color: tokens.colors.neutral[900],
                            marginBottom: tokens.spacing.xs,
                        }}>
                            Tax Calendar
                        </h1>
                        <p style={{
                            fontSize: tokens.typography.fontSize.lg,
                            color: tokens.colors.neutral[600],
                        }}>
                            Important deadlines for FY 2024-25
                        </p>
                    </div>
                    <div style={{
                        padding: `${tokens.spacing.xs} ${tokens.spacing.md}`,
                        backgroundColor: tokens.colors.neutral[100],
                        borderRadius: tokens.borderRadius.full,
                        display: 'flex',
                        alignItems: 'center',
                        gap: tokens.spacing.sm,
                        fontSize: tokens.typography.fontSize.sm,
                        color: tokens.colors.neutral[700],
                    }}>
                        <Calendar size={16} />
                        Assmnt Year 2025-26
                    </div>
                </div>
            </div>

            {/* Calendar View (List for now) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}>
                {tasks?.map((task, index) => {
                    const status = getDeadlineStatus(task.date);
                    const styles = getStatusStyles(status, task.isCompleted);
                    const StatusIcon = styles.icon;

                    return (
                        <div
                            key={index}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: tokens.spacing.lg,
                                padding: tokens.spacing.lg,
                                backgroundColor: task.isCompleted ? `${tokens.colors.success[600]}05` : tokens.colors.neutral.white,
                                border: `1px solid ${task.isCompleted ? tokens.colors.success[200] : tokens.colors.neutral[200]}`,
                                borderRadius: tokens.borderRadius.lg,
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                opacity: status === 'passed' && !task.isCompleted ? 0.7 : 1,
                            }}
                        >
                            {/* Date Column */}
                            <div style={{
                                width: '80px',
                                textAlign: 'center',
                                paddingRight: tokens.spacing.lg,
                                borderRight: `1px solid ${tokens.colors.neutral[200]}`,
                            }}>
                                <span style={{
                                    display: 'block',
                                    fontSize: tokens.typography.fontSize.xs,
                                    fontWeight: tokens.typography.fontWeight.bold,
                                    textTransform: 'uppercase',
                                    color: tokens.colors.neutral[500],
                                }}>
                                    {task.date.split(' ')[0]}
                                </span>
                                <span style={{
                                    display: 'block',
                                    fontSize: tokens.typography.fontSize['2xl'],
                                    fontWeight: tokens.typography.fontWeight.bold,
                                    color: tokens.colors.neutral[900],
                                }}>
                                    {task.date.split(' ')[1]}
                                </span>
                            </div>

                            {/* Info Column */}
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm, marginBottom: tokens.spacing.xs }}>
                                    <h3 style={{
                                        margin: 0,
                                        fontSize: tokens.typography.fontSize.lg,
                                        fontWeight: tokens.typography.fontWeight.bold,
                                        color: task.isCompleted ? tokens.colors.neutral[500] : tokens.colors.neutral[900],
                                        textDecoration: task.isCompleted ? 'line-through' : 'none',
                                    }}>
                                        {task.title}
                                    </h3>
                                    {!task.isCompleted && status === 'urgent' && (
                                        <span style={{
                                            fontSize: tokens.typography.fontSize.xs,
                                            fontWeight: tokens.typography.fontWeight.bold,
                                            color: tokens.colors.error[600],
                                            backgroundColor: `${tokens.colors.error[600]}10`,
                                            padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
                                            borderRadius: tokens.borderRadius.sm,
                                        }}>
                                            DUE THIS MONTH
                                        </span>
                                    )}
                                </div>
                                <p style={{
                                    margin: 0,
                                    fontSize: tokens.typography.fontSize.sm,
                                    color: tokens.colors.neutral[600],
                                }}>
                                    {task.description}
                                </p>
                            </div>

                            {/* Action Column */}
                            <button
                                onClick={() => handleToggle(task)}
                                disabled={toggleMutation.isPending}
                                style={{
                                    padding: tokens.spacing.sm,
                                    backgroundColor: styles.bg,
                                    border: `1px solid ${task.isCompleted ? tokens.colors.success[300] : 'transparent'}`,
                                    borderRadius: tokens.borderRadius.md,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minWidth: '120px',
                                    gap: tokens.spacing.xs,
                                    transition: 'all 0.2s',
                                }}
                            >
                                <StatusIcon size={18} color={styles.color} />
                                <span style={{
                                    fontSize: tokens.typography.fontSize.sm,
                                    fontWeight: tokens.typography.fontWeight.semibold,
                                    color: styles.color,
                                }}>,
                                    {task.isCompleted ? 'Completed' : 'Mark Done'}
                                </span>
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Info Section */}
            <div style={{
                marginTop: tokens.spacing.xl,
                padding: tokens.spacing.lg,
                backgroundColor: `${tokens.colors.info[600]}05`,
                border: `1px solid ${tokens.colors.info[200]}`,
                borderRadius: tokens.borderRadius.lg,
                display: 'flex',
                gap: tokens.spacing.md,
            }}>
                <Clock size={24} style={{ color: tokens.colors.info[600], flexShrink: 0 }} />
                <div>
                    <h4 style={{ margin: `0 0 ${tokens.spacing.xs} 0`, color: tokens.colors.info[800] }}>
                        Why these dates matter?
                    </h4>
                    <p style={{ margin: 0, fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[700], lineHeight: 1.5 }}>
                        Missing tax deadlines can lead to penalties (u/s 234A, 234B, 234C) and interest.
                        Advance tax is required if your total tax liability exceeds ₹10,000 in a year.
                        Stay compliant and avoid stress!
                    </p>
                    <a
                        href="https://incometaxindia.gov.in"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: tokens.spacing.xs,
                            marginTop: tokens.spacing.sm,
                            fontSize: tokens.typography.fontSize.sm,
                            color: tokens.colors.accent[600],
                            textDecoration: 'none',
                            fontWeight: tokens.typography.fontWeight.medium,
                        }}
                    >
                        Official IT Dept Calendar <ExternalLink size={14} />
                    </a>
                </div>
            </div>
        </div>
    );
};

export default TaxCalendarPage;
