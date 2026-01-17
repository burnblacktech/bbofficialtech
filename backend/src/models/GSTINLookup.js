// =====================================================
// GSTIN LOOKUP MODEL - Cache and Audit Trail
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GSTINLookup = sequelize.define('GSTINLookup', {
    // =====================================================
    // IDENTITY
    // =====================================================
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },

    // =====================================================
    // GSTIN INFORMATION
    // =====================================================
    gstin: {
        type: DataTypes.STRING(15),
        allowNull: false,
        unique: true,
        validate: {
            len: [15, 15],
            is: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/i,
        },
        comment: 'GSTIN number (15 characters)',
    },

    // =====================================================
    // API RESPONSE DATA
    // =====================================================
    apiResponse: {
        type: DataTypes.JSONB,
        allowNull: true,
        field: 'api_response',
        comment: 'Full API response from SurePass',
    },

    success: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether the API call was successful',
    },

    errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'error_message',
        comment: 'Error message if lookup failed',
    },

    // =====================================================
    // METADATA
    // =====================================================
    source: {
        type: DataTypes.ENUM('SUREPASS_API', 'CACHE'),
        allowNull: false,
        defaultValue: 'SUREPASS_API',
        comment: 'Source of the data',
    },

    lookupCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        field: 'lookup_count',
        comment: 'Number of times this GSTIN has been looked up',
    },

    lastLookedUpBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'last_looked_up_by',
        references: {
            model: 'users',
            key: 'id',
        },
        comment: 'User ID who last looked up this GSTIN',
    },

    lastLookedUpAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_looked_up_at',
        comment: 'Timestamp of last lookup',
    },

    // =====================================================
    // CACHE MANAGEMENT
    // =====================================================
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'expires_at',
        comment: 'When this cache entry expires (null = never)',
    },

    // =====================================================
    // AUDIT
    // =====================================================
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
    tableName: 'gstin_lookups',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['gstin'],
        },
        {
            fields: ['last_looked_up_by'],
        },
        {
            fields: ['created_at'],
        },
        {
            fields: ['success'],
        },
    ],
});

// Instance methods
GSTINLookup.prototype.isExpired = function () {
    if (!this.expiresAt) {
        return false; // Never expires
    }
    return new Date() > this.expiresAt;
};

GSTINLookup.prototype.incrementLookupCount = async function (userId) {
    this.lookupCount += 1;
    this.lastLookedUpBy = userId;
    this.lastLookedUpAt = new Date();
    await this.save();
};

// Class methods
GSTINLookup.findByGSTIN = async function (gstin) {
    return await GSTINLookup.findOne({
        where: { gstin: gstin.toUpperCase() },
    });
};

GSTINLookup.createOrUpdate = async function (gstin, apiResponse, success, userId, errorMessage = null) {
    const existingLookup = await GSTINLookup.findByGSTIN(gstin);

    if (existingLookup) {
        // Update existing record
        existingLookup.apiResponse = apiResponse;
        existingLookup.success = success;
        existingLookup.errorMessage = errorMessage;
        existingLookup.source = 'SUREPASS_API';
        existingLookup.lookupCount += 1;
        existingLookup.lastLookedUpBy = userId;
        existingLookup.lastLookedUpAt = new Date();
        // Set expiry to 30 days from now
        existingLookup.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await existingLookup.save();
        return existingLookup;
    } else {
        // Create new record
        return await GSTINLookup.create({
            gstin: gstin.toUpperCase(),
            apiResponse,
            success,
            errorMessage,
            source: 'SUREPASS_API',
            lookupCount: 1,
            lastLookedUpBy: userId,
            lastLookedUpAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        });
    }
};

module.exports = GSTINLookup;
