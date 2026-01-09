import React from 'react';
import { Shield, CheckCircle } from 'lucide-react';
import { Modal, Button } from '../DesignSystem/components';

const SubmitToCAModal = ({ isOpen, onClose, onConfirm, loading }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Send to Expert for Filing?"
            size="sm"
        >
            <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl mb-4">
                    <Shield className="w-6 h-6 text-indigo-600 shrink-0" />
                    <p className="text-sm text-indigo-900 font-medium">
                        Expert Verification Required
                    </p>
                </div>

                <p className="text-sm text-slate-600">
                    Your CA will verify your return and submit it to the Income Tax Department on your behalf.
                </p>

                <ul className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <li className="flex items-start gap-2.5 text-sm text-slate-700">
                        <CheckCircle className="w-5 h-5 text-indigo-500 shrink-0" />
                        <span>Your data will be locked for review.</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-sm text-slate-700">
                        <CheckCircle className="w-5 h-5 text-indigo-500 shrink-0" />
                        <span>CA gets filing authority.</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-sm text-slate-700">
                        <CheckCircle className="w-5 h-5 text-indigo-500 shrink-0" />
                        <span>You'll be notified upon submission.</span>
                    </li>
                </ul>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={onConfirm}
                        disabled={loading}
                        isLoading={loading}
                        icon={Shield}
                    >
                        Confirm & Send
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default SubmitToCAModal;

