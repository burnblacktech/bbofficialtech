// =====================================================
// CLIENT ASSIGNMENT MODAL
// Modal to assign clients to preparers/reviewers
// =====================================================

import React, { useState, useEffect } from 'react';
import { enterpriseLogger } from '../../utils/logger';
import { X, User, Save, Loader } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../DesignSystem/components/Button';
import toast from 'react-hot-toast';
import apiClient from '../../services/core/APIClient';

const ClientAssignmentModal = ({ isOpen, onClose, clientId, firmId, onAssignmentComplete }) => {
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [formData, setFormData] = useState({
    userId: '',
    role: 'preparer',
  });

  useEffect(() => {
    if (isOpen && firmId) {
      fetchStaff();
      fetchAssignments();
    }
  }, [isOpen, firmId, clientId]);

  const fetchStaff = async () => {
    try {
      const response = await apiClient.get(`/firms/${firmId}/staff`);
      if (response.data.success) {
        setStaff(response.data.data || []);
      }
    } catch (error) {
      enterpriseLogger.error('Failed to fetch staff', { error });
    }
  };

  const fetchAssignments = async () => {
    if (!clientId) return;
    try {
      const response = await apiClient.get(`/clients/${clientId}/assignments`);
      if (response.data.success) {
        setAssignments(response.data.data || []);
      }
    } catch (error) {
      enterpriseLogger.error('Failed to fetch assignments', { error });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.userId) {
      toast.error('Please select a staff member.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post(`/clients/${clientId}/assign`, {
        userId: formData.userId,
        role: formData.role,
      });

      if (response.data.success) {
        toast.success('Client assigned successfully!');
        if (onAssignmentComplete) {
          onAssignmentComplete();
        }
        fetchAssignments();
        setFormData({ userId: '', role: 'preparer' });
      } else {
        toast.error(response.data.error || 'Failed to assign client.');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to assign client.');
      enterpriseLogger.error('Assignment error', { error });
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAssignment = async (assignmentId) => {
    // Use a more user-friendly confirmation approach
    // In production, replace with a proper confirmation modal component
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm('Are you sure you want to revoke this assignment?');

    if (!confirmed) {
      return;
    }

    try {
      const response = await apiClient.delete(`/assignments/${assignmentId}`, {
        data: { reason: 'Revoked by admin' },
      });

      if (response.data.success) {
        toast.success('Assignment revoked successfully.');
        fetchAssignments();
      } else {
        toast.error('Failed to revoke assignment.');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to revoke assignment.');
    }
  };

  const eligibleStaff = staff.filter(
    (member) =>
      member.staff.role === 'CA' ||
      member.staff.role === 'PREPARER' ||
      member.staff.role === 'REVIEWER' ||
      member.staff.role === 'CA_FIRM_ADMIN',
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Client">
      <div className="p-4 space-y-6">
        {/* Existing Assignments */}
        {assignments.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Current Assignments</h3>
            <div className="space-y-2">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                >
                  <div>
                    <p className="text-body-regular font-medium text-slate-900">
                      {assignment.user?.fullName || 'Unknown User'}
                    </p>
                    <p className="text-body-small text-slate-600 capitalize">{assignment.role}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevokeAssignment(assignment.id)}
                    className="text-error-600 hover:text-error-700"
                  >
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Assignment Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="role" className="block text-body-regular font-medium text-slate-700 mb-1">
              Assignment Role *
            </label>
            <select
              id="role"
              name="role"
              required
              value={formData.role}
              onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="preparer">Preparer</option>
              <option value="reviewer">Reviewer</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label htmlFor="userId" className="block text-body-regular font-medium text-slate-700 mb-1">
              Staff Member *
            </label>
            <select
              id="userId"
              name="userId"
              required
              value={formData.userId}
              onChange={(e) => setFormData((prev) => ({ ...prev, userId: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a staff member...</option>
              {eligibleStaff.map((member) => (
                <option key={member.staff.id} value={member.staff.id}>
                  {member.staff.name} ({member.staff.role})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Assigning...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Assign</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ClientAssignmentModal;

