// =====================================================
// MEMBER MANAGEMENT SERVICE - BACKEND INTEGRATION
// =====================================================

import apiClient from './core/APIClient';

class MemberService {
  /**
   * Get all family members for the current user
   */
  async getMembers() {
    try {
      const response = await apiClient.get('/members');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch members:', error);
      throw error;
    }
  }

  /**
   * Get a specific member by ID
   */
  async getMember(memberId) {
    try {
      const response = await apiClient.get(`/members/${memberId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch member:', error);
      throw error;
    }
  }

  /**
   * Create a new family member
   */
  async createMember(memberData) {
    try {
      const response = await apiClient.post('/members', memberData);
      return response.data;
    } catch (error) {
      console.error('Failed to create member:', error);
      throw error;
    }
  }

  /**
   * Update an existing family member
   */
  async updateMember(memberId, memberData) {
    try {
      const response = await apiClient.put(`/members/${memberId}`, memberData);
      return response.data;
    } catch (error) {
      console.error('Failed to update member:', error);
      throw error;
    }
  }

  /**
   * Delete a family member
   */
  async deleteMember(memberId) {
    try {
      const response = await apiClient.delete(`/members/${memberId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete member:', error);
      throw error;
    }
  }

  /**
   * Verify PAN for a member
   */
  async verifyPAN(memberId) {
    try {
      const response = await apiClient.post(`/members/${memberId}/verify-pan`);
      return response.data;
    } catch (error) {
      console.error('Failed to verify PAN:', error);
      throw error;
    }
  }

  /**
   * Get member statistics
   */
  async getMemberStats() {
    try {
      const response = await apiClient.get('/members/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch member stats:', error);
      throw error;
    }
  }
}

// Create singleton instance
const memberService = new MemberService();

export default memberService;
