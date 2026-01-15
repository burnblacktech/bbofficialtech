#!/usr/bin/env node

/**
 * Automated Import Migration Script
 * Migrates old DesignSystem imports to new Atomic Design structure
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
};

// Import replacement patterns
const replacements = [
    // Button imports
    {
        pattern: /import\s+{\s*Button\s*}\s+from\s+['"]\.\.\/DesignSystem['"]/g,
        replacement: "import Button from '../atoms/Button'",
        component: 'Button',
    },
    {
        pattern: /import\s+{\s*Button\s*}\s+from\s+['"]\.\.\/\.\.\/DesignSystem['"]/g,
        replacement: "import Button from '../../atoms/Button'",
        component: 'Button',
    },
    {
        pattern: /import\s+{\s*Button\s*}\s+from\s+['"]@\/components\/DesignSystem['"]/g,
        replacement: "import Button from '@/components/atoms/Button'",
        component: 'Button',
    },

    // Card imports
    {
        pattern: /import\s+{\s*Card\s*}\s+from\s+['"]\.\.\/DesignSystem['"]/g,
        replacement: "import Card from '../atoms/Card'",
        component: 'Card',
    },
    {
        pattern: /import\s+{\s*Card\s*}\s+from\s+['"]\.\.\/\.\.\/DesignSystem['"]/g,
        replacement: "import Card from '../../atoms/Card'",
        component: 'Card',
    },

    // Input imports
    {
        pattern: /import\s+{\s*Input\s*}\s+from\s+['"]\.\.\/DesignSystem['"]/g,
        replacement: "import Input from '../atoms/Input'",
        component: 'Input',
    },
    {
        pattern: /import\s+{\s*Input\s*}\s+from\s+['"]\.\.\/\.\.\/DesignSystem['"]/g,
        replacement: "import Input from '../../atoms/Input'",
        component: 'Input',
    },

    // Badge imports
    {
        pattern: /import\s+{\s*Badge\s*}\s+from\s+['"]\.\.\/DesignSystem['"]/g,
        replacement: "import Badge from '../atoms/Badge'",
        component: 'Badge',
    },
];

// Statistics
const stats = {
    filesScanned: 0,
    filesModified: 0,
    importsMigrated: 0,
    errors: 0,
};

function migrateFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        const changes = [];

        replacements.forEach(({ pattern, replacement, component }) => {
            const matches = content.match(pattern);
            if (matches) {
                content = content.replace(pattern, replacement);
                modified = true;
                changes.push(component);
                stats.importsMigrated += matches.length;
            }
        });

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            stats.filesModified++;
            console.log(
                `${colors.green}✓${colors.reset} ${filePath}\n` +
                `  Migrated: ${colors.blue}${changes.join(', ')}${colors.reset}`
            );
        }
    } catch (error) {
        stats.errors++;
        console.error(
            `${colors.red}✗${colors.reset} ${filePath}\n` +
            `  Error: ${error.message}`
        );
    }
}

function main() {
    console.log(`${colors.blue}Starting import migration...${colors.reset}\n`);

    const srcDir = path.join(__dirname, '..', 'src');
    const pattern = path.join(srcDir, '**', '*.{js,jsx}').replace(/\\/g, '/');

    glob(pattern, { ignore: ['**/node_modules/**', '**/build/**'] }, (err, files) => {
        if (err) {
            console.error(`${colors.red}Error scanning files:${colors.reset}`, err);
            process.exit(1);
        }

        stats.filesScanned = files.length;
        console.log(`Found ${colors.yellow}${files.length}${colors.reset} files to scan\n`);

        files.forEach(migrateFile);

        // Print summary
        console.log(`\n${colors.blue}Migration Summary:${colors.reset}`);
        console.log(`Files scanned: ${colors.yellow}${stats.filesScanned}${colors.reset}`);
        console.log(`Files modified: ${colors.green}${stats.filesModified}${colors.reset}`);
        console.log(`Imports migrated: ${colors.green}${stats.importsMigrated}${colors.reset}`);

        if (stats.errors > 0) {
            console.log(`Errors: ${colors.red}${stats.errors}${colors.reset}`);
        }

        console.log(`\n${colors.green}✓ Migration complete!${colors.reset}`);
    });
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { migrateFile, replacements };
