// =====================================================
// MIGRATION: Create HelpArticles Table
// =====================================================
// Run this script to create the help_articles table
// Usage: node src/scripts/migrations/create-help-articles-table.js

const { sequelize } = require('../../config/database');
const enterpriseLogger = require('../../utils/logger');

async function createHelpArticlesTable() {
  try {
    enterpriseLogger.info('Creating help_articles table...');
    console.log('\n=== Creating Help Articles Table ===\n');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS help_articles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        snippet TEXT,
        category VARCHAR(100) NOT NULL,
        tags TEXT[] DEFAULT '{}',
        views INTEGER NOT NULL DEFAULT 0,
        helpful_count INTEGER NOT NULL DEFAULT 0,
        not_helpful_count INTEGER NOT NULL DEFAULT 0,
        published BOOLEAN NOT NULL DEFAULT false,
        published_at TIMESTAMP,
        author_id UUID REFERENCES users(id) ON DELETE SET NULL,
        read_time INTEGER,
        related_article_ids UUID[] DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_help_articles_category ON help_articles(category);
      CREATE INDEX IF NOT EXISTS idx_help_articles_published ON help_articles(published);
      CREATE INDEX IF NOT EXISTS idx_help_articles_published_at ON help_articles(published_at);
      CREATE INDEX IF NOT EXISTS idx_help_articles_author_id ON help_articles(author_id);
      CREATE INDEX IF NOT EXISTS idx_help_articles_tags_gin ON help_articles USING gin(tags);
      CREATE INDEX IF NOT EXISTS idx_help_articles_title_gin ON help_articles USING gin(to_tsvector('english', title));

      COMMENT ON TABLE help_articles IS 'Stores help center articles and knowledge base content';
      COMMENT ON COLUMN help_articles.title IS 'Article title';
      COMMENT ON COLUMN help_articles.content IS 'Article content (HTML or markdown)';
      COMMENT ON COLUMN help_articles.snippet IS 'Short excerpt for preview';
      COMMENT ON COLUMN help_articles.category IS 'Article category (e.g., ITR Filing, Deductions, Refunds)';
      COMMENT ON COLUMN help_articles.tags IS 'Array of tags for search and filtering';
      COMMENT ON COLUMN help_articles.views IS 'Number of times article has been viewed';
      COMMENT ON COLUMN help_articles.helpful_count IS 'Number of users who found this helpful';
      COMMENT ON COLUMN help_articles.not_helpful_count IS 'Number of users who found this not helpful';
      COMMENT ON COLUMN help_articles.published IS 'Whether article is published and visible';
      COMMENT ON COLUMN help_articles.published_at IS 'Date when article was published';
      COMMENT ON COLUMN help_articles.author_id IS 'User who created the article';
      COMMENT ON COLUMN help_articles.read_time IS 'Estimated reading time in minutes';
      COMMENT ON COLUMN help_articles.related_article_ids IS 'Array of related article IDs';
    `);

    enterpriseLogger.info('✅ HelpArticles table created successfully');
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    enterpriseLogger.error('Migration failed', {
      error: error.message,
      stack: error.stack,
    });
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration
createHelpArticlesTable();

