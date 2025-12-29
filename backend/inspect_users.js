const { sequelize } = require('./src/config/database');

async function inspect() {
    try {
        console.log('Inspecting users table...');
        const desc = await sequelize.getQueryInterface().describeTable('users');
        console.log(JSON.stringify(desc, null, 2));
    } catch (e) {
        console.error(e);
    }
}

inspect();
