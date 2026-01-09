// =====================================================
// MEMBER PRESENTER - RESPONSE FORMATTING
// Pure presentation logic extracted from MemberController
// =====================================================

/**
 * Validate PAN format
 */
function isValidPAN(pan) {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan.toUpperCase());
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get relationship label
 */
function getRelationshipLabel(relationship) {
    const labels = {
        'spouse': 'Spouse',
        'child': 'Child',
        'parent': 'Parent',
        'sibling': 'Sibling',
        'other': 'Other',
    };
    return labels[relationship] || 'Unknown';
}

/**
 * Get gender label
 */
function getGenderLabel(gender) {
    const labels = {
        'male': 'Male',
        'female': 'Female',
        'other': 'Other',
    };
    return labels[gender] || 'Unknown';
}

/**
 * Get status label
 */
function getStatusLabel(status) {
    const labels = {
        'active': 'Active',
        'inactive': 'Inactive',
    };
    return labels[status] || 'Unknown';
}

/**
 * Get status color
 */
function getStatusColor(status) {
    const colors = {
        'active': 'green',
        'inactive': 'gray',
    };
    return colors[status] || 'gray';
}

/**
 * Get filing status label
 */
function getFilingStatusLabel(status) {
    const labels = {
        'draft': 'Draft',
        'submitted': 'Submitted',
        'acknowledged': 'Acknowledged',
        'processed': 'Processed',
        'rejected': 'Rejected',
    };
    return labels[status] || 'Unknown';
}

/**
 * Get filing status color
 */
function getFilingStatusColor(status) {
    const colors = {
        'draft': 'yellow',
        'submitted': 'blue',
        'acknowledged': 'green',
        'processed': 'green',
        'rejected': 'red',
    };
    return colors[status] || 'gray';
}

/**
 * Get document category label
 */
function getDocumentCategoryLabel(category) {
    const labels = {
        'FORM_16': 'Form 16',
        'BANK_STATEMENT': 'Bank Statement',
        'INVESTMENT_PROOF': 'Investment Proof',
        'RENT_RECEIPT': 'Rent Receipt',
        'OTHER': 'Other',
        'AADHAAR': 'Aadhaar',
        'PAN': 'PAN',
        'SALARY_SLIP': 'Salary Slip',
    };
    return labels[category] || 'Unknown';
}

/**
 * Get document status label
 */
function getDocumentStatusLabel(status) {
    const labels = {
        'UPLOADED': 'Uploaded',
        'SCANNING': 'Scanning',
        'VERIFIED': 'Verified',
        'FAILED': 'Failed',
        'DELETED': 'Deleted',
    };
    return labels[status] || 'Unknown';
}

/**
 * Get document status color
 */
function getDocumentStatusColor(status) {
    const colors = {
        'UPLOADED': 'blue',
        'SCANNING': 'yellow',
        'VERIFIED': 'green',
        'FAILED': 'red',
        'DELETED': 'gray',
    };
    return colors[status] || 'gray';
}

/**
 * Present a single member with all display enhancements
 */
function presentMember(member) {
    return {
        id: member.id,
        userId: member.userId,
        fullName: member.fullName,
        pan: member.pan,
        relationship: member.relationship,
        relationshipLabel: getRelationshipLabel(member.relationship),
        dateOfBirth: member.dateOfBirth,
        gender: member.gender,
        genderLabel: getGenderLabel(member.gender),
        status: member.status,
        statusLabel: getStatusLabel(member.status),
        statusColor: getStatusColor(member.status),
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
        metadata: member.metadata,
    };
}

/**
 * Present a list of members
 */
function presentMemberList(members) {
    return members.map(presentMember);
}

/**
 * Present member with statistics
 */
function presentMemberWithStats(member, filingStats, documentStats) {
    return {
        ...presentMember(member),
        statistics: {
            filings: filingStats,
            documents: documentStats,
        },
    };
}

/**
 * Present filing for member context
 */
function presentFiling(filing) {
    return {
        id: filing.id,
        itrType: filing.itrType,
        assessmentYear: filing.assessmentYear,
        status: filing.status,
        statusLabel: getFilingStatusLabel(filing.status),
        statusColor: getFilingStatusColor(filing.status),
        taxLiability: filing.taxLiability,
        submittedAt: filing.submittedAt,
        acknowledgedAt: filing.acknowledgedAt,
        createdAt: filing.createdAt,
        updatedAt: filing.updatedAt,
    };
}

/**
 * Present document for member context
 */
function presentDocument(doc) {
    return {
        id: doc.id,
        category: doc.category,
        categoryLabel: getDocumentCategoryLabel(doc.category),
        filename: doc.filename,
        originalFilename: doc.originalFilename,
        mimeType: doc.mimeType,
        sizeBytes: doc.sizeBytes,
        sizeFormatted: formatFileSize(doc.sizeBytes),
        status: doc.status,
        statusLabel: getDocumentStatusLabel(doc.status),
        statusColor: getDocumentStatusColor(doc.status),
        verified: doc.verified,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    };
}

module.exports = {
    isValidPAN,
    formatFileSize,
    getRelationshipLabel,
    getGenderLabel,
    getStatusLabel,
    getStatusColor,
    getFilingStatusLabel,
    getFilingStatusColor,
    getDocumentCategoryLabel,
    getDocumentStatusLabel,
    getDocumentStatusColor,
    presentMember,
    presentMemberList,
    presentMemberWithStats,
    presentFiling,
    presentDocument,
};
