const db = require('../src/config/database');
require('../src/models');

(async () => {
  await db.sequelize.authenticate();
  const [tables] = await db.sequelize.query(
    "SELECT tablename AS table_name FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
  );
  console.log(`\nTABLES (${tables.length}):\n`);
  for (const t of tables) {
    const [cols] = await db.sequelize.query(
      `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = '${t.table_name}' ORDER BY ordinal_position`
    );
    console.log(`${t.table_name} (${cols.length} cols):`);
    cols.forEach(c => console.log(`  ${c.column_name} — ${c.data_type}${c.is_nullable === 'YES' ? ' (nullable)' : ''}`));
    console.log('');
  }
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
