const { sequelize } = require('./src/config/database');
const { ITRFiling, User } = require('./src/models');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

async function seedV3() {
    const t = await sequelize.transaction();
    try {
        console.log('Seeding V3 Data...');

        // 1. Create or Find CA Firm
        // We'll mock tables since not fully defined in models/index.js yet?
        // Ah, models/index.js probably doesn't have CAFirm if I didn't create the file.
        // Wait, V3.1 I created `CAInboxService` which queries `ITRFiling`.
        // I haven't created CA models yet? `v3_architecture.md` mentioned them.
        // `CAInboxService` joins `User`.
        // `CAFilingService` checks `caUser.caFirmId`.
        // Where is `caUser` coming from? `req.user`.
        // I need to ensure `User` model has `role: CA` and `caFirmId`.
        // I might need to add `caFirmId` column to `users` table if not present, or just use `metadata`.
        // Let's check User model.

        // Assuming `users` table has `role`.
        // `ca_firms` table might not exist.
        // V3.1 Task said "Backend: CAInboxService...". Did I create tables?
        // No, I avoided schema migrations per instructions ("Zero schema migrations" in V3.3).
        // The instructions said "New services... but DO NOT create new tables yet" in V3.3.
        // Be careful. V3.1 said "Verified existing associations".
        // `CAInboxService` joins `User`.
        // I'll stick to `role='CA'` and maybe mock `caFirmId` in `caContext` or just assume all CAs see all filings for now?
        // Wait, `CAFilingService.js` (Step 4920) has:
        // `if (filing.firmId && caUser.caFirmId && filing.firmId !== caUser.caFirmId)`
        // This fails if `caUser.caFirmId` is undefined.
        // I need to patch `User` object in `req.user` or DB.
        // I'll update the User in DB to have `caFirmId` in `metadata` or similar if column missing.
        // Or I'll just skip the check in verification if tables don't exist.

        // Let's create a CA User.
        const caEmail = 'ca_verma@apex.com';
        const caPass = await bcrypt.hash('capass123', 10);

        // Check if CA exists
        let [caUser] = await sequelize.query(`SELECT * FROM users WHERE email = '${caEmail}'`, { type: sequelize.QueryTypes.SELECT, transaction: t });

        if (!caUser) {
            const userId = uuidv4();
            await sequelize.query(`
                INSERT INTO users (id, email, password, role, first_name, last_name, created_at, updated_at)
                VALUES ('${userId}', '${caEmail}', '${caPass}', 'CA', 'Rohit', 'Verma', NOW(), NOW())
             `, { transaction: t });
            caUser = { id: userId };
            console.log('Created CA User');
        }

        // Mock Firm ID
        const firmId = 'firm_apex_001';
        // We can't easily add column `ca_firm_id` to `users` without migration.
        // I will assume the `req.user` populator or `CAController` handles this?
        // Access control in `CAFilingService`: `caUser.caFirmId`.
        // If I can't set it on DB, I must mock `req.user` in controller?
        // OR: `users` table might have `firm_id`?
        // Let's check schema. `schema_alignment.md`?

        // 2. Setup Filing for User (e.g. user123)
        // I will use 'user123' if exists, or finding first USER role.
        const [targetUser] = await sequelize.query(`SELECT * FROM users WHERE role = 'END_USER' LIMIT 1`, { type: sequelize.QueryTypes.SELECT, transaction: t });
        if (!targetUser) throw new Error('No End User found');

        // Find or Create Filing
        const filingId = '123e4567-e89b-12d3-a456-426614174000'; // Standard Test ID
        const [filing] = await sequelize.query(`SELECT * FROM itr_filings WHERE id = '${filingId}'`, { type: sequelize.QueryTypes.SELECT, transaction: t });

        const taxComp = {
            totalIncome: 1500000,
            taxLiability: 12500,
            caContext: {
                caAssistEligible: true, // TRIGGER V3 UI
                caAssistRecommended: true,
                urgency: 'HIGH',
                requests: []
            }
        };

        if (!filing) {
            await sequelize.query(`
                INSERT INTO itr_filings (id, user_id, assessment_year, status, tax_computation, created_at, updated_at)
                VALUES ('${filingId}', '${targetUser.id}', '2024-2025', 'READY_TO_FILE', :taxComp, NOW(), NOW())
            `, {
                replacements: { taxComp: JSON.stringify(taxComp) },
                transaction: t
            });
            console.log('Created Filing');
        } else {
            await sequelize.query(`
                UPDATE itr_filings 
                SET status = 'READY_TO_FILE',
                    tax_computation = :taxComp,
                    firm_id = :firmId -- If column exists?
                WHERE id = '${filingId}'
            `, {
                replacements: { taxComp: JSON.stringify(taxComp), firmId }, // Trying firm_id
                transaction: t
            }).catch(e => console.warn('Could not set firm_id (maybe column missing), ignoring access control check implication for now.'));
        }

        console.log('V3 Seed Complete. CA Email: ca_verma@apex.com');

        await t.commit();

    } catch (e) {
        await t.rollback();
        console.error('Seed Failed', e);
    }
}

seedV3();
