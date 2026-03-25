// Stub — member service for MVP (single-user filing)
import api from './api';
const memberService = {
  getMembers: async () => ({ data: { members: [] } }),
  addMember: async () => ({}),
  deleteMember: async () => ({}),
};
export default memberService;
