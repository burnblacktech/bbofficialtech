console.log('Testing imports...');
try {
    console.log('1. Loading logger...');
    require('./src/utils/logger');
    console.log('✅ Logger OK');

    console.log('2. Loading passport...');
    require('./src/config/passport');
    console.log('✅ Passport OK');

    console.log('3. Loading redisService...');
    require('./src/services/core/RedisService');
    console.log('✅ RedisService OK');

    console.log('4. Loading routes...');
    require('./src/routes');
    console.log('✅ Routes OK');

    console.log('5. Loading app...');
    require('./src/app');
    console.log('✅ App loaded! All good.');

} catch (e) {
    console.error('❌ Failed at step:', e);
    process.exit(1);
}
