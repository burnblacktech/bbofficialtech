// =====================================================
// ADD MEMBERS PAGE - MANAGE FAMILY MEMBERS
// =====================================================

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Plus, Users, User, Edit, Trash2, Phone, Mail, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import memberService from '../../services/memberService';
import PANVerificationInline from '../../components/ITR/PANVerificationInline';

const AddMembers = () => {
  const { user: _user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const returnTo = location.state?.returnTo;

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    panNumber: '',
    dateOfBirth: '',
    relationship: '',
    phoneNumber: '',
    email: '',
    panVerified: false,
    panVerifiedAt: null,
  });
  const [showPANVerification, setShowPANVerification] = useState(false);
  const [panVerificationResult, setPanVerificationResult] = useState(null);
  const [memberToDelete, setMemberToDelete] = useState(null);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const response = await memberService.getMembers();
      // Handle different API response structures
      const membersArray = response.data?.members || response.members || response.data || [];
      setMembers(Array.isArray(membersArray) ? membersArray : []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load family members');
      setMembers([]); // Ensure members is always an array
    } finally {
      setLoading(false);
    }
  };

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

  const handlePANVerified = (verificationResult) => {
    setPanVerificationResult(verificationResult);
    setFormData(prev => ({
      ...prev,
      panVerified: true,
      panVerifiedAt: verificationResult.verifiedAt || new Date().toISOString(),
    }));
    setShowPANVerification(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingMember) {
        // Update existing member
        await memberService.updateMember(editingMember.id, formData);
        toast.success('Family member updated successfully');
      } else {
        // Add new member
        await memberService.addMember(formData);
        toast.success('Family member added successfully');
      }

      setShowAddForm(false);
      setEditingMember(null);
      setFormData({
        firstName: '',
        lastName: '',
        panNumber: '',
        dateOfBirth: '',
        relationship: '',
        phoneNumber: '',
        email: '',
        panVerified: false,
        panVerifiedAt: null,
      });
      setShowPANVerification(false);
      setPanVerificationResult(null);

      loadMembers();

      // Navigate back if came from FilingPersonSelector
      if (returnTo) {
        setTimeout(() => {
          navigate(returnTo);
        }, 1000);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save family member');
    }
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setFormData({
      firstName: member.firstName || '',
      lastName: member.lastName || '',
      panNumber: member.panNumber || '',
      dateOfBirth: member.dateOfBirth || '',
      relationship: member.relationship || '',
      phoneNumber: member.phoneNumber || '',
      email: member.email || '',
      panVerified: member.panVerified || false,
      panVerifiedAt: member.panVerifiedAt || null,
    });
    setPanVerificationResult(member.panVerified ? { name: `${member.firstName} ${member.lastName}` } : null);
    setShowAddForm(true);
    setShowPANVerification(false);
  };

  const handleDelete = (memberId) => {
    setMemberToDelete(memberId);
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;

    try {
      await memberService.deleteMember(memberToDelete);
      toast.success('Family member deleted successfully');
      setMemberToDelete(null);
      loadMembers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete family member');
      setMemberToDelete(null);
    }
  };

  const cancelDelete = () => {
    setMemberToDelete(null);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingMember(null);
    setShowPANVerification(false);
    setPanVerificationResult(null);
    setFormData({
      firstName: '',
      lastName: '',
      panNumber: '',
      dateOfBirth: '',
      relationship: '',
      phoneNumber: '',
      email: '',
      panVerified: false,
      panVerifiedAt: null,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-neutral-600">Loading family members...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-4 lg:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Family Members
          </h1>
          <p className="text-neutral-600">
            Manage your family members for ITR filing
          </p>
        </div>

        {/* Add Member Button */}
        <div className="mb-6">
          <Button
            variant="primary"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Family Member
          </Button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card className="mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                {editingMember ? 'Edit Family Member' : 'Add New Family Member'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      PAN Number *
                    </label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          name="panNumber"
                          value={formData.panNumber}
                          onChange={handleInputChange}
                          required
                          maxLength="10"
                          placeholder="ABCDE1234F"
                          className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono uppercase"
                        />
                        {formData.panNumber && formData.panNumber.length === 10 && !formData.panVerified && (
                          <button
                            type="button"
                            onClick={() => setShowPANVerification(true)}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
                          >
                            <Shield className="w-4 h-4" />
                            <span>Verify PAN</span>
                          </button>
                        )}
                      </div>
                      {formData.panVerified && panVerificationResult && (
                        <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                          <CheckCircle className="w-4 h-4" />
                          <span>PAN Verified: {panVerificationResult.name}</span>
                        </div>
                      )}
                      {formData.panNumber && formData.panNumber.length === 10 && !formData.panVerified && (
                        <p className="text-xs text-gray-500">
                          Optional: Verify PAN to ensure accuracy
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Relationship *
                    </label>
                    <select
                      name="relationship"
                      value={formData.relationship}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select Relationship</option>
                      <option value="spouse">Spouse</option>
                      <option value="son">Son</option>
                      <option value="daughter">Daughter</option>
                      <option value="father">Father</option>
                      <option value="mother">Mother</option>
                      <option value="brother">Brother</option>
                      <option value="sister">Sister</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    variant="primary"
                  >
                    {editingMember ? 'Update Member' : 'Add Member'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                </div>
              </form>

              {/* PAN Verification Section */}
              {showPANVerification && formData.panNumber && formData.panNumber.length === 10 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <PANVerificationInline
                    panNumber={formData.panNumber}
                    onVerified={handlePANVerified}
                    onCancel={() => setShowPANVerification(false)}
                    memberType="family"
                    memberId={editingMember?.id}
                    compact={false}
                  />
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Members List */}
        {members.length === 0 ? (
          <Card>
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                No family members added
              </h3>
              <p className="text-neutral-600 mb-6">
                Add family members to file ITR for them
              </p>
              <Button
                variant="primary"
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Add First Member
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {members.map((member) => (
              <Card key={member.id}>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900">
                          {member.firstName} {member.lastName}
                        </h3>
                        <p className="text-sm text-neutral-600 capitalize">
                          {member.relationship}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEdit(member)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDelete(member.id)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-neutral-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">PAN:</span>
                        <span className="font-mono">{member.panNumber}</span>
                      </div>
                      {member.panVerified ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingMember(member);
                            setFormData({
                              firstName: member.firstName || '',
                              lastName: member.lastName || '',
                              panNumber: member.panNumber || '',
                              dateOfBirth: member.dateOfBirth || '',
                              relationship: member.relationship || '',
                              phoneNumber: member.phoneNumber || '',
                              email: member.email || '',
                              panVerified: member.panVerified || false,
                              panVerifiedAt: member.panVerifiedAt || null,
                            });
                            setShowAddForm(true);
                            setShowPANVerification(true);
                          }}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors"
                        >
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Verify PAN
                        </button>
                      )}
                    </div>

                    {member.dateOfBirth && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">DOB:</span>
                        <span>{new Date(member.dateOfBirth).toLocaleDateString()}</span>
                      </div>
                    )}

                    {member.phoneNumber && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{member.phoneNumber}</span>
                      </div>
                    )}

                    {member.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{member.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {memberToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Delete Family Member</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this family member? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddMembers;
