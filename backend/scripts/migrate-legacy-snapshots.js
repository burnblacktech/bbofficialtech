/**
 * Migration: Move legacy snapshots from itr_filings.snapshots JSONB array
 * into the filing_snapshots table.
 *
 * Run: node backend/scripts/migrate-legacy-snapshots.js
 *
 * - Processes each filing in its own transaction
 * - Idempotent: skips filings that have already been migrated (empty snapshots array)
 * - Skips individual entries that already exist in filing_snapshots (by filingId + version)
 * - Clears the legacy snapshots array after successful migration
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { sequelize } = require('../src/config/database');
const { DataTypes, Op } = require('sequelize');

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Query filings that have non-empty snapshots arrays
    const [filings] = await sequelize.query(
      `SELECT id, snapshots FROM itr_filings WHERE snapshots IS NOT NULL AND snapshots != '[]'::jsonb`
    );

    console.log(`Found ${filings.length} filing(s) with legacy snapshots to migrate`);

    let totalMigrated = 0;
    let totalSkipped = 0;

    for (const filing of filings) {
      const t = await sequelize.transaction();
      try {
        const snapshots = filing.snapshots || [];
        if (!Array.isArray(snapshots) || snapshots.length === 0) {
          await t.rollback();
          continue;
        }

        let migratedCount = 0;
        for (const snap of snapshots) {
          const version = snap.version || 1;

          // Check if already migrated (idempotent)
          const [existing] = await sequelize.query(
            `SELECT id FROM filing_snapshots WHERE filing_id = :filingId AND version = :version LIMIT 1`,
            { replacements: { filingId: filing.id, version }, transaction: t }
          );

          if (existing.length > 0) {
            totalSkipped++;
            continue;
          }

          // Map snapshot type
          let snapshotType = 'auto';
          if (snap.trigger === 'pre-submission') snapshotType = 'pre-submission';
          else if (snap.trigger === 'post-submission') snapshotType = 'post-submission';
          else if (snap.trigger === 'manual') snapshotType = 'manual';
          else if (snap.trigger === 'restored') snapshotType = 'restored';

          await sequelize.query(
            `INSERT INTO filing_snapshots (id, filing_id, created_by, version, snapshot_type, json_payload, comment, created_at, updated_at)
             VALUES (gen_random_uuid(), :filingId, :createdBy, :version, :snapshotType, :jsonPayload, :comment, :createdAt, :createdAt)`,
            {
              replacements: {
                filingId: filing.id,
                createdBy: snap.createdBy || '00000000-0000-0000-0000-000000000000',
                version,
                snapshotType,
                jsonPayload: JSON.stringify(snap.jsonPayload || {}),
                comment: snap.trigger || '',
                createdAt: snap.createdAt || new Date().toISOString(),
              },
              transaction: t,
            }
          );
          migratedCount++;
        }

        // Clear the legacy snapshots array
        await sequelize.query(
          `UPDATE itr_filings SET snapshots = '[]'::jsonb WHERE id = :filingId`,
          { replacements: { filingId: filing.id }, transaction: t }
        );

        await t.commit();
        totalMigrated += migratedCount;
        console.log(`Filing ${filing.id}: migrated ${migratedCount} snapshot(s), skipped ${snapshots.length - migratedCount}`);
      } catch (err) {
        await t.rollback();
        console.error(`Filing ${filing.id}: migration failed — ${err.message}`);
      }
    }

    console.log(`\nMigration complete: ${totalMigrated} migrated, ${totalSkipped} skipped`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();
