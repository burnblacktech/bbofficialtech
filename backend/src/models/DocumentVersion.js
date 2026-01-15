// =====================================================
// DOCUMENT VERSION MODEL
// Version control for documents
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DocumentVersion = sequelize.define('DocumentVersion', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    documentId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'document_id',
        references: {
            model: 'documents',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    versionNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'version_number',
    },

    // File Details
    filename: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    localPath: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'local_path',
    },
    s3Key: {
        type: DataTypes.STRING,
        field: 's3_key',
    },
    mimeType: {
        type: DataTypes.STRING,
        field: 'mime_type',
    },
    sizeBytes: {
        type: DataTypes.BIGINT,
        field: 'size_bytes',
    },

    // Checksum for integrity
    checksum: {
        type: DataTypes.STRING, // SHA-256
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

    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
    },
}, {
    tableName: 'document_versions',
    timestamps: true,
    updatedAt: false, // Immutable versions
    underscored: true,
    indexes: [
        {
            fields: ['document_id'],
        },
        {
            fields: ['document_id', 'version_number'],
            unique: true,
        },
    ],
});

module.exports = DocumentVersion;
