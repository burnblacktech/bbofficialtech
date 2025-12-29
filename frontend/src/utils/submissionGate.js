
/**
 * CENTRALIZED SUBMISSION GATE
 * 
 * "Profile completeness is NOT a navigation constraint.
 *  It is ONLY a submission constraint."
 * 
 * @param {object} user - The user object from AuthContext/Backend
 * @param {object} formData - The current ITR form data
 * @returns {object} { ok: boolean, missing: string[] }
 */
export const canSubmitFiling = (user, formData) => {
    const missing = [];

    // 1. PAN Check
    // We check the USER object, as that is the source of truth for Identity
    if (!user?.panNumber || !user?.panVerified) {
        missing.push('PAN');
    }

    // 2. Bank Check
    // We look for at least one valid bank account in formData or user profile
    // In V1, we expect bank details in the "Before You File" section (formData.bankDetails)
    const hasBankInForm = formData?.bankDetails?.accountNumber && formData?.bankDetails?.ifsc;
    // We might also check if user has added a bank account in profile, but for V1 strictness:
    if (!hasBankInForm) {
        missing.push('BANK');
    }

    // 3. Address Check
    // Address must be in User Profile
    const hasAddress = user?.address_line_1 && user?.city && user?.state && user?.pincode;
    if (!hasAddress) {
        missing.push('ADDRESS');
    }

    return {
        ok: missing.length === 0,
        missing
    };
};
