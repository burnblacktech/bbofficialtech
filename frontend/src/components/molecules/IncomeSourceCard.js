import React from 'react';
import { Plus, Edit2, CheckCircle } from 'lucide-react';
import Card from '../atoms/Card';
import Badge from '../atoms/Badge';
import { tokens } from '../../styles/tokens';

const IncomeSourceCard = ({
    title,
    icon: Icon,
    amount,
    count = 0,
    color = tokens.colors.primary[600],
    onClick,
    isCompleted = false,
}) => {
    return (
        <div
            onClick={onClick}
            className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
        >
            {/* Background Decoration */}
            <div
                className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 transition-transform duration-300 group-hover:scale-150"
                style={{ backgroundColor: color }}
            />

            <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-50 shadow-sm transition-colors group-hover:bg-opacity-20"
                        style={{ color: color }}
                    >
                        <Icon size={24} />
                    </div>
                    {isCompleted && (
                        <Badge variant="success" className="rounded-full px-2">
                            <CheckCircle size={12} className="mr-1" />
                            Added
                        </Badge>
                    )}
                </div>

                {/* Content */}
                <div className="mt-auto">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-1">{title}</h3>

                    {amount !== null && amount > 0 ? (
                        <div>
                            <p className="text-2xl font-bold text-neutral-900 tracking-tight">
                                ₹{amount.toLocaleString('en-IN')}
                            </p>
                            <p className="text-sm text-neutral-500 mt-1">
                                {count} {count === 1 ? 'entry' : 'entries'} added
                            </p>
                        </div>
                    ) : (
                        <div className="flex items-center text-neutral-400 text-sm font-medium mt-2 group-hover:text-primary-600 transition-colors">
                            <Plus size={16} className="mr-1" />
                            Add Details
                        </div>
                    )}
                </div>

                {/* Edit Action (Visible on Hover) */}
                <div className="absolute bottom-6 right-6 opacity-0 transform translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                    <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600">
                        {amount > 0 ? <Edit2 size={14} /> : <Plus size={16} />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IncomeSourceCard;
