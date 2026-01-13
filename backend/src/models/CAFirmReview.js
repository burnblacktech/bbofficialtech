// =====================================================
// CA FIRM REVIEW MODEL
// Manages reviews and ratings for CA firms
// =====================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const enterpriseLogger = require('../utils/logger');

const CAFirmReview = sequelize.define('CAFirmReview', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  firmId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'firm_id',
    references: {
      model: 'ca_firms',
      key: 'id',
    },
    comment: 'CA firm being reviewed',
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id',
    },
    comment: 'User who wrote the review (nullable for anonymous reviews)',
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'rating',
    validate: {
      min: 1,
      max: 5,
    },
    comment: 'Rating from 1 to 5',
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'comment',
    comment: 'Review comment text',
  },
  clientName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'client_name',
    comment: 'Name of the reviewer (can be different from user name)',
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'date',
    comment: 'Date of the review',
  },
  helpfulCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    field: 'helpful_count',
    comment: 'Number of users who found this review helpful',
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'verified',
    comment: 'Whether this is a verified review (from actual client)',
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    field: 'metadata',
    comment: 'Additional review data',
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
  tableName: 'ca_firm_reviews',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['firm_id'],
    },
    {
      fields: ['user_id'],
    },
    {
      fields: ['rating'],
    },
    {
      fields: ['date'],
    },
    {
      fields: ['verified'],
    },
    {
      fields: ['firm_id', 'rating'],
      name: 'idx_reviews_firm_rating',
    },
    {
      unique: true,
      fields: ['firm_id', 'user_id'],
      name: 'unique_user_review_per_firm',
    },
  ],
});

// Instance methods
CAFirmReview.prototype.incrementHelpful = async function () {
  try {
    await this.increment('helpfulCount');
    return this;
  } catch (error) {
    enterpriseLogger.error('Increment review helpful count error', {
      reviewId: this.id,
      error: error.message,
    });
    throw error;
  }
};

// Class methods
CAFirmReview.findByFirm = async function (firmId, options = {}) {
  try {
    const { rating, limit = 20, offset = 0 } = options;
    const whereClause = { firmId };

    if (rating) {
      whereClause.rating = rating;
    }

    return await CAFirmReview.findAndCountAll({
      where: whereClause,
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      limit,
      offset,
    });
  } catch (error) {
    enterpriseLogger.error('Find reviews by firm error', {
      firmId,
      error: error.message,
    });
    throw error;
  }
};

CAFirmReview.calculateAverageRating = async function (firmId) {
  try {
    const result = await CAFirmReview.findAll({
      where: { firmId },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'reviewCount'],
      ],
      raw: true,
    });

    if (result && result.length > 0) {
      const avgRating = parseFloat(result[0].averageRating) || 0;
      const reviewCount = parseInt(result[0].reviewCount) || 0;

      // Update CAFirm with calculated values
      const CAFirm = require('./CAFirm');
      await CAFirm.update(
        {
          averageRating: Math.round(avgRating * 100) / 100, // Round to 2 decimal places
          reviewCount,
        },
        { where: { id: firmId } }
      );

      return {
        averageRating: Math.round(avgRating * 100) / 100,
        reviewCount,
      };
    }

    return { averageRating: 0, reviewCount: 0 };
  } catch (error) {
    enterpriseLogger.error('Calculate average rating error', {
      firmId,
      error: error.message,
    });
    throw error;
  }
};

// Hooks
CAFirmReview.afterCreate(async (review) => {
  try {
    // Recalculate firm's average rating
    await CAFirmReview.calculateAverageRating(review.firmId);
  } catch (error) {
    enterpriseLogger.error('After create review hook error', {
      reviewId: review.id,
      error: error.message,
    });
  }
});

CAFirmReview.afterUpdate(async (review) => {
  try {
    // Recalculate if rating changed
    if (review.changed('rating')) {
      await CAFirmReview.calculateAverageRating(review.firmId);
    }
  } catch (error) {
    enterpriseLogger.error('After update review hook error', {
      reviewId: review.id,
      error: error.message,
    });
  }
});

CAFirmReview.afterDestroy(async (review) => {
  try {
    // Recalculate firm's average rating after deletion
    await CAFirmReview.calculateAverageRating(review.firmId);
  } catch (error) {
    enterpriseLogger.error('After destroy review hook error', {
      reviewId: review.id,
      error: error.message,
    });
  }
});

module.exports = CAFirmReview;

