const { sequelize } = require('./src/config/database');

async function inspect() {
    try {
        console.log('Inspecting itr_filings table...');
        const desc = await sequelize.getQueryInterface().describeTable('itr_filings');
        console.log(JSON.stringify(desc, null, 2));
    } catch (e) {
        console.error(e);
    }
}

inspect();
