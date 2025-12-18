# Repository File Inventory - Part 4: Scripts Directory

**Generated:** December 2024  
**Purpose:** Complete inventory of scripts directory files

---

## Automation Scripts

### `scripts/fix-typography.js`
**Description**: Typography standardization script that automatically replaces direct Tailwind size classes (text-xs, text-sm, etc.) with design system tokens (text-body-small, text-heading-1, etc.). Includes context-aware replacements for heading tags.  
**Functions**: Processes files, replaces typography classes, handles context-aware replacements  
**Status**: ✅ Keep (One-time use, but useful for future standardization)

### `scripts/fix-design-tokens.js`
**Description**: Design token standardization script for border radius and shadows. Replaces generic Tailwind classes (rounded-sm, shadow-md) with design system tokens (rounded-xl, shadow-elevation-1).  
**Functions**: Processes files, replaces design token classes  
**Status**: ✅ Keep (One-time use, but useful for future standardization)

### `scripts/fix-colors.js`
**Description**: Color standardization script for replacing non-brand colors with design system colors.  
**Functions**: Processes files, replaces color classes  
**Status**: ✅ Keep (One-time use, but useful for future standardization)

### `scripts/fix-remaining-colors.js`
**Description**: Final cleanup script for color violations, replacing gray-* with slate-* and red-* with error-* across the codebase.  
**Functions**: Processes files, replaces remaining color violations  
**Status**: ✅ Keep (One-time use, but useful for future standardization)

### `scripts/fix-accessibility.js`
**Description**: Accessibility fix script for adding ARIA labels and improving accessibility.  
**Functions**: Processes files, adds ARIA attributes  
**Status**: ✅ Keep (One-time use, but useful for future standardization)

---

## Database Audit Scripts

### `scripts/full-db-audit.js`
**Description**: Comprehensive database audit script that compares Sequelize models with actual database schema, checking for mismatches, missing columns, ENUM inconsistencies, and foreign key issues.  
**Functions**: `auditDatabase()`, `compareModels()`, `checkENUMs()`, `checkForeignKeys()`  
**Status**: ✅ Keep (Useful for ongoing database maintenance)

### `scripts/code-based-db-audit.js`
**Description**: Static code-based database audit script that analyzes models, endpoints, and services without a live DB connection. Provides insights into code-level data handling.  
**Functions**: Analyzes models, endpoints, services statically  
**Status**: ✅ Keep (Useful for code review and documentation)

### `scripts/verify-db-schema.js`
**Description**: Database schema verification script to compare Sequelize models with database schema.  
**Functions**: Verifies schema consistency  
**Status**: ✅ Keep

### `scripts/verify-db-tables.js`
**Description**: Database tables verification script to check table existence and structure.  
**Functions**: Verifies table existence and structure  
**Status**: ✅ Keep

### `scripts/verify-api-endpoints.js`
**Description**: API endpoint audit script to verify API endpoints correctly process data fields.  
**Functions**: Audits API endpoints for field handling  
**Status**: ✅ Keep

### `scripts/verify-frontend-services.js`
**Description**: Frontend service audit script to verify frontend services send/receive correct data.  
**Functions**: Audits frontend services for data mapping  
**Status**: ✅ Keep

---

## Deployment Scripts

### `scripts/deploy.sh`
**Description**: Deployment script for production deployment with build, test, and deployment steps.  
**Functions**: Builds application, runs tests, deploys to production  
**Status**: ✅ Keep (Production deployment)

### `scripts/vercel-install.sh`
**Description**: Vercel installation and setup script.  
**Functions**: Sets up Vercel deployment  
**Status**: ✅ Keep (If using Vercel)

### `scripts/setup-lightsail.sh`
**Description**: AWS Lightsail setup script for server configuration.  
**Functions**: Configures Lightsail instance  
**Status**: ✅ Keep (If using Lightsail)

### `scripts/ssl-setup.sh`
**Description**: SSL certificate setup script for HTTPS configuration.  
**Functions**: Sets up SSL certificates  
**Status**: ✅ Keep (Production deployment)

### `scripts/monitoring-setup.sh`
**Description**: Monitoring setup script for application monitoring and logging.  
**Functions**: Sets up monitoring tools  
**Status**: ✅ Keep (Production deployment)

### `scripts/security-hardening.sh`
**Description**: Security hardening script for server security configuration.  
**Functions**: Hardens server security  
**Status**: ✅ Keep (Production deployment)

### `scripts/launch-verification.sh`
**Description**: Launch verification script to verify deployment and system health.  
**Functions**: Verifies deployment health  
**Status**: ✅ Keep (Production deployment)

---

## Notes

- **Automation scripts** (fix-typography.js, fix-colors.js, etc.) are one-time use scripts but should be kept for reference and potential future use.
- **Database audit scripts** are useful for ongoing maintenance and should be run periodically.
- **Deployment scripts** are essential for production deployment and should be kept and maintained.

---

**Next:** See [Part 5: Other Directories and Summary](REPOSITORY_INVENTORY_PART5_OTHER_AND_SUMMARY.md)

