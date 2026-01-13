// =====================================================
// MEMBER SELECTION HUB - "Who is filing today?"
// Replaces simple PAN Verification with multi-user selection
// =====================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Users, Plus, Shield, CheckCircle, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import SectionCard from '../../components/common/SectionCard';
import PANVerificationInline from '../../components/ITR/PANVerificationInline';
import { useAuth } from '../../contexts/AuthContext';
import memberService from '../../services/memberService';
import api from '../../services/api';

import { DataEntryPage } from '../../components/templates';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';

const MemberSelection = () => {
    const navigate = useNavigate();
    const { user, refreshProfile } = useAuth();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [addingMember, setAddingMember] = useState(false);

    // New Member Form State
    const [newMember, setNewMember] = useState({
        firstName: '',
        lastName: '',
        panNumber: '',
        dateOfBirth: '',
        relationship: '',
    });
    const [newMemberLoading, setNewMemberLoading] = useState(false);
    const [assessmentYear, setAssessmentYear] = useState('2024-25');

    // Load family members on mount
    useEffect(() => {
        loadMembers();
    }, []);

    const loadMembers = async () => {
        try {
            setLoading(true);
            const response = await memberService.getMembers();
            const membersArray = response.data?.members || response.members || response.data || [];
            setMembers(Array.isArray(membersArray) ? membersArray : []);
        } catch (error) {
            console.error('Failed to load members:', error);
            // Don't show toast error here to avoid noise, just log it
        } finally {
            setLoading(false);
        }
    };

    const handleStartFiling = async (selectedPerson) => {
        // Person object should have: panNumber, dateOfBirth (verified or not)
        // If unverified, we might still proceed but warn? Or strictly require verification?
        // User requested: "locked as verified... if I start filing... needs self/family options"
        // We'll proceed to confirm-sources which fetches prefill data

        try {
            // S29: Simulate deliberate loading
            const loadingToast = toast.loading('Initializing filing...');

            // Call prefill API to initialize filing session
            // Note: Use existing endpoint logic from old PANVerification.js
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // We use the selected person's details
            const response = await api.post('/filings/prefill', {
                pan: selectedPerson.panNumber,
                dob: selectedPerson.dateOfBirth, // Required by backend
                assessmentYear,
            });

            toast.dismiss(loadingToast);
            toast.success(`Filing started for ${selectedPerson.firstName || selectedPerson.name} (AY ${assessmentYear})`);

            navigate('/itr/confirm-sources', {
                state: {
                    pan: selectedPerson.panNumber,
                    dob: selectedPerson.dateOfBirth,
                    ay: assessmentYear,
                    prefillData: response.data.data,
                    sources: response.data.sources,
                    filingFor: selectedPerson.type === 'self' ? 'self' : 'family',
                    memberId: selectedPerson.id, // null for self
                    memberName: selectedPerson.firstName || selectedPerson.name,
                },
            });

        } catch (error) {
            toast.dismiss();
            console.error('Filing init failed:', error);
            toast.error(error.response?.data?.error || 'Failed to start filing. Please check details.');
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        setNewMemberLoading(true);

        try {
            // 1. Verify PAN first (or just add and verify later? User asked for inline verify option)
            // We'll treat "Add" as "Add verified member" if possible, or just add logic

            // Add member via service
            await memberService.addMember(newMember);

            toast.success('Member added successfully');
            setAddingMember(false);
            setNewMember({
                firstName: '',
                lastName: '',
                panNumber: '',
                dateOfBirth: '',
                relationship: '',
            });
            loadMembers(); // Refresh list
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to add member');
        } finally {
            setNewMemberLoading(false);
        }
    };

    const handleNewMemberInput = (e) => {
        const { name, value } = e.target;
        setNewMember(prev => ({
            ...prev,
            [name]: name === 'panNumber' ? value.toUpperCase() : value,
        }));
    };

    if (loading) {

        return (
            <div className="min-h-screen bg-[var(--s29-bg-page)] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--s29-primary)] mx-auto mb-2" />
                    <p className="text-[var(--s29-text-muted)]">Loading filing profiles...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--s29-bg-page)] py-8 px-4 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Who is filing today?</h1>
                    <p className="text-slate-500 text-sm">
                        Select yourself or a family member to start their tax return.
                    </p>
                </div>

                {/* AY Selection */}
                <div className="max-w-xs mx-auto mb-8">
                    <select
                        value={assessmentYear}
                        onChange={(e) => setAssessmentYear(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white text-center font-medium focus:ring-2 focus:ring-blue-100 outline-none"
                    >
                        <option value="2024-25">Returns for 2023-24 (AY 2024-25)</option>
                        <option value="2023-24">Returns for 2022-23 (AY 2023-24)</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 1. SELF CARD */}
                    <div className={`relative group transition-all duration-300 ${user?.panVerified ? 'hover:shadow-lg' : ''}`}>
                        <SectionCard className="h-full border border-slate-200 hover:border-blue-300 transition-colors">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-blue-50 rounded-full">
                                    <User className="w-6 h-6 text-blue-600" />
                                </div>
                                {user?.panVerified && (
                                    <div className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                                        <CheckCircle className="w-3 h-3" />
                                        Verified
                                    </div>
                                )}
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 mb-1">
                                {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Myself'}
                            </h3>
                            <p className="text-sm text-slate-500 mb-6">
                                PAN: <span className="font-mono font-medium">{user?.panNumber || 'Not added'}</span>
                            </p>

                            {user?.panVerified ? (
                                <Button
                                    variant="primary"
                                    fullWidth
                                    onClick={() => handleStartFiling({
                                        ...user,
                                        name: user.fullName || user.firstName,
                                        type: 'self',
                                    })}
                                >
                                    Start Filing
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-xl text-xs text-yellow-800 flex gap-2">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>Please verify your identity to proceed with filing.</span>
                                    </div>
                                    <PANVerificationInline
                                        panNumber={user?.panNumber || ''}
                                        onVerified={(verifiedData) => {
                                            refreshProfile();
                                            toast.success('Identity verified! Starting filing...');

                                            // Use verified data directly to avoid stale state issues
                                            handleStartFiling({
                                                ...user,
                                                firstName: verifiedData.name?.split(' ')[0] || user.firstName,
                                                lastName: verifiedData.name?.split(' ').slice(1).join(' ') || user.lastName,
                                                name: verifiedData.name || user.fullName,
                                                type: 'self',
                                                panNumber: verifiedData.pan,
                                                dateOfBirth: verifiedData.dateOfBirth || verifiedData.dob || user.dateOfBirth,
                                            });
                                        }}
                                        compact={false}
                                        memberType="self"
                                    />
                                </div>
                            )}
                        </SectionCard>
                    </div>

                    {/* 2. FAMILY MEMBERS CARDS */}
                    {members.map(member => (
                        <div key={member.id} className="relative group hover:shadow-lg transition-all duration-300">
                            <SectionCard className="h-full border border-slate-200 hover:border-purple-300 transition-colors">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-purple-50 rounded-full">
                                        <Users className="w-6 h-6 text-purple-600" />
                                    </div>
                                    {member.panVerified && (
                                        <div className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                                            <CheckCircle className="w-3 h-3" />
                                            Verified
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-lg font-bold text-slate-900 mb-1">
                                    {member.firstName} {member.lastName}
                                </h3>
                                <p className="text-xs text-purple-600 font-medium uppercase tracking-wider mb-1">
                                    {member.relationship}
                                </p>
                                <p className="text-sm text-slate-500 mb-6">
                                    PAN: <span className="font-mono font-medium">{member.panNumber}</span>
                                </p>

                                {member.panVerified ? (
                                    <Button
                                        variant="primary"
                                        fullWidth
                                        onClick={() => handleStartFiling({ ...member, type: 'family' })}
                                    >
                                        File for {member.firstName}
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                ) : (
                                    <div className="space-y-3">
                                        <button
                                            className="w-full py-2 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors text-sm"
                                            onClick={() => {/* Toggle inline verify for this member? Or reuse inline comp directly */ }}
                                        >
                                            Verify Identity
                                        </button>
                                        {/* Simplified: Show inline verification always if not verified? */}
                                        <PANVerificationInline
                                            panNumber={member.panNumber}
                                            memberType="family"
                                            memberId={member.id}
                                            onVerified={() => {
                                                loadMembers();
                                                toast.success('Member verified!');
                                            }}
                                            compact={true}
                                        />
                                    </div>
                                )}
                            </SectionCard>
                        </div>
                    ))}

                    {/* 3. ADD MEMBER CARD */}
                    {!addingMember ? (
                        <button
                            onClick={() => setAddingMember(true)}
                            className="h-full min-h-[200px] rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-3 group"
                        >
                            <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors">
                                <Plus className="w-6 h-6 text-slate-400 group-hover:text-blue-600" />
                            </div>
                            <span className="font-medium text-slate-600 group-hover:text-blue-700">Add Family Member</span>
                        </button>
                    ) : (
                        <SectionCard className="border border-blue-200 shadow-md">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-slate-900">New Member Details</h3>
                                <button onClick={() => setAddingMember(false)} className="text-slate-400 hover:text-slate-600">
                                    <Plus className="w-5 h-5 rotate-45" />
                                </button>
                            </div>

                            <form onSubmit={handleAddMember} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        name="firstName"
                                        placeholder="First Name"
                                        value={newMember.firstName}
                                        onChange={handleNewMemberInput}
                                        className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                                        required
                                    />
                                    <input
                                        name="lastName"
                                        placeholder="Last Name"
                                        value={newMember.lastName}
                                        onChange={handleNewMemberInput}
                                        className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                                        required
                                    />
                                </div>
                                <input
                                    name="panNumber"
                                    placeholder="PAN Number"
                                    value={newMember.panNumber}
                                    onChange={handleNewMemberInput}
                                    className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-100 outline-none text-sm font-mono uppercase"
                                    maxLength={10}
                                    required
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        name="dateOfBirth"
                                        type="date"
                                        value={newMember.dateOfBirth}
                                        onChange={handleNewMemberInput}
                                        className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                                        required
                                    />
                                    <select
                                        name="relationship"
                                        value={newMember.relationship}
                                        onChange={handleNewMemberInput}
                                        className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                                        required
                                    >
                                        <option value="">Relation</option>
                                        <option value="spouse">Spouse</option>
                                        <option value="parent">Parent</option>
                                        <option value="child">Child</option>
                                        <option value="sibling">Sibling</option>
                                    </select>
                                </div>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    fullWidth
                                    disabled={newMemberLoading}
                                >
                                    {newMemberLoading ? 'Adding...' : 'Add & Verify Member'}
                                </Button>
                            </form>
                        </SectionCard>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MemberSelection;
