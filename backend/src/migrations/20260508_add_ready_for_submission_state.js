'use strict';
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_itr_filings_lifecycle_state" ADD VALUE IF NOT EXISTS 'ready_for_submission' AFTER 'draft';`
    );
  },
  async down() {
    // ENUMs cannot easily remove values in PostgreSQL
  },
};
