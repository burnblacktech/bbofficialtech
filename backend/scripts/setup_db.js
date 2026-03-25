const { Sequelize } = require('sequelize');

async function setup() {
  const seq = new Sequelize('postgres', 'postgres', 'postgres', {
    host: 'localhost', port: 5432, dialect: 'postgres', logging: false,
  });

  await seq.authenticate();
  console.log('Connected to PostgreSQL');

  const [rows] = await seq.query("SELECT datname FROM pg_database WHERE datname = 'burnblack_itr'");
  if (rows.length === 0) {
    await seq.query('CREATE DATABASE burnblack_itr');
    console.log('Created database: burnblack_itr');
  } else {
    console.log('Database burnblack_itr already exists');
  }

  await seq.close();

  // Now connect to burnblack_itr and sync models
  const { sequelize } = require('../src/config/database');
  await sequelize.authenticate();
  console.log('Connected to burnblack_itr');

  await sequelize.sync({ alter: true });
  console.log('Schema synced');

  await sequelize.close();
  console.log('Done');
}

setup().catch(e => { console.error('Setup failed:', e.message); process.exit(1); });
