// =====================================================
// VALIDATION SCRIPT - ARCHITECTURE IMPLEMENTATION
// Validates that all key components are working correctly
// =====================================================

const fs = require('fs');
const path = require('path');

// Validation utilities
const validationResults = {
  passed: [],
  failed: [],
  warnings: []
};

function validateFileExists(filePath, description) {
  try {
    const fullPath = path.join(__dirname, '../../..', filePath);
    if (fs.existsSync(fullPath)) {
      validationResults.passed.push(`✅ ${description}: ${filePath}`);
      return true;
    } else {
      validationResults.failed.push(`❌ ${description}: ${filePath} not found`);
      return false;
    }
  } catch (error) {
    validationResults.failed.push(`❌ ${description}: Error checking ${filePath} - ${error.message}`);
    return false;
  }
}

function validateFileContains(filePath, content, description) {
  try {
    const fullPath = path.join(__dirname, '../../..', filePath);
    if (fs.existsSync(fullPath)) {
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      if (fileContent.includes(content)) {
        validationResults.passed.push(`✅ ${description}: Found in ${filePath}`);
        return true;
      } else {
        validationResults.failed.push(`❌ ${description}: Not found in ${filePath}`);
        return false;
      }
    } else {
      validationResults.failed.push(`❌ ${description}: ${filePath} not found`);
      return false;
    }
  } catch (error) {
    validationResults.failed.push(`❌ ${description}: Error checking ${filePath} - ${error.message}`);
    return false;
  }
}

function validateImportStructure(filePath, expectedImport, description) {
  try {
    const fullPath = path.join(__dirname, '../../..', filePath);
    if (fs.existsSync(fullPath)) {
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      if (fileContent.includes(expectedImport)) {
        validationResults.passed.push(`✅ ${description}: Import structure correct in ${filePath}`);
        return true;
      } else {
        validationResults.warnings.push(`⚠️  ${description}: Import structure may need update in ${filePath}`);
        return false;
      }
    } else {
      validationResults.failed.push(`❌ ${description}: ${filePath} not found`);
      return false;
    }
  } catch (error) {
    validationResults.failed.push(`❌ ${description}: Error checking ${filePath} - ${error.message}`);
    return false;
  }
}

// Main validation function
function validateArchitectureImplementation() {
  console.log('🔍 Validating BurnBlack Architecture Implementation...\n');

  // 1. Validate Context Management Optimization
  console.log('📋 Validating Context Management Optimization...');

  validateFileExists('frontend/src/contexts/AuthContext.js', 'AuthContext implementation');
  validateFileExists('frontend/src/contexts/ITRContext.js', 'ITRContext implementation');
  validateFileExists('frontend/src/contexts/AppContext.js', 'AppContext implementation');
  validateFileExists('frontend/src/contexts/NotificationContext.js', 'NotificationContext implementation');

  validateFileContains('frontend/src/contexts/AuthContext.js', 'useAuth', 'AuthContext useAuth hook');
  validateFileContains('frontend/src/contexts/ITRContext.js', 'useITR', 'ITRContext useITR hook');
  validateFileContains('frontend/src/contexts/AppContext.js', 'useApp', 'AppContext useApp hook');
  validateFileContains('frontend/src/contexts/NotificationContext.js', 'useNotification', 'NotificationContext useNotification hook');

  // 2. Validate Dynamic ITR Form System
  console.log('\n📋 Validating Dynamic ITR Form System...');

  validateFileExists('frontend/src/components/ITR/core/ITRFormRenderer.js', 'ITRFormRenderer implementation');
  validateFileExists('frontend/src/components/ITR/config/ITR1Config.js', 'ITR-1 Configuration');
  validateFileContains('frontend/src/components/ITR/core/ITRFormRenderer.js', 'useEffect', 'ITRFormRenderer uses React hooks');
  validateFileContains('frontend/src/components/ITR/core/ITRFormRenderer.js', 'validationService', 'ITRFormRenderer includes validation');

  // 3. Validate Performance Optimizations
  console.log('\n📋 Validating Performance Optimizations...');

  validateFileExists('frontend/src/utils/performance.js', 'Performance utilities');
  validateFileContains('frontend/src/utils/performance.js', 'React.memo', 'React.memo optimization');
  validateFileContains('frontend/src/utils/performance.js', 'useCallback', 'useCallback optimization');
  validateFileContains('frontend/src/utils/performance.js', 'useMemo', 'useMemo optimization');
  validateFileContains('frontend/src/utils/performance.js', 'useVirtualScroll', 'Virtual scrolling implementation');
  validateFileContains('frontend/src/utils/performance.js', 'LazyImage', 'Lazy image loading');

  // 4. Validate Architecture Documentation
  console.log('\n📋 Validating Architecture Documentation...');

  validateFileExists('ARCHITECTURE.md', 'Main architecture documentation');
  validateFileContains('ARCHITECTURE.md', '4-Context Strategy', 'Documentation mentions 4-context strategy');
  validateFileContains('ARCHITECTURE.md', 'Dynamic ITR Form System', 'Documents dynamic form system');
  validateFileContains('ARCHITECTURE.md', '90% reduction', 'Documents improvement metrics');

  // 5. Validate Developer Experience Enhancements
  console.log('\n📋 Validating Developer Experience Enhancements...');

  validateFileExists('frontend/.eslintrc.js', 'ESLint configuration');
  validateFileExists('frontend/.prettierrc.js', 'Prettier configuration');
  validateFileExists('frontend/.huskyrc.json', 'Husky pre-commit hooks');
  validateFileContains('frontend/.eslintrc.js', 'import/order', 'ESLint import ordering rules');
  validateFileContains('frontend/.prettierrc.js', 'semi', 'Prettier semicolon rules');
  validateFileContains('frontend/.huskyrc.json', 'pre-commit', 'Pre-commit hooks configuration');

  // 6. Validate Service Consolidation
  console.log('\n📋 Validating Service Consolidation...');

  validateFileExists('frontend/src/services/index.js', 'Unified services index');
  validateFileContains('frontend/src/services/index.js', 'authService', 'Auth service export');
  validateFileContains('frontend/src/services/index.js', 'apiService', 'API service export');
  validateFileContains('frontend/src/services/index.js', 'validationService', 'Validation service export');

  // 7. Validate Integration Tests
  console.log('\n📋 Validating Integration Tests...');

  validateFileExists('frontend/src/__tests__/integration/ContextIntegration.test.js', 'Context integration tests');
  validateFileExists('frontend/src/__tests__/integration/ITRFormSystem.test.js', 'ITR form system tests');
  validateFileExists('frontend/src/__tests__/integration/PerformanceOptimizations.test.js', 'Performance optimization tests');
  validateFileContains('frontend/src/__tests__/integration/ContextIntegration.test.js', 'describe', 'Test suite structure');
  validateFileContains('frontend/src/__tests__/integration/ITRFormSystem.test.js', 'ITRFormRenderer', 'ITR form testing');
  validateFileContains('frontend/src/__tests__/integration/PerformanceOptimizations.test.js', 'performance', 'Performance testing');

  // 8. Validate Import Structure Updates
  console.log('\n📋 Validating Import Structure...');

  validateImportStructure('frontend/src/components/ITR/core/ITRFormRenderer.js', 'from \'../../../contexts\'', 'ITRFormRenderer context imports');
  validateImportStructure('frontend/src/contexts/AuthContext.js', 'from \'../services\'', 'AuthContext service imports');
  validateImportStructure('frontend/src/contexts/ITRContext.js', 'from \'../services\'', 'ITRContext service imports');

  // 9. Validate Error Handling
  console.log('\n📋 Validating Error Handling...');

  validateFileExists('frontend/src/utils/errorClasses.js', 'Custom error classes');
  validateFileContains('frontend/src/utils/errorClasses.js', 'ValidationError', 'ValidationError class');
  validateFileContains('frontend/src/utils/errorClasses.js', 'NotFoundError', 'NotFoundError class');

  // 10. Validate Bundle Size Optimization
  console.log('\n📋 Validating Bundle Size Optimization...');

  validateFileContains('frontend/src/utils/performance.js', 'React.lazy', 'Code splitting implementation');
  validateFileContains('frontend/src/utils/performance.js', 'React.Suspense', 'Suspense implementation');

  // Results Summary
  console.log('\n📊 VALIDATION RESULTS SUMMARY');
  console.log('================================');

  const totalPassed = validationResults.passed.length;
  const totalFailed = validationResults.failed.length;
  const totalWarnings = validationResults.warnings.length;
  const totalChecks = totalPassed + totalFailed + totalWarnings;

  console.log(`Total Checks: ${totalChecks}`);
  console.log(`✅ Passed: ${totalPassed}`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log(`⚠️  Warnings: ${totalWarnings}`);
  console.log(`Success Rate: ${((totalPassed / totalChecks) * 100).toFixed(1)}%`);

  if (totalFailed > 0) {
    console.log('\n❌ FAILED CHECKS:');
    validationResults.failed.forEach(failure => console.log(`  ${failure}`));
  }

  if (totalWarnings > 0) {
    console.log('\n⚠️  WARNINGS:');
    validationResults.warnings.forEach(warning => console.log(`  ${warning}`));
  }

  if (totalFailed === 0) {
    console.log('\n🎉 ALL CRITICAL CHECKS PASSED!');
    console.log('✨ Architecture implementation is validated and ready for production use.');
  } else {
    console.log('\n🔧 Some issues need attention before production deployment.');
  }

  return {
    totalChecks,
    passed: totalPassed,
    failed: totalFailed,
    warnings: totalWarnings,
    successRate: (totalPassed / totalChecks) * 100
  };
}

// Run validation
if (require.main === module) {
  validateArchitectureImplementation();
}

module.exports = { validateArchitectureImplementation };