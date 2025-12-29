// =====================================================
// DOCUMENT MODEL
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const enterpriseLogger = require('../utils/logger');

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  memberId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'member_id',
    references: {
      model: 'family_members',
      key: 'id',
    },
  },
  filingId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'filing_id',
    references: {
      model: 'itr_filings',
      key: 'id',
    },
  },
  category: {
    type: DataTypes.ENUM(
      'FORM_16',
      'BANK_STATEMENT',
      'INVESTMENT_PROOF',
      'RENT_RECEIPTS',
      'CAPITAL_GAINS',
      'BUSINESS_INCOME',
      'HOUSE_PROPERTY',
      'OTHER',
    ),
    allowNull: false,
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  originalFilename: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'original_filename',
  },
  s3Key: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 's3_key',
  },
  localPath: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'local_path',
  },
  mimeType: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'mime_type',
  },
  sizeBytes: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'size_bytes',
    validate: {
      min: 1,
    },
  },
  uploadedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'uploaded_by',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  verificationStatus: {
    type: DataTypes.ENUM(
      'PENDING',
      'SCANNING',
      'VERIFIED',
      'FAILED',
      'QUARANTINED',
    ),
    defaultValue: 'PENDING',
    field: 'verification_status',
  },
  extractedMetadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'extracted_metadata',
  },
  virusScanResult: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'virus_scan_result',
  },
  ocrResult: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'ocr_result',
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_deleted',
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'deleted_at',
  },
  deletedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'deleted_by',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'created_at',
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'updated_at',
  },
}, {
  tableName: 'documents',
  timestamps: true,
  underscored: true,
});

// Instance methods
Document.prototype.getFileSize = function () {
  const bytes = this.sizeBytes;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) { return '0 Bytes'; }
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

Document.prototype.getFileIcon = function () {
  const mimeType = this.mimeType.toLowerCase();

  if (mimeType.includes('image')) {
    return '🖼️';
  } else if (mimeType.includes('pdf')) {
    return '📄';
  } else if (mimeType.includes('word') || mimeType.includes('document')) {
    return '📝';
  } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
    return '📊';
  } else {
    return '📎';
  }
};

Document.prototype.getStatusColor = function () {
  const statusColors = {
    'PENDING': 'yellow',
    'SCANNING': 'blue',
    'VERIFIED': 'green',
    'FAILED': 'red',
    'QUARANTINED': 'red',
  };
  return statusColors[this.verificationStatus] || 'gray';
};

Document.prototype.getDownloadUrl = function () {
  // This would be implemented in the service layer
  // Returns signed URL for S3 or local file URL
  return null;
};

Document.prototype.softDelete = async function (deletedBy) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  await this.save();

  enterpriseLogger.info('Document soft deleted', {
    documentId: this.id,
    filename: this.filename,
    deletedBy,
  });
};

Document.prototype.markVerified = async function () {
  this.verified = true;
  this.verificationStatus = 'VERIFIED';
  await this.save();

  enterpriseLogger.info('Document marked as verified', {
    documentId: this.id,
    filename: this.filename,
  });
};

Document.prototype.markScanning = async function () {
  this.verificationStatus = 'SCANNING';
  await this.save();

  enterpriseLogger.info('Document marked as scanning', {
    documentId: this.id,
    filename: this.filename,
  });
};

Document.prototype.markFailed = async function (reason) {
  this.verificationStatus = 'FAILED';
  this.virusScanResult = {
    ...this.virusScanResult,
    error: reason,
    failedAt: new Date().toISOString(),
  };
  await this.save();

  enterpriseLogger.info('Document marked as failed', {
    documentId: this.id,
    filename: this.filename,
    reason,
  });
};

// Class methods
Document.getCategoryLabel = function (category) {
  const labels = {
    'FORM_16': 'Form 16',
    'BANK_STATEMENT': 'Bank Statement',
    'INVESTMENT_PROOF': 'Investment Proof',
    'RENT_RECEIPTS': 'Rent Receipts',
    'CAPITAL_GAINS': 'Capital Gains',
    'BUSINESS_INCOME': 'Business Income',
    'HOUSE_PROPERTY': 'House Property',
    'OTHER': 'Other',
  };
  return labels[category] || 'Unknown';
};

Document.getAllowedMimeTypes = function () {
  return [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
};

Document.getMaxFileSize = function () {
  return 10 * 1024 * 1024; // 10MB
};

Document.validateFile = function (file) {
  const errors = [];

  // Check file size
  if (file.size > Document.getMaxFileSize()) {
    errors.push('File size exceeds 10MB limit');
  }

  // Check MIME type
  if (!Document.getAllowedMimeTypes().includes(file.mimetype)) {
    errors.push(`File type ${file.mimetype} is not allowed`);
  }

  // Check filename
  if (!file.originalname || file.originalname.length === 0) {
    errors.push('Filename is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

Document.getUserStorageStats = async function (userId) {
  const stats = await Document.findAll({
    where: {
      userId,
      isDeleted: false,
    },
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalFiles'],
      [sequelize.fn('SUM', sequelize.col('size_bytes')), 'totalSize'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN verification_status = \'VERIFIED\' THEN 1 END')), 'verifiedFiles'],
    ],
    raw: true,
  });

  return {
    totalFiles: parseInt(stats[0].totalFiles) || 0,
    totalSize: parseInt(stats[0].totalSize) || 0,
    verifiedFiles: parseInt(stats[0].verifiedFiles) || 0,
  };
};

Document.getCategoryStats = async function (userId) {
  const stats = await Document.findAll({
    where: {
      userId,
      isDeleted: false,
    },
    attributes: [
      'category',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('SUM', sequelize.col('size_bytes')), 'totalSize'],
    ],
    group: ['category'],
    raw: true,
  });

  return stats.map(stat => ({
    category: stat.category,
    count: parseInt(stat.count),
    totalSize: parseInt(stat.totalSize),
  }));
};

// Hooks
Document.beforeCreate(async (document) => {
  // Validate file data
  const validation = Document.validateFile({
    size: document.sizeBytes,
    mimetype: document.mimeType,
    originalname: document.originalFilename,
  });

  if (!validation.isValid) {
    throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
  }
});

Document.afterCreate(async (document) => {
  enterpriseLogger.info('Document created', {
    documentId: document.id,
    filename: document.filename,
    userId: document.userId,
    category: document.category,
    size: document.sizeBytes,
  });
});

Document.afterUpdate(async (document) => {
  if (document.changed('verificationStatus')) {
    enterpriseLogger.info('Document verification status changed', {
      documentId: document.id,
      filename: document.filename,
      oldStatus: document._previousDataValues.verificationStatus,
      newStatus: document.verificationStatus,
    });
  }
});

enterpriseLogger.info('Document model defined');

module.exports = Document;
