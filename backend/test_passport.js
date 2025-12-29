try {
    console.log('Loading passport...');
    require('./src/config/passport');
    console.log('✅ Passport loaded successfully');
} catch (e) {
    console.log('❌ Passport failed to load:', e);
    // Using console.log instead of error to avoid stderr separation/truncation issues in some envs
    process.exit(1);
}
