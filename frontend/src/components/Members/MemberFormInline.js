// =====================================================
// INLINE MEMBER FORM COMPONENT
// Reusable inline form for adding/editing family members
// =====================================================

import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, Loader } from 'lucide-react';
import memberService from '../../services/memberService';
import PANVerificationInline from '../ITR/PANVerificationInline';
import toast from 'react-hot-toast';
import useAutoSave from '../../hooks/useAutoSave';
import formDataService from '../../services/FormDataService';
import fieldLockService, { VERIFICATION_STATUS } from '../../services/FieldLockService';
import verificationStatusService from '../../services/VerificationStatusService';

const MemberFormInline = ({ onSuccess, onCancel, editingMember = null, compact = false }) => {
  const [formData, setFormData] = useState({
    firstName: editingMember?.firstName || '',
    lastName: editingMember?.lastName || '',
    panNumber: editingMember?.panNumber || '',
    dateOfBirth: editingMember?.dateOfBirth || '',
    relationship: editingMember?.relationship || '',
    phoneNumber: editingMember?.phoneNumber || '',
    email: editingMember?.email || '',
    panVerified: editingMember?.panVerified || false,
    panVerifiedAt: editingMember?.panVerifiedAt || null,
  });
  const [showPANVerification, setShowPANVerification] = useState(false);
  const [panVerificationResult, setPanVerificationResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldVerificationStatuses, setFieldVerificationStatuses] = useState({});
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Load member data when editingMember changes
  useEffect(() => {
    const loadMemberData = async () => {
      if (!editingMember?.id) return;

      setIsDataLoading(true);
      try {
        // Load member data from database
        const loadedData = await formDataService.loadFamilyMemberData(editingMember.id);
        if (loadedData && Object.keys(loadedData).length > 0) {
          setFormData(prev => ({
            ...prev,
            firstName: loadedData.firstName || prev.firstName,
            lastName: loadedData.lastName || prev.lastName,
            panNumber: loadedData.panNumber || prev.panNumber,
            dateOfBirth: loadedData.dateOfBirth || prev.dateOfBirth,
            relationship: loadedData.relationship || prev.relationship,
            phoneNumber: loadedData.phoneNumber || prev.phoneNumber,
            email: loadedData.email || prev.email,
            panVerified: loadedData.panVerified || prev.panVerified,
            panVerifiedAt: loadedData.panVerifiedAt || prev.panVerifiedAt,
          }));

          // Load verification statuses if available
          if (loadedData.verificationStatuses) {
            setFieldVerificationStatuses(loadedData.verificationStatuses);
          } else {
            // Initialize verification statuses based on existing data
            const statuses = {};
            if (loadedData.panVerified) {
              statuses['panNumber'] = VERIFICATION_STATUS.VERIFIED;
              fieldLockService.setFieldVerificationStatus('familyMember', 'panNumber', VERIFICATION_STATUS.VERIFIED, 'pan_verification');
            }
            if (loadedData.firstName && loadedData.lastName) {
              statuses['firstName'] = VERIFICATION_STATUS.AUTO_FILLED;
              statuses['lastName'] = VERIFICATION_STATUS.AUTO_FILLED;
            }
            setFieldVerificationStatuses(statuses);
          }
        }
      } catch (error) {
        console.error('Failed to load member data:', error);
      } finally {
        setIsDataLoading(false);
      }
    };

    loadMemberData();
  }, [editingMember?.id]);

  // Auto-save function
  const saveMemberData = useCallback(async (dataToSave) => {
    try {
      if (!editingMember?.id) {
        // For new members, don't auto-save until they have a member ID
        // Save to localStorage as draft instead
        const draftKey = `family_member_draft_${dataToSave.panNumber || 'new'}`;
        localStorage.setItem(draftKey, JSON.stringify({
          ...dataToSave,
          savedAt: new Date().toISOString(),
        }));
        return;
      }

      // Save to database
      await formDataService.saveFamilyMemberData(editingMember.id, dataToSave);

      // Save verification statuses
      if (Object.keys(fieldVerificationStatuses).length > 0) {
        // Store verification statuses in member metadata or separate table
        // For now, we'll include it in the member data
        await formDataService.saveFamilyMemberData(editingMember.id, {
          ...dataToSave,
          verificationStatuses: fieldVerificationStatuses,
        });
      }
    } catch (error) {
      console.error('Failed to auto-save member data:', error);
      throw error;
    }
  }, [editingMember?.id, fieldVerificationStatuses]);

  // Auto-save hook
  const { saveStatus, triggerSave } = useAutoSave({
    saveFn: saveMemberData,
    data: formData,
    debounceMs: 2000,
    localStorageKey: editingMember?.id
      ? `family_member_${editingMember.id}`
      : `family_member_draft_${formData.panNumber || 'new'}`,
    enabled: !isDataLoading && !isSubmitting && (editingMember?.id || formData.panNumber),
    onSaveSuccess: () => {
      // Silent success for auto-save
    },
    onSaveError: (error) => {
      console.error('Auto-save failed:', error);
      // Don't show toast for auto-save errors to avoid noise
    },
  });

  // Handle field blur to trigger immediate save
  const handleFieldBlur = useCallback((fieldName) => {
    if (editingMember?.id) {
      triggerSave();
    }
  }, [editingMember?.id, triggerSave]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Reset PAN verification if PAN number changes
    if (name === 'panNumber') {
      setPanVerificationResult(null);
      setFormData(prev => ({
        ...prev,
        panVerified: false,
        panVerifiedAt: null,
      }));
    }
  };

  const handlePANVerified = (verificationResult, pan) => {
    setPanVerificationResult(verificationResult);
    setFormData(prev => ({
      ...prev,
      panNumber: pan || prev.panNumber,
      panVerified: true,
      panVerifiedAt: verificationResult.verifiedAt || new Date().toISOString(),
    }));
    // Set verification status for PAN
    const newStatuses = {
      ...fieldVerificationStatuses,
      panNumber: VERIFICATION_STATUS.VERIFIED,
    };
    setFieldVerificationStatuses(newStatuses);
    fieldLockService.setFieldVerificationStatus('familyMember', 'panNumber', VERIFICATION_STATUS.VERIFIED, 'pan_verification');
    // If name is available from verification, auto-fill it
    if (verificationResult.name) {
      const nameParts = verificationResult.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      if (firstName && !formData.firstName) {
        setFormData(prev => ({
          ...prev,
          firstName,
          lastName: lastName || prev.lastName,
        }));
        // Mark name fields as auto-filled
        const updatedStatuses = {
          ...newStatuses,
          firstName: VERIFICATION_STATUS.AUTO_FILLED,
          lastName: lastName ? VERIFICATION_STATUS.AUTO_FILLED : newStatuses.lastName,
        };
        setFieldVerificationStatuses(updatedStatuses);
      }
    }

    setShowPANVerification(false);
    toast.success('PAN verified successfully!');
        // Trigger immediate save after PAN verification
    if (editingMember?.id) {
      setTimeout(() => triggerSave(), 500);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName) {
      toast.error('First name and last name are required');
      return;
    }

    if (!formData.panNumber) {
      toast.error('PAN number is required');
      return;
    }

    // Validate PAN format
    if (formData.panNumber.length !== 10) {
      toast.error('PAN number must be 10 characters long');
      return;
    }

    // Require PAN verification before submission
    if (!formData.panVerified) {
      toast.error('Please verify your PAN number before saving');
      setShowPANVerification(true);
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingMember) {
        await memberService.updateMember(editingMember.id, formData);
        toast.success('Family member updated successfully');
      } else {
        await memberService.addMember(formData);
        toast.success('Family member added successfully');
      }

      if (onSuccess) {
        onSuccess(formData);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save family member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const relationshipOptions = [
    { value: 'spouse', label: 'Spouse' },
    { value: 'child', label: 'Child' },
    { value: 'parent', label: 'Parent' },
    { value: 'sibling', label: 'Sibling' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className={`bg-white rounded-xl border border-slate-200 ${compact ? 'p-4' : 'p-6'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-heading-4 font-semibold text-slate-900">
            {editingMember ? 'Edit Family Member' : 'Add New Family Member'}
          </h3>
          {editingMember?.id && saveStatus === 'saving' && (
            <span className="text-body-small text-slate-500 flex items-center gap-1">
              <Loader className="w-3 h-3 animate-spin" />
              Saving...
            </span>
          )}
          {editingMember?.id && saveStatus === 'saved' && (
            <span className="text-body-small text-green-600 flex items-center gap-1">
              <span>✓</span>
              Saved
            </span>
          )}
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              onBlur={() => handleFieldBlur('firstName')}
              required
              disabled={fieldLockService.shouldLockField('familyMember', 'firstName', fieldVerificationStatuses.firstName)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              onBlur={() => handleFieldBlur('lastName')}
              required
              disabled={fieldLockService.shouldLockField('familyMember', 'lastName', fieldVerificationStatuses.lastName)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-1">
              PAN Number *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="panNumber"
                value={formData.panNumber}
                onChange={handleInputChange}
                onBlur={() => handleFieldBlur('panNumber')}
                maxLength={10}
                required
                disabled={fieldLockService.shouldLockField('familyMember', 'panNumber', fieldVerificationStatuses.panNumber)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 font-mono uppercase disabled:bg-slate-100 disabled:cursor-not-allowed"
                placeholder="ABCDE1234F"
              />
              {formData.panNumber && formData.panNumber.length === 10 && !formData.panVerified && (
                <button
                  type="button"
                  onClick={() => setShowPANVerification(true)}
                  className="px-4 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600 transition-colors text-body-regular"
                >
                  Verify PAN
                </button>
              )}
            </div>
            {formData.panVerified && (
              <p className="text-body-small text-success-600 mt-1 flex items-center">
                <span className="mr-1">✓</span> PAN Verified
              </p>
            )}
          </div>

          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-1">
              Relationship *
            </label>
            <select
              name="relationship"
              value={formData.relationship}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              <option value="">Select relationship</option>
              {relationshipOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              onBlur={() => handleFieldBlur('dateOfBirth')}
              disabled={fieldLockService.shouldLockField('familyMember', 'dateOfBirth', fieldVerificationStatuses.dateOfBirth)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-body-regular font-medium text-slate-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              onBlur={() => handleFieldBlur('phoneNumber')}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-body-regular font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              onBlur={() => handleFieldBlur('email')}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
        </div>

        {/* PAN Verification Inline */}
        {showPANVerification && (
          <div className="mt-4 p-4 bg-gold-50 border border-gold-200 rounded-xl">
            <PANVerificationInline
              panNumber={formData.panNumber}
              onVerified={(result, pan) => handlePANVerified(result, pan)}
              onCancel={() => setShowPANVerification(false)}
              memberType="family"
              compact={true}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center px-6 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {editingMember ? 'Update Member' : 'Add Member'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MemberFormInline;

