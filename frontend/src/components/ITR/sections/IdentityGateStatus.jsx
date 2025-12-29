import React from 'react';
import { CheckCircle, AlertTriangle, ArrowRight, User, Building2, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StatusChip = ({
    label,
    value, // e.g. PAN Number or "Missing"
    status, // 'verified', 'missing', 'saved'
    icon: Icon,
    onAction,
    actionLabel = "Add"
}) => {
    const isVerified = status === 'verified';
    const isSaved = status === 'saved';
    const isMissing = status === 'missing';

    return (
        <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-full flex-shrink-0 ${isVerified || isSaved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    <Icon size={20} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h4 className="text-body-medium font-semibold text-slate-900">{label}</h4>
                        {isVerified && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-100">
                                <CheckCircle size={10} /> Verified
                            </span>
                        )}
                        {isSaved && !isVerified && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-100">
                                <CheckCircle size={10} /> Saved
                            </span>
                        )}
                        {isMissing && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-100">
                                <AlertTriangle size={10} /> Missing
                            </span>
                        )}
                    </div>
                    <p className={`text-sm mt-0.5 ${isMissing ? 'text-slate-400 italic' : 'text-slate-600 font-mono'}`}>
                        {value || "Not provided yet"}
                    </p>
                </div>
            </div>

            <button
                onClick={onAction}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
          ${isMissing
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
                    }`}
            >
                <span>{isMissing ? actionLabel : 'Edit'}</span>
                {isMissing && <ArrowRight size={14} />}
            </button>
        </div>
    );
};

const IdentityGateStatus = ({ user, formData, onEdit }) => {
    // 1. PAN Status
    const panStatus = user?.panVerified ? 'verified' : (user?.panNumber ? 'saved' : 'missing');

    // 2. Address Status
    const hasAddress = user?.address_line_1 && user?.pincode;
    const addressStatus = hasAddress ? 'saved' : 'missing';
    const addressValue = hasAddress ? `${user.address_line_1}, ${user.city}` : null;

    // 3. Bank Status
    // Check form data first (primary source for filing) or user profile fallback
    const hasBank = formData?.bankDetails?.accountNumber;
    const bankStatus = hasBank ? 'saved' : 'missing';
    const bankValue = hasBank ? `A/c ending ${String(formData.bankDetails.accountNumber).slice(-4)}` : null;

    return (
        <div className="space-y-3">
            <StatusChip
                label="Permanent Account Number (PAN)"
                value={user?.panNumber}
                status={panStatus}
                icon={User}
                onAction={() => onEdit('personal')}
                actionLabel="Verify Identity"
            />

            <StatusChip
                label="Current Address"
                value={addressValue}
                status={addressStatus}
                icon={MapPin}
                onAction={() => onEdit('address')} // We'll map this to opening the form
                actionLabel="Add Address"
            />

            <StatusChip
                label="Bank Account for Refund"
                value={bankValue}
                status={bankStatus}
                icon={Building2}
                onAction={() => onEdit('bank')}
                actionLabel="Add Bank Account"
            />

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                <p className="text-sm font-medium text-green-700 flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    You're almost done. This is the last step before filing.
                </p>
            </div>
        </div>
    );
};

export default IdentityGateStatus;
