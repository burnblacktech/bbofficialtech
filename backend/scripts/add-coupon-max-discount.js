/**
 * Migration: Add max_discount column to coupons table
 * Run: node backend/scripts/add-coupon-max-discount.js
 */

const { sequelize } = require('../src/config/database');

async function migrate() {
  const qi = sequelize.getQueryInterface();
  const tableDesc = await qi.describeTable('coupons');

  if (tableDesc.max_discount) {
    console.log('Column max_discount already exists — skipping');
  } else {
    await qi.addColumn('coupons', 'max_discount', {
      type: require('sequelize').DataTypes.INTEGER,
      allowNull: true,
      comment: 'Maximum discount in paise for percent-type coupons',
    });
    console.log('Added max_discount column to coupons table');
  }

  await sequelize.close();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
