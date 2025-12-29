/**
 * SubmitToCAModal.jsx
 * V3.4 Confirmation Modal
 */
import React from 'react';
import { X, CheckCircle, Shield } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const SubmitToCAModal = ({ isOpen, onClose, onConfirm, loading }) => {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all border border-slate-200">
                                <div className="flex justify-between items-start">
                                    <div className="p-3 bg-indigo-50 rounded-full">
                                        <Shield className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <Dialog.Title as="h3" className="text-lg font-bold text-slate-900 mt-4">
                                    Send to Expert for Filing?
                                </Dialog.Title>
                                <div className="mt-2">
                                    <p className="text-sm text-slate-600">
                                        Your CA will verify your return and submit it to the Income Tax Department on your behalf.
                                    </p>

                                    <ul className="mt-4 space-y-3">
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
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                                        onClick={onClose}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 flex items-center gap-2"
                                        onClick={onConfirm}
                                        disabled={loading}
                                    >
                                        {loading ? 'Sending...' : 'Confirm & Send to CA'}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default SubmitToCAModal;
