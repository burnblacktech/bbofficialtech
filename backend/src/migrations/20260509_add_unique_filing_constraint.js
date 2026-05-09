'use strict';
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_itr_filings_unique_per_user
      ON itr_filings (created_by, assessment_year, taxpayer_pan, filing_type)
      WHERE deleted_at IS NULL;
    `);
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS idx_itr_filings_unique_per_user;'
    );
  },
};
