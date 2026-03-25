// Stub — member service for MVP (single-user filing)
import api from './api';
const memberService = {
  getMembers: async () => ({ data: { members: [] } }),
  getAllMembers: async () => ({ data: [] }),
  addMember: async () => ({}),
  deleteMember: async () => ({}),
};
export default memberService;
