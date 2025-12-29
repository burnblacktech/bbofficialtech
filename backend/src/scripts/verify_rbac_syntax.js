try {
    console.log('Loading middleware...');
    require('../middleware/accessControl');
    console.log('✅ AccessControl middleware loaded.');

    console.log('Loading MemberController...');
    require('../controllers/MemberController');
    console.log('✅ MemberController loaded.');

    console.log('Loading ITRController...');
    require('../controllers/ITRController');
    console.log('✅ ITRController loaded.');

    console.log('Loading routes...');
    require('../routes/members');
    require('../routes/itr');
    console.log('✅ Routes loaded.');

    console.log('RBAC Syntax Verified Successfully');
    process.exit(0);
} catch (error) {
    console.error('❌ Syntax Verification Failed:', error);
    process.exit(1);
}
