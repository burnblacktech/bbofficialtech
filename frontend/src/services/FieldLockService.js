// Stub — field lock service for MVP
export const VERIFICATION_STATUS = { VERIFIED: 'verified', UNVERIFIED: 'unverified', PENDING: 'pending' };
const fieldLockService = {
  isFieldLocked: () => false,
  getFieldStatus: () => VERIFICATION_STATUS.UNVERIFIED,
  lockField: () => {},
  unlockField: () => {},
};
export default fieldLockService;
