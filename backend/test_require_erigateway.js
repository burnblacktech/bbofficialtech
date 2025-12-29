try {
    const service = require('./src/services/external/ERIGatewayService');
    console.log('✅ ERIGatewayService loaded successfully');
} catch (e) {
    console.error('❌ ERIGatewayService failed to load:', e);
    process.exit(1);
}
