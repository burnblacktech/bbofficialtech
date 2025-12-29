try {
    console.log('Loading app...');
    const app = require('./src/app');
    console.log('✅ App loaded successfully');
} catch (e) {
    console.error('❌ App failed to load:', e);
    process.exit(1);
}
