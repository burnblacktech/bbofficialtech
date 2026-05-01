#!/usr/bin/env node
// =====================================================
// MIGRATION: Encrypt existing PAN/Aadhaar data at rest
// =====================================================
// Run once after deploying field encryption.
// Requires FIELD_ENCRYPTION_KEY and FIELD_HMAC_KEY env vars.
//
// Usage: node backend/scripts/encrypt-existing-pii.js
//
// Safe to re-run — skips already-encrypted values (contain ':').

const { sequelize } = require('../src/config/database');
const { encrypt, hmacHash } = require('../src/utils/fieldEncryption');

async function migrate() {
  const qi = sequelize.getQueryInterface();

  // 1. Add hash columns to user_profiles if they don't exist
  const profileCols = await qi.describeTable('user_profiles').catch(() => ({}));
  if (!profileCols.pan_number_hash) {
    await qi.addColumn('user_profiles', 'pan_number_hash', { type: 'VARCHAR(255)', allowNull: true });
    console.log('Added pan_number_hash column');
  }
  if (!profileCols.aadhaar_number_hash) {
    await qi.addColumn('user_profiles', 'aadhaar_number_hash', { type: 'VARCHAR(255)', allowNull: true });
    console.log('Added aadhaar_number_hash column');
  }

  // 2. Encrypt user_profiles PAN/Aadhaar/account
  const [profiles] = await sequelize.query('SELECT id, pan_number, aadhaar_number, account_number FROM user_profiles');
  let count = 0;
  for (const row of profiles) {
    const updates = {};
    if (row.pan_number && !row.pan_number.includes(':')) {
      updates.pan_number = encrypt(row.pan_number);
      updates.pan_number_hash = hmacHash(row.pan_number);
    }
    if (row.aadhaar_number && !row.aadhaar_number.includes(':')) {
      updates.aadhaar_number = encrypt(row.aadhaar_number);
      updates.aadhaar_number_hash = hmacHash(row.aadhaar_number);
    }
    if (row.account_number && !row.account_number.includes(':')) {
      updates.account_number = encrypt(row.account_number);
    }
    if (Object.keys(updates).length) {
      const sets = Object.entries(updates).map(([k], i) => `${k} = $${i + 2}`).join(', ');
      const vals = Object.values(updates);
      await sequelize.query(`UPDATE user_profiles SET ${sets} WHERE id = $1`, { bind: [row.id, ...vals] });
      count++;
    }
  }
  console.log(`Encrypted ${count} user_profiles rows`);

  // 3. Encrypt users.pan_number and verified_pans
  const [users] = await sequelize.query('SELECT id, pan_number, verified_pans FROM users');
  count = 0;
  for (const row of users) {
    const updates = {};
    if (row.pan_number && !row.pan_number.includes(':')) {
      updates.pan_number = encrypt(row.pan_number);
    }
    if (row.verified_pans && Array.isArray(row.verified_pans)) {
      const needsEncrypt = row.verified_pans.some((e) => e.pan && !e.pan.includes(':'));
      if (needsEncrypt) {
        updates.verified_pans = JSON.stringify(
          row.verified_pans.map((e) => e.pan && !e.pan.includes(':') ? { ...e, pan: encrypt(e.pan) } : e),
        );
      }
    }
    if (Object.keys(updates).length) {
      const sets = Object.entries(updates).map(([k], i) => `${k} = $${i + 2}`).join(', ');
      const vals = Object.values(updates);
      await sequelize.query(`UPDATE users SET ${sets} WHERE id = $1`, { bind: [row.id, ...vals] });
      count++;
    }
  }
  console.log(`Encrypted ${count} users rows`);

  // 4. Encrypt itr_filings.taxpayer_pan
  const [filings] = await sequelize.query('SELECT id, taxpayer_pan FROM itr_filings');
  count = 0;
  for (const row of filings) {
    if (row.taxpayer_pan && !row.taxpayer_pan.includes(':')) {
      await sequelize.query('UPDATE itr_filings SET taxpayer_pan = $2 WHERE id = $1', {
        bind: [row.id, encrypt(row.taxpayer_pan)],
      });
      count++;
    }
  }
  console.log(`Encrypted ${count} itr_filings rows`);

  // 5. Move unique indexes from plaintext to hash columns
  try {
    await sequelize.query('DROP INDEX IF EXISTS user_profiles_pan_number');
    await sequelize.query('DROP INDEX IF EXISTS user_profiles_aadhaar_number');
    await sequelize.query('CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_pan_number_hash ON user_profiles (pan_number_hash) WHERE pan_number_hash IS NOT NULL');
    await sequelize.query('CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_aadhaar_number_hash ON user_profiles (aadhaar_number_hash) WHERE aadhaar_number_hash IS NOT NULL');
    console.log('Indexes migrated to hash columns');
  } catch (err) {
    console.warn('Index migration warning:', err.message);
  }

  console.log('Done.');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
