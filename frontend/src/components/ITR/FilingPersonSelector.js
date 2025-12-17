// =====================================================
// FILING PERSON SELECTOR COMPONENT
// First step in ITR filing - select who to file for
// =====================================================

import React, { useState, useEffect } from 'react';
import { enterpriseLogger } from '../../utils/logger';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { User, Users, CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Loader, Plus, X, Edit, FileText, Search, Filter, MoreVertical } from 'lucide-react';
import memberService from '../../services/memberService';
import apiClient from '../../services/core/APIClient';
import toast from 'react-hot-toast';
import MemberFormInline from '../Members/MemberFormInline';
import PANVerificationInline from './PANVerificationInline';
import { springs, stagger } from '../../lib/motion';

const FilingPersonSelector = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [personType, setPersonType] = useState(null); // 'self', 'family'
  const [selectedFamilyMember, setSelectedFamilyMember] = useState(null);
  const [panStatuses, setPanStatuses] = useState({});
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [showPANVerification, setShowPANVerification] = useState(false);
  const [panVerificationPerson, setPanVerificationPerson] = useState(null);
  const [isVerifyingPAN, setIsVerifyingPAN] = useState(false);
  const [memberFilingStats, setMemberFilingStats] = useState({}); // memberId -> { count, lastFiling }
  const [searchTerm, setSearchTerm] = useState('');
  const [showMemberActions, setShowMemberActions] = useState(null); // memberId for which actions are shown
  const [isLoadingFilings, setIsLoadingFilings] = useState(false);

  useEffect(() => {
    loadFamilyMembers();
    checkUserPANStatus();
  }, []);

  // Load filing stats for all members
  useEffect(() => {
    const loadMemberFilingStats = async () => {
      if (familyMembers.length === 0) return;

      try {
        setIsLoadingFilings(true);
        const statsPromises = familyMembers.map(async (member) => {
          if (!member.id) return null;
          try {
            const filingsResponse = await memberService.getMemberFilings(member.id, { limit: 1 });
            const filings = filingsResponse.data?.filings || filingsResponse.filings || [];
            return {
              memberId: member.id,
              count: filingsResponse.data?.total || filingsResponse.total || filings.length,
              lastFiling: filings[0] || null,
            };
          } catch (error) {
            // Member might not have any filings yet
            return { memberId: member.id, count: 0, lastFiling: null };
          }
        });

        const statsResults = await Promise.all(statsPromises);
        const statsMap = {};
        statsResults.forEach(stat => {
          if (stat) statsMap[stat.memberId] = { count: stat.count, lastFiling: stat.lastFiling };
        });
        setMemberFilingStats(statsMap);
      } catch (error) {
        enterpriseLogger.error('Failed to load member filing stats', { error });
      } finally {
        setIsLoadingFilings(false);
      }
    };

    if (familyMembers.length > 0) {
      loadMemberFilingStats();
    }
  }, [familyMembers]);

  const loadFamilyMembers = async () => {
    try {
      const response = await memberService.getMembers();
      setFamilyMembers(response.data?.members || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load family members');
    } finally {
      setLoading(false);
    }
  };

  const checkUserPANStatus = async () => {
    // Only check API if user has PAN but verification status is unknown
    // Prioritize user?.panVerified from profile context
    if (!user?.panNumber) return;

    // If user already has verified PAN in profile, use that
    if (user?.panVerified) {
      setPanStatuses(prev => ({
        ...prev,
        self: {
          verified: true,
          verifiedAt: user?.panVerifiedAt || null,
        },
      }));
      return;
    }

    // Otherwise, check API as fallback (optional)
    try {
      const response = await apiClient.get(`/itr/pan/status/${user.panNumber}`);
      setPanStatuses(prev => ({
        ...prev,
        self: response.data.data,
      }));
    } catch (error) {
      // Silently fail - PAN status check is optional
      // Use profile data if available
      setPanStatuses(prev => ({
        ...prev,
        self: {
          verified: user?.panVerified || false,
          verifiedAt: user?.panVerifiedAt || null,
        },
      }));
    }
  };

  const checkFamilyMemberPANStatus = async (memberId, panNumber) => {
    try {
      const response = await apiClient.get(`/itr/pan/status/${panNumber}`);
      setPanStatuses(prev => ({
        ...prev,
        [memberId]: response.data.data,
      }));
      return response.data.data;
    } catch (error) {
      // Return unverified status if check fails
      return { verified: false };
    }
  };

  const handlePersonTypeSelect = (type) => {
    setPersonType(type);
    setSelectedPerson(null);
    setSelectedFamilyMember(null);
    setShowPANVerification(false);
    setPanVerificationPerson(null);

    if (type === 'self') {
      // Prioritize user?.panVerified from profile context
      const hasPAN = !!user?.panNumber;
      // Check verified status: user?.panVerified first, then panStatuses.self
      const isVerified = user?.panVerified || panStatuses.self?.verified || false;
      const verifiedAt = user?.panVerifiedAt || panStatuses.self?.verifiedAt || null;

      const person = {
        type: 'self',
        id: user?.id,
        name: user?.fullName,
        panNumber: user?.panNumber || '',
        panVerified: isVerified,
        panVerifiedAt: verifiedAt,
      };

      setSelectedPerson(person);

      // Auto-show verification form if PAN exists but is not verified
      if (hasPAN && !isVerified) {
        setPanVerificationPerson(person);
        setShowPANVerification(true);
      }
      // If PAN is verified, user can proceed immediately
    }
  };

  const handleFamilyMemberSelect = async (member) => {
    setSelectedFamilyMember(member);

    // Check if member has PAN
    if (!member.panNumber) {
      // Member has no PAN - show message and allow adding
      toast.info('This family member does not have a PAN number. Please add PAN to proceed.');
      setSelectedPerson({
        type: 'family',
        id: member.id,
        name: `${member.firstName} ${member.lastName}`,
        panNumber: '',
        panVerified: false,
        panVerifiedAt: null,
        member: member,
      });
      return;
    }

    // Check PAN status
    let panStatus = panStatuses[member.id];
    if (!panStatus) {
      panStatus = await checkFamilyMemberPANStatus(member.id, member.panNumber);
    }

    // Prioritize member.panVerified from database
    const isVerified = member.panVerified || panStatus.verified || false;
    const verifiedAt = member.panVerifiedAt || panStatus.verifiedAt || null;

    const selectedPersonData = {
      type: 'family',
      id: member.id,
      name: `${member.firstName} ${member.lastName}`,
      panNumber: member.panNumber,
      panVerified: isVerified,
      panVerifiedAt: verifiedAt,
      member: member,
    };

    setSelectedPerson(selectedPersonData);

    // If PAN is not verified, auto-show verification form
    if (!isVerified) {
      setPanVerificationPerson(selectedPersonData);
      setShowPANVerification(true);
    }
  };

  const handleMemberAdded = async (newMemberData) => {
    // Reload family members list
    await loadFamilyMembers();
    setShowAddMemberForm(false);

    // Find the newly added member in the reloaded list
    setTimeout(async () => {
      const response = await memberService.getMembers();
      const updatedMembers = response.data?.members || [];
      const newMember = updatedMembers.find(m =>
        m.firstName === newMemberData.firstName &&
        m.lastName === newMemberData.lastName &&
        m.panNumber === newMemberData.panNumber,
      ) || {
        id: newMemberData.id || `new-${Date.now()}`,
        firstName: newMemberData.firstName,
        lastName: newMemberData.lastName,
        panNumber: newMemberData.panNumber,
        relationship: newMemberData.relationship,
        panVerified: newMemberData.panVerified || false,
        panVerifiedAt: newMemberData.panVerifiedAt || null,
      };

      // Check PAN status if PAN exists
      if (newMember.panNumber) {
        await checkFamilyMemberPANStatus(newMember.id, newMember.panNumber);
      }

      handleFamilyMemberSelect(newMember);
    }, 500);
  };

  const handlePANVerified = (verificationResult) => {
    if (!panVerificationPerson) return;

    setIsVerifyingPAN(false); // Verification complete

    // Update the person's PAN status with verification result data
    const updatedPerson = {
      ...panVerificationPerson,
      panNumber: verificationResult.pan || panVerificationPerson.panNumber,
      panVerified: true,
      panVerifiedAt: verificationResult.verifiedAt || new Date().toISOString(),
      // Include name from verification if available
      name: verificationResult.name || panVerificationPerson.name,
    };

    setSelectedPerson(updatedPerson);
    setShowPANVerification(false);
    setPanVerificationPerson(null);

    // Update PAN status in state
    if (updatedPerson.type === 'self') {
      setPanStatuses(prev => ({
        ...prev,
        self: { verified: true, verifiedAt: updatedPerson.panVerifiedAt },
      }));
    } else if (updatedPerson.member?.id) {
      setPanStatuses(prev => ({
        ...prev,
        [updatedPerson.member.id]: { verified: true, verifiedAt: updatedPerson.panVerifiedAt },
      }));

      // Update family member in the list
      setFamilyMembers(prev => prev.map(m =>
        m.id === updatedPerson.member.id
          ? { ...m, panVerified: true, panVerifiedAt: updatedPerson.panVerifiedAt }
          : m,
      ));
    }

    toast.success('PAN verified successfully!');
    // Auto-proceed to data source selection after verification
    setTimeout(() => {
      proceedToDataSourceSelection(updatedPerson);
    }, 1000);
  };

  const proceedToDataSourceSelection = (person) => {
    // Navigate to data source selection
    navigate('/itr/data-source', {
      state: {
        selectedPerson: person,
        verificationResult: {
          isValid: true,
          pan: person.panNumber,
          name: person.name,
        },
      },
    });
  };

  const handleProceed = async () => {
    if (!selectedPerson) {
      toast.error('Please select a person to file for');
      return;
    }

    if (!selectedPerson.panNumber) {
      toast.error('PAN number is required');
      return;
    }

    // If PAN not verified, show inline verification and block navigation
    if (!selectedPerson.panVerified) {
      setPanVerificationPerson(selectedPerson);
      setShowPANVerification(true);
      toast.info('Please verify PAN before proceeding');
      return;
    }

    // If PAN verification is in progress, block navigation
    if (isVerifyingPAN) {
      toast.info('PAN verification in progress. Please wait...');
      return;
    }

    // PAN verified, proceed to data source selection
    proceedToDataSourceSelection(selectedPerson);
  };

  const filingOptions = [
    {
      id: 'self',
      title: 'File for Myself',
      description: 'Start a new ITR filing for your own income',
      icon: User,
      color: 'bg-blue-500',
      disabled: false, // Allow even without PAN - will handle in StartFiling page
    },
    {
      id: 'family',
      title: 'File for Family Member',
      description: 'File ITR for a family member',
      icon: Users,
      color: 'bg-green-500',
      disabled: false, // Allow even without members - can add new member
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gold-100 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-gold-600 mx-auto mb-4" />
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-gold-100 to-white -mx-3 sm:-mx-4 lg:-mx-6 xl:-mx-8 -my-3 sm:-my-4 lg:-my-5">
      {/* Header with Back Navigation */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/itr/start')}
              className="p-2 rounded-xl hover:bg-neutral-100 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5 text-neutral-600" />
            </button>
            <div>
              <h1 className="text-heading-4 font-semibold text-neutral-900">Select Person</h1>
              <p className="text-body-small text-neutral-500">Choose who you're filing for</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Hero Section - Very Compact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.gentle}
          className="text-center mb-4"
        >
          <h1 className="text-heading-3 font-bold text-neutral-900 mb-1">
            Who are you filing for?
          </h1>
          <p className="text-body-small text-neutral-600">
            Select the person for whom you want to file the Income Tax Return
          </p>
        </motion.div>

        {/* Filing Options - Compact 2-Column Grid */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1,
              },
            },
          }}
          className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4"
        >
          {filingOptions.map((option, index) => {
            const Icon = option.icon;
            const isSelected = personType === option.id;
            const isDisabled = option.disabled;

            return (
              <motion.div
                key={option.id}
                variants={{
                  hidden: { opacity: 0, scale: 0.95, y: 20 },
                  visible: {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    transition: springs.gentle,
                  },
                }}
                whileHover={!isDisabled ? {
                  scale: 1.01,
                  transition: springs.snappy,
                } : {}}
                whileTap={!isDisabled ? {
                  scale: 0.98,
                  transition: springs.snappy,
                } : {}}
                onClick={() => !isDisabled && handlePersonTypeSelect(option.id)}
                className={`
                  bg-white rounded-xl shadow-elevation-1 border-2 p-4 cursor-pointer transition-all
                  ${isSelected
                    ? 'border-gold-500 shadow-elevation-2 ring-2 ring-gold-300 ring-opacity-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                  }
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                    ${option.id === 'self'
                      ? 'bg-gradient-to-br from-gold-400 to-gold-600'
                      : 'bg-gradient-to-br from-info-400 to-info-600'
                    }
                    ${isSelected ? 'ring-2 ring-gold-200' : ''}
                  `}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-neutral-900 mb-0.5">
                      {option.title}
                    </h3>
                    <p className="text-body-small text-neutral-600">
                      {option.description}
                    </p>
                  </div>
                </div>
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={springs.bouncy}
                      className="flex items-center justify-center text-gold-600 mt-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span className="ml-1 text-body-small font-medium">Selected</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Family Member Selection - Progressive Disclosure */}
        <AnimatePresence>
          {personType === 'family' && (
            <motion.div
              initial={{ opacity: 0, y: 20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              transition={springs.gentle}
              className="mb-4"
            >
              <div className="bg-white rounded-xl shadow-elevation-1 border border-neutral-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-neutral-900">
                  Select Family Member
                </h3>
                <button
                  onClick={() => setShowAddMemberForm(!showAddMemberForm)}
                  className="flex items-center px-2 py-1 bg-success-500 text-white text-body-small font-medium rounded-xl hover:bg-success-600 transition-colors"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {showAddMemberForm ? 'Cancel' : 'Add New'}
                </button>
              </div>

              {/* Inline Add Member Form */}
              {showAddMemberForm && (
                <div className="mb-3">
                  <MemberFormInline
                    onSuccess={handleMemberAdded}
                    onCancel={() => setShowAddMemberForm(false)}
                    compact={true}
                  />
                </div>
              )}

              {/* Search Bar */}
              {familyMembers.length > 0 && !showAddMemberForm && (
                <div className="mb-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Search family members..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 text-body-small"
                    />
                  </div>
                </div>
              )}

              {familyMembers.length === 0 && !showAddMemberForm ? (
                <div className="text-center py-4">
                  <Users className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                  <p className="text-neutral-600 mb-2 text-body-small">No family members added yet</p>
                  <button
                    onClick={() => setShowAddMemberForm(true)}
                    className="inline-flex items-center px-3 py-1.5 bg-success-500 text-white text-body-small font-medium rounded-xl hover:bg-success-600 transition-colors"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Your First Family Member
                  </button>
                </div>
              ) : familyMembers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                  {familyMembers
                    .filter(member => {
                      if (!searchTerm) return true;
                      const searchLower = searchTerm.toLowerCase();
                      return (
                        member.firstName?.toLowerCase().includes(searchLower) ||
                        member.lastName?.toLowerCase().includes(searchLower) ||
                        member.relationship?.toLowerCase().includes(searchLower) ||
                        member.panNumber?.toLowerCase().includes(searchLower)
                      );
                    })
                    .map((member) => {
                      // Prioritize member.panVerified from database
                      const memberPanStatus = panStatuses[member.id] || { verified: member.panVerified || false };
                      const isVerified = member.panVerified || memberPanStatus.verified || false;
                      const isSelected = selectedFamilyMember?.id === member.id;
                      const hasPAN = !!member.panNumber;
                      const filingStats = memberFilingStats[member.id] || { count: 0, lastFiling: null };
                      const showActions = showMemberActions === member.id;

                      return (
                        <div
                          key={member.id}
                          className={`
                            p-3 border-2 rounded-xl transition-all relative
                            ${isSelected ? 'border-gold-500 bg-gold-50' : 'border-neutral-200 hover:border-neutral-300'}
                          `}
                        >
                          <div
                            onClick={() => handleFamilyMemberSelect(member)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-semibold text-neutral-900 text-sm truncate">
                                    {member.firstName} {member.lastName}
                                  </h4>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowMemberActions(showActions ? null : member.id);
                                    }}
                                    className="p-1 hover:bg-neutral-100 rounded flex-shrink-0 ml-2"
                                  >
                                    <MoreVertical className="w-4 h-4 text-neutral-500" />
                                  </button>
                                </div>
                                <p className="text-body-small text-neutral-600 capitalize mb-1">
                                  {member.relationship}
                                </p>
                                {hasPAN ? (
                                  <p className="text-body-small text-neutral-500 mb-1 font-mono">
                                    PAN: {member.panNumber}
                                  </p>
                                ) : (
                                  <p className="text-body-small text-warning-600 mb-1">
                                    PAN: Not added
                                  </p>
                                )}

                                {/* Filing History */}
                                {filingStats.count > 0 && (
                                  <div className="mt-1.5 pt-1.5 border-t border-neutral-200">
                                    <div className="flex items-center text-body-small text-neutral-600">
                                      <FileText className="w-3 h-3 mr-1" />
                                      <span>{filingStats.count} ITR{filingStats.count !== 1 ? 's' : ''} filed</span>
                                      {filingStats.lastFiling && (
                                        <span className="ml-2 text-neutral-500">
                                          • Last: {filingStats.lastFiling.assessmentYear || 'N/A'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="ml-3 flex flex-col items-end flex-shrink-0">
                                {!hasPAN ? (
                                  <div className="flex items-center text-neutral-500">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="ml-1 text-body-small">Add PAN</span>
                                  </div>
                                ) : isVerified ? (
                                  <div className="flex items-center text-success-600">
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="ml-1 text-body-small">Verified</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center text-warning-600">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="ml-1 text-body-small">Verify</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick Actions Menu */}
                          {showActions && (
                            <div className="mt-2 pt-2 border-t border-neutral-200 space-y-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate('/add-members', {
                                    state: {
                                      returnTo: '/itr/select-person',
                                      editMemberId: member.id,
                                    },
                                  });
                                  setShowMemberActions(null);
                                }}
                                className="w-full flex items-center px-3 py-1.5 text-body-small text-neutral-700 hover:bg-neutral-100 rounded transition-colors"
                              >
                                <Edit className="w-3 h-3 mr-2" />
                                Edit Member
                              </button>
                              {hasPAN && !isVerified && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const person = {
                                      type: 'family',
                                      id: member.id,
                                      name: `${member.firstName} ${member.lastName}`,
                                      panNumber: member.panNumber,
                                      panVerified: false,
                                      member: member,
                                    };
                                    setPanVerificationPerson(person);
                                    setShowPANVerification(true);
                                    setShowMemberActions(null);
                                  }}
                                  className="w-full flex items-center px-3 py-1.5 text-body-small text-warning-700 hover:bg-warning-50 rounded transition-colors"
                                >
                                  <AlertCircle className="w-3 h-3 mr-2" />
                                  Verify PAN
                                </button>
                              )}
                              {filingStats.count > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/itr/filing-history', {
                                      state: {
                                        memberId: member.id,
                                        memberName: `${member.firstName} ${member.lastName}`,
                                      },
                                    });
                                    setShowMemberActions(null);
                                  }}
                                  className="w-full flex items-center px-3 py-1.5 text-body-small text-info-700 hover:bg-info-50 rounded transition-colors"
                                >
                                  <FileText className="w-3 h-3 mr-2" />
                                  View Filing History
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ) : null}

            {/* Optional: Link to full member management */}
            {familyMembers.length > 0 && (
              <div className="text-center mt-2">
                <button
                  onClick={() => navigate('/add-members', { state: { returnTo: '/itr/select-person' } })}
                  className="text-body-small text-neutral-600 hover:text-neutral-900 underline"
                >
                  Manage all family members
                </button>
              </div>
            )}
            </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inline PAN Verification */}
        {showPANVerification && panVerificationPerson && (
          <div className="bg-white rounded-xl shadow-elevation-1 border-2 border-warning-200 p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-neutral-900">
                PAN Verification Required
              </h3>
              <button
                onClick={() => {
                  setShowPANVerification(false);
                  setPanVerificationPerson(null);
                }}
                className="text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <PANVerificationInline
              panNumber={panVerificationPerson.panNumber || ''}
              onVerified={handlePANVerified}
              onVerificationStart={() => setIsVerifyingPAN(true)}
              onCancel={() => {
                setShowPANVerification(false);
                setPanVerificationPerson(null);
                setIsVerifyingPAN(false);
              }}
              memberType={panVerificationPerson.type === 'self' ? 'self' : 'family'}
              memberId={panVerificationPerson.member?.id}
              compact={true}
            />
          </div>
        )}

        {/* PAN Input/Verification for Self when PAN is missing or unverified (only if not already showing inline verification) */}
        {personType === 'self' && !showPANVerification && (!user?.panNumber || !selectedPerson?.panNumber || !selectedPerson?.panVerified) && (
          <div className="bg-white rounded-xl shadow-elevation-1 border-2 border-warning-200 p-3 mb-3">
            <div className="mb-2">
              <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                {user?.panNumber && !selectedPerson?.panVerified
                  ? 'Verify Your PAN Number'
                  : 'Enter Your PAN Number'}
              </h3>
              <p className="text-body-small text-neutral-600">
                {user?.panNumber && !selectedPerson?.panVerified
                  ? 'Your PAN number needs to be verified before filing'
                  : 'PAN is required to file your Income Tax Return'}
              </p>
            </div>
            <PANVerificationInline
              panNumber={selectedPerson?.panNumber || user?.panNumber || ''}
              onVerified={(verificationResult) => {
                // Get the PAN number from verification result
                const verifiedPAN = verificationResult?.pan || selectedPerson?.panNumber || user?.panNumber || '';
                // Update selected person with verified PAN
                const updatedPerson = {
                  type: 'self',
                  id: user?.id,
                  name: user?.fullName || verificationResult?.name || selectedPerson?.name || 'Self',
                  panNumber: verifiedPAN,
                  panVerified: true,
                  panVerifiedAt: verificationResult?.verifiedAt || new Date().toISOString(),
                };
                setSelectedPerson(updatedPerson);
                setPanStatuses(prev => ({
                  ...prev,
                  self: { verified: true, verifiedAt: updatedPerson.panVerifiedAt },
                }));
                toast.success('PAN verified successfully!');
                // Auto-proceed after successful verification
                setTimeout(() => {
                  proceedToDataSourceSelection(updatedPerson);
                }, 1000);
              }}
              onCancel={() => {
                // Don't allow canceling - PAN is required for filing
              }}
              memberType="self"
              compact={false}
            />
          </div>
        )}

        {/* Selected Person Summary & Proceed Button */}
        {selectedPerson && selectedPerson.panNumber && selectedPerson.panVerified && (
          <div className="bg-white rounded-xl shadow-elevation-1 border border-neutral-200 p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                  Selected Person
                </h3>
                <div className="flex items-center gap-4 text-body-small">
                  <span className="text-neutral-600">
                    <span className="font-semibold text-neutral-900">{selectedPerson.name}</span>
                  </span>
                  <span className="text-neutral-600">
                    PAN: <span className="font-mono">{selectedPerson.panNumber.substring(0, 5)}*****</span>
                  </span>
                  <div className="flex items-center text-success-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    <span className="font-medium">Verified</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleProceed}
                className="flex items-center px-4 py-2 bg-gold-500 text-white font-semibold rounded-xl hover:bg-gold-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-elevation-3 shadow-gold-500/20 text-body-regular"
                disabled={!selectedPerson.panVerified}
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilingPersonSelector;
