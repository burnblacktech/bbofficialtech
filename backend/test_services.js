try {
    console.log('1. Loading ERIIntegrationService...');
    require('./src/services/business/ERIIntegrationService');
    console.log('✅ ERIIntegrationService OK');

    console.log('2. Loading EVerificationService...');
    require('./src/services/business/EVerificationService');
    console.log('✅ EVerificationService OK');

    console.log('3. Loading ITRVProcessingService...');
    require('./src/services/business/ITRVProcessingService');
    console.log('✅ ITRVProcessingService OK');

} catch (e) {
    console.error('❌ Service failed to load:', e);
    process.exit(1);
}
