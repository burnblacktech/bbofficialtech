// =====================================================
// MEMBER MANAGEMENT UI COMPONENT
// Complete family member management interface
// =====================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import apiClient from '../../services';
import toast from 'react-hot-toast';

const MemberManagement = () => {
  const navigate = useNavigate();
  
  // State management
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    pan: '',
    relationship: '',
    dateOfBirth: '',
    gender: '',
    metadata: {}
  });

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/members');
      setMembers(response.data.data.members || []);
    } catch (error) {
      console.error('Failed to load members:', error);
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = () => {
    setFormData({
      fullName: '',
      pan: '',
      relationship: '',
      dateOfBirth: '',
      gender: '',
      metadata: {}
    });
    setShowAddModal(true);
  };

  const handleEditMember = (member) => {
    setSelectedMember(member);
    setFormData({
      fullName: member.fullName,
      pan: member.pan,
      relationship: member.relationship,
      dateOfBirth: member.dateOfBirth || '',
      gender: member.gender || '',
      metadata: member.metadata || {}
    });
    setShowEditModal(true);
  };

  const handleDeleteMember = async (memberId) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      try {
        await apiClient.delete(`/members/${memberId}`);
        toast.success('Member deleted successfully');
        loadMembers();
      } catch (error) {
        console.error('Failed to delete member:', error);
        toast.error('Failed to delete member');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (showAddModal) {
        await apiClient.post('/members', formData);
        toast.success('Member added successfully');
      } else {
        await apiClient.put(`/members/${selectedMember.id}`, formData);
        toast.success('Member updated successfully');
      }
      
      setShowAddModal(false);
      setShowEditModal(false);
      loadMembers();
    } catch (error) {
      console.error('Failed to save member:', error);
      toast.error('Failed to save member');
    }
  };

  const handleFileITR = (memberId) => {
    navigate(`/itr/filing?member=${memberId}`);
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.pan.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.relationship.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      'active': 'green',
      'inactive': 'gray'
    };
    return colors[status] || 'gray';
  };

  const getRelationshipLabel = (relationship) => {
    const labels = {
      'spouse': 'Spouse',
      'child': 'Child',
      'parent': 'Parent',
      'sibling': 'Sibling',
      'other': 'Other'
    };
    return labels[relationship] || 'Unknown';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  if (loading) {
    return (
      <div className="member-management loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="member-management">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>Family Members</h1>
          <p>Manage your family members for ITR filing</p>
        </div>
        <div className="header-actions">
          <Button
            variant="primary"
            onClick={handleAddMember}
          >
            Add Member
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="status-filter">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Members Grid */}
      <div className="members-grid">
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member) => (
            <Card key={member.id} className="member-card">
              <div className="member-header">
                <h3>{member.fullName}</h3>
                <StatusBadge
                  status={member.status}
                  color={getStatusColor(member.status)}
                />
              </div>
              
              <div className="member-details">
                <div className="detail-row">
                  <span className="label">PAN:</span>
                  <span className="value">{member.pan}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Relationship:</span>
                  <span className="value">{getRelationshipLabel(member.relationship)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Date of Birth:</span>
                  <span className="value">{formatDate(member.dateOfBirth)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Gender:</span>
                  <span className="value">{member.genderLabel || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Added:</span>
                  <span className="value">{formatDate(member.createdAt)}</span>
                </div>
              </div>

              <div className="member-actions">
                <Button
                  variant="secondary"
                  onClick={() => handleEditMember(member)}
                >
                  Edit
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleFileITR(member.id)}
                >
                  File ITR
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleDeleteMember(member.id)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <div className="empty-state">
            <h3>No Members Found</h3>
            <p>
              {searchTerm || statusFilter !== 'all' 
                ? 'No members match your search criteria'
                : 'Add your first family member to get started'
              }
            </p>
            <Button
              variant="primary"
              onClick={handleAddMember}
            >
              Add Member
            </Button>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Family Member"
      >
        <form onSubmit={handleSubmit} className="member-form">
          <div className="form-group">
            <label htmlFor="fullName">Full Name *</label>
            <input
              type="text"
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="pan">PAN Number *</label>
            <input
              type="text"
              id="pan"
              value={formData.pan}
              onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
              required
              maxLength="10"
              className="form-input"
              placeholder="ABCDE1234F"
            />
          </div>

          <div className="form-group">
            <label htmlFor="relationship">Relationship *</label>
            <select
              id="relationship"
              value={formData.relationship}
              onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
              required
              className="form-select"
            >
              <option value="">Select Relationship</option>
              <option value="spouse">Spouse</option>
              <option value="child">Child</option>
              <option value="parent">Parent</option>
              <option value="sibling">Sibling</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="dateOfBirth">Date of Birth</label>
            <input
              type="date"
              id="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="gender">Gender</label>
            <select
              id="gender"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="form-select"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Add Member
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Member Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Family Member"
      >
        <form onSubmit={handleSubmit} className="member-form">
          <div className="form-group">
            <label htmlFor="editFullName">Full Name *</label>
            <input
              type="text"
              id="editFullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="editPan">PAN Number *</label>
            <input
              type="text"
              id="editPan"
              value={formData.pan}
              onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
              required
              maxLength="10"
              className="form-input"
              placeholder="ABCDE1234F"
            />
          </div>

          <div className="form-group">
            <label htmlFor="editRelationship">Relationship *</label>
            <select
              id="editRelationship"
              value={formData.relationship}
              onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
              required
              className="form-select"
            >
              <option value="">Select Relationship</option>
              <option value="spouse">Spouse</option>
              <option value="child">Child</option>
              <option value="parent">Parent</option>
              <option value="sibling">Sibling</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="editDateOfBirth">Date of Birth</label>
            <input
              type="date"
              id="editDateOfBirth"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="editGender">Gender</label>
            <select
              id="editGender"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="form-select"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="editStatus">Status</label>
            <select
              id="editStatus"
              value={formData.status || 'active'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="form-select"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Update Member
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MemberManagement;
