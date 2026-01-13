// =====================================================
// HELP ARTICLE MODEL
// Manages help center articles and knowledge base content
// =====================================================

const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/database');
const enterpriseLogger = require('../utils/logger');

const HelpArticle = sequelize.define('HelpArticle', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'title',
    comment: 'Article title',
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'content',
    comment: 'Article content (HTML or markdown)',
  },
  snippet: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'snippet',
    comment: 'Short excerpt for preview',
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'category',
    comment: 'Article category (e.g., ITR Filing, Deductions, Refunds)',
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: [],
    field: 'tags',
    comment: 'Array of tags for search and filtering',
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    field: 'views',
    comment: 'Number of times article has been viewed',
  },
  helpfulCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    field: 'helpful_count',
    comment: 'Number of users who found this helpful',
  },
  notHelpfulCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    field: 'not_helpful_count',
    comment: 'Number of users who found this not helpful',
  },
  published: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'published',
    comment: 'Whether article is published and visible',
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'published_at',
    comment: 'Date when article was published',
  },
  authorId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'author_id',
    references: {
      model: 'users',
      key: 'id',
    },
    comment: 'User who created the article',
  },
  readTime: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'read_time',
    comment: 'Estimated reading time in minutes',
  },
  relatedArticleIds: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    allowNull: true,
    defaultValue: [],
    field: 'related_article_ids',
    comment: 'Array of related article IDs',
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
  tableName: 'help_articles',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['category'],
    },
    {
      fields: ['published'],
    },
    {
      fields: ['published_at'],
    },
    {
      fields: ['author_id'],
    },
    {
      fields: ['tags'],
      using: 'gin',
      name: 'idx_help_articles_tags_gin',
    },
    {
      fields: ['title'],
      name: 'idx_help_articles_title_btree',
    },
  ],
});

// Instance methods
HelpArticle.prototype.incrementViews = async function () {
  try {
    await this.increment('views');
    return this;
  } catch (error) {
    enterpriseLogger.error('Increment article views error', {
      articleId: this.id,
      error: error.message,
    });
    throw error;
  }
};

HelpArticle.prototype.recordFeedback = async function (helpful) {
  try {
    if (helpful) {
      await this.increment('helpfulCount');
    } else {
      await this.increment('notHelpfulCount');
    }
    return this;
  } catch (error) {
    enterpriseLogger.error('Record article feedback error', {
      articleId: this.id,
      error: error.message,
    });
    throw error;
  }
};

HelpArticle.prototype.publish = async function () {
  try {
    await this.update({
      published: true,
      publishedAt: new Date(),
    });
    return this;
  } catch (error) {
    enterpriseLogger.error('Publish article error', {
      articleId: this.id,
      error: error.message,
    });
    throw error;
  }
};

// Class methods
HelpArticle.findPublished = async function (options = {}) {
  try {
    const { category, tags, search, limit = 20, offset = 0 } = options;
    const whereClause = {
      published: true,
    };

    if (category) {
      whereClause.category = category;
    }

    if (tags && tags.length > 0) {
      whereClause.tags = {
        [Op.overlap]: tags,
      };
    }

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
      ];
    }

    return await HelpArticle.findAndCountAll({
      where: whereClause,
      order: [['publishedAt', 'DESC']],
      limit,
      offset,
    });
  } catch (error) {
    enterpriseLogger.error('Find published articles error', {
      options,
      error: error.message,
    });
    throw error;
  }
};

HelpArticle.findByCategory = async function (category, options = {}) {
  try {
    const { limit = 20, offset = 0 } = options;
    return await HelpArticle.findAndCountAll({
      where: {
        category,
        published: true,
      },
      order: [['publishedAt', 'DESC']],
      limit,
      offset,
    });
  } catch (error) {
    enterpriseLogger.error('Find articles by category error', {
      category,
      error: error.message,
    });
    throw error;
  }
};

// Hooks
HelpArticle.beforeCreate(async (article) => {
  // Calculate read time if not provided (rough estimate: 200 words per minute)
  if (!article.readTime && article.content) {
    const wordCount = article.content.split(/\s+/).length;
    article.readTime = Math.max(1, Math.ceil(wordCount / 200));
  }

  // Generate snippet from content if not provided
  if (!article.snippet && article.content) {
    article.snippet = article.content.substring(0, 200).replace(/<[^>]*>/g, '');
  }
});

HelpArticle.beforeUpdate(async (article) => {
  // Recalculate read time if content changed
  if (article.changed('content') && !article.readTime) {
    const wordCount = article.content.split(/\s+/).length;
    article.readTime = Math.max(1, Math.ceil(wordCount / 200));
  }
});

module.exports = HelpArticle;

