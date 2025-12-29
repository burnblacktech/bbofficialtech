/**
 * CAInbox.js
 * V3.1 CA Workspace Inbox Page
 */

import React, { useState, useEffect } from 'react';
import SidebarLayout from '../../components/Layout/SidebarLayout'; // Assuming layout exists or uses generic
import CAInboxTable from '../../components/CA/CAInboxTable';
import apiClient from '../../services/core/APIClient'; // Generic API client
import { Loader } from 'lucide-react';

const CAInbox = () => {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);

    useEffect(() => {
        fetchInbox();
    }, []);

    const fetchInbox = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/ca/inbox');
            if (response.data && response.data.data) {
                setItems(response.data.data.items);
            }
        } catch (error) {
            console.error('Failed to fetch inbox', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Simple Header for V3.1 */}
            <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">CA Workspace</h1>
                    <p className="text-sm text-slate-500">Inbox sorted by Intelligence Priority</p>
                </div>
                <div className="flex gap-3">
                    {/* Filters Placeholder */}
                </div>
            </header>

            <main className="p-8">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <CAInboxTable items={items} />
                    </div>
                )}
            </main>
        </div>
    );
};

export default CAInbox;
