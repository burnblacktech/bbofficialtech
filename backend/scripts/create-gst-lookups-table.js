/**
 * Migration: Create gst_lookups table (idempotent)
 * Run: node backend/scripts/create-gst-lookups-table.js
 */

const { sequelize } = require('../src/config/database');
const { DataTypes } = require('sequelize');

async function migrate() {
  const qi = sequelize.getQueryInterface();

  const tables = await qi.showAllTables();
  if (tables.includes('gst_lookups')) {
    console.log('Table gst_lookups already exists — skipping');
    await sequelize.close();
    return;
  }

  await qi.createTable('gst_lookups', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    gstin: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true,
    },
    business_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    legal_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    registration_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    last_updated_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    state_code: {
      type: DataTypes.STRING(2),
      allowNull: true,
    },
    constitution_of_business: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    taxpayer_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gstin_status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cancellation_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    raw_response: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    fetched_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

  await qi.addIndex('gst_lookups', ['gstin'], { unique: true });
  await qi.addIndex('gst_lookups', ['fetched_at']);

  console.log('Created gst_lookups table with indexes');
  await sequelize.close();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
