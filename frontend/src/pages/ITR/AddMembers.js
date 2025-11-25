// Add Members Page - HUF/Family Filing Management
// Allows users to add up to 5 family members for joint ITR filings
// Each member gets their own financial profile and PAN-based tracking

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Plus,
  User,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Users,
  FileText,
  Calendar,
  CreditCard,
  Eye,
} from 'lucide-react';
import {
  EnterpriseCard,
  EnterpriseButton,
  EnterpriseBadge,
  EnterpriseStatCard,
} from '../../components/DesignSystem/EnterpriseComponents';

const AddMembers = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock data - will be replaced with API calls
  const mockMembers = [
    {
      id: '1',
      name: 'John Doe',
      pan: 'ABCDE1234F',
      relationship: 'Self',
      dateOfBirth: '1985-06-15',
      status: 'active',
      filingsCount: 3,
      lastFiling: '2023-24',
      createdAt: '2023-01-15',
    },
    {
      id: '2',
      name: 'Jane Doe',
      pan: 'FGHIJ5678K',
      relationship: 'Spouse',
      dateOfBirth: '1988-03-22',
      status: 'active',
      filingsCount: 2,
      lastFiling: '2023-24',
      createdAt: '2023-02-10',
    },
  ];

  const relationshipOptions = [
    'Self',
    'Spouse',
    'Son',
    'Daughter',
    'Father',
    'Mother',
    'Brother',
    'Sister',
    'Other',
  ];

  const [formData, setFormData] = useState({
    name: '',
    pan: '',
    relationship: 'Self',
    dateOfBirth: '',
    mobile: '',
    email: '',
  });

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setMembers(mockMembers);
      setLoading(false);
    }, 1000);
  }, []);

  const handleAddMember = () => {
    if (members.length >= 5) {
      alert('Maximum 5 members allowed per family');
      return;
    }
    setShowAddForm(true);
    setEditingMember(null);
    setFormData({
      name: '',
      pan: '',
      relationship: 'Self',
      dateOfBirth: '',
      mobile: '',
      email: '',
    });
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      pan: member.pan,
      relationship: member.relationship,
      dateOfBirth: member.dateOfBirth,
      mobile: member.mobile || '',
      email: member.email || '',
    });
    setShowAddForm(true);
  };

  const handleDeleteMember = (memberId) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      setMembers(members.filter(m => m.id !== memberId));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate PAN format
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(formData.pan)) {
      alert('Please enter a valid PAN number');
      return;
    }

    // Check for duplicate PAN
    const existingMember = members.find(m => m.pan === formData.pan);
    if (existingMember && existingMember.id !== editingMember?.id) {
      alert('PAN number already exists for another member');
      return;
    }

    if (editingMember) {
      // Update existing member
      setMembers(members.map(m =>
        m.id === editingMember.id
          ? { ...m, ...formData, updatedAt: new Date().toISOString() }
          : m,
      ));
    } else {
      // Add new member
      const newMember = {
        id: Date.now().toString(),
        ...formData,
        status: 'active',
        filingsCount: 0,
        lastFiling: null,
        createdAt: new Date().toISOString(),
      };
      setMembers([...members, newMember]);
    }

    setShowAddForm(false);
    setEditingMember(null);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingMember(null);
    setFormData({
      name: '',
      pan: '',
      relationship: 'Self',
      dateOfBirth: '',
      mobile: '',
      email: '',
    });
  };

  const getRelationshipColor = (relationship) => {
    switch (relationship) {
      case 'Self':
        return 'bg-blue-100 text-blue-800';
      case 'Spouse':
        return 'bg-pink-100 text-pink-800';
      case 'Son':
      case 'Daughter':
        return 'bg-green-100 text-green-800';
      case 'Father':
      case 'Mother':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="h-8 w-8 animate-pulse text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Family Members</h1>
          <p className="text-gray-600 mt-1">
            Manage family members for joint ITR filings (Maximum 5 members)
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">{members.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Members</p>
                <p className="text-2xl font-bold text-gray-900">
                  {members.filter(m => m.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Filings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {members.reduce((sum, m) => sum + m.filingsCount, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Slots Remaining</p>
                <p className="text-2xl font-bold text-gray-900">{5 - members.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Add Member Button */}
        <div className="mb-6">
          <button
            onClick={handleAddMember}
            disabled={members.length >= 5}
            className={`flex items-center px-4 py-2 rounded-lg ${
              members.length >= 5
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Member
          </button>
          {members.length >= 5 && (
            <p className="text-sm text-gray-500 mt-2">
              Maximum 5 members reached. Remove a member to add a new one.
            </p>
          )}
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingMember ? 'Edit Member' : 'Add New Member'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PAN Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.pan}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ABCDE1234F"
                    maxLength="10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship *
                  </label>
                  <select
                    required
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {relationshipOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+91 9876543210"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="member@example.com"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingMember ? 'Update Member' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Members List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {members.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No members added</h3>
              <p className="text-gray-600 mb-4">
                Add family members to manage joint ITR filings
              </p>
              <button
                onClick={handleAddMember}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Member
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PAN Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Relationship
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Filings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Filing
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{member.name}</div>
                            <div className="text-sm text-gray-500">
                              DOB: {new Date(member.dateOfBirth).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {member.pan}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRelationshipColor(member.relationship)}`}>
                          {member.relationship}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.filingsCount} filings
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.lastFiling || 'No filings yet'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditMember(member)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit Member"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => window.open(`/financial-profile?pan=${member.pan}`, '_blank')}
                            className="text-green-600 hover:text-green-900"
                            title="View Financial Profile"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Member"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Information Panel */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Important Information</h4>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• Each member must have a unique PAN number</li>
                <li>• Maximum 5 members can be added per family</li>
                <li>• Each member can have their own ITR filing</li>
                <li>• Financial profiles are maintained separately for each member</li>
                <li>• CA-assisted filings will be visible to all relevant parties</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMembers;
