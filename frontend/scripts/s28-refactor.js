/**
 * S28 Automated Refactoring Script
 * 
 * Systematically refactors all 154 screens to use:
 * - AppShell templates (Orientation/DataEntry/Review/Status)
 * - Design tokens
 * - Contracted components (Card, Button)
 * 
 * Run: node scripts/s28-refactor.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const PAGES_DIR = path.join(__dirname, '../src/pages');
const BACKUP_DIR = path.join(__dirname, '../src/_deprecated/pages_pre_s28');

// Archetype detection patterns
const ARCHETYPES = {
    orientation: {
        keywords: ['overview', 'welcome', 'dashboard', 'determination', 'start', 'success'],
        indicators: ['reassurance', 'guide', 'orient', 'primary cta'],
    },
    dataEntry: {
        keywords: ['details', 'form', 'add', 'edit', 'create', 'input', 'capture'],
        indicators: ['<form', 'onChange', 'onSubmit', 'useState'],
    },
    review: {
        keywords: ['breakdown', 'summary', 'review', 'readiness', 'comparison'],
        indicators: ['read-only', 'no forms', 'cards stacked'],
    },
    status: {
        keywords: ['status', 'confirmation', 'submitted', 'processing', 'result'],
        indicators: ['calm', 'minimal', 'recovery'],
    },
};

// Template imports
const TEMPLATE_IMPORTS = {
    orientation: "import { OrientationPage } from '../../components/templates';",
    dataEntry: "import { DataEntryPage } from '../../components/templates';",
    review: "import { ReviewPage } from '../../components/templates';",
    status: "import { StatusPage } from '../../components/templates';",
};

const COMPONENT_IMPORTS = `
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { typography, spacing, components, layout } from '../../styles/designTokens';
`.trim();

/**
 * Detect archetype based on filename and content
 */
function detectArchetype(filename, content) {
    const lowerFilename = filename.toLowerCase();
    const lowerContent = content.toLowerCase();

    for (const [archetype, config] of Object.entries(ARCHETYPES)) {
        // Check filename keywords
        if (config.keywords.some(keyword => lowerFilename.includes(keyword))) {
            return archetype;
        }

        // Check content indicators
        if (config.indicators.some(indicator => lowerContent.includes(indicator))) {
            return archetype;
        }
    }

    // Default to dataEntry for forms, orientation otherwise
    return lowerContent.includes('<form') ? 'dataEntry' : 'orientation';
}

/**
 * Extract title from component
 */
function extractTitle(content) {
    // Try to find h1, h2, or title prop
    const h1Match = content.match(/<h1[^>]*>([^<]+)<\/h1>/);
    if (h1Match) return h1Match[1].trim();

    const h2Match = content.match(/<h2[^>]*>([^<]+)<\/h2>/);
    if (h2Match) return h2Match[1].trim();

    const titleMatch = content.match(/title=["']([^"']+)["']/);
    if (titleMatch) return titleMatch[1].trim();

    return 'Page Title'; // Fallback
}

/**
 * Replace custom buttons with Button component
 */
function replaceButtons(content) {
    // Match common button patterns
    const buttonPatterns = [
        // <button className="..." onClick={...}>Text</button>
        /<button\s+className="[^"]*bg-gold[^"]*"[^>]*onClick=\{([^}]+)\}[^>]*>([^<]+)<\/button>/g,
        /<button\s+onClick=\{([^}]+)\}[^>]*className="[^"]*bg-gold[^"]*"[^>]*>([^<]+)<\/button>/g,
    ];

    let result = content;

    buttonPatterns.forEach(pattern => {
        result = result.replace(pattern, (match, onClick, text) => {
            return `<Button variant="primary" onClick={${onClick}}>${text}</Button>`;
        });
    });

    return result;
}

/**
 * Replace custom cards with Card component
 */
function replaceCards(content) {
    // Match common card patterns
    const cardPattern = /<div\s+className="[^"]*bg-white[^"]*rounded[^"]*border[^"]*"[^>]*>([\s\S]*?)<\/div>/g;

    return content.replace(cardPattern, (match, innerContent) => {
        // Only replace if it looks like a card (has padding, border, etc.)
        if (match.includes('p-') && match.includes('border')) {
            return `<Card>${innerContent}</Card>`;
        }
        return match;
    });
}

/**
 * Wrap content in appropriate template
 */
function wrapInTemplate(archetype, title, content) {
    const templates = {
        orientation: `
      <OrientationPage
        title="${title}"
        primaryAction={<Button variant="primary">Continue</Button>}
      >
        ${content}
      </OrientationPage>
    `,
        dataEntry: `
      <DataEntryPage
        title="${title}"
      >
        ${content}
      </DataEntryPage>
    `,
        review: `
      <ReviewPage
        title="${title}"
      >
        ${content}
      </ReviewPage>
    `,
        status: `
      <StatusPage
        title="${title}"
      >
        ${content}
      </StatusPage>
    `,
    };

    return templates[archetype] || templates.orientation;
}

/**
 * Refactor a single file
 */
function refactorFile(filePath) {
    console.log(`\n📄 Processing: ${path.basename(filePath)}`);

    let content = fs.readFileSync(filePath, 'utf8');
    const filename = path.basename(filePath);

    // Skip if already refactored
    if (content.includes('OrientationPage') ||
        content.includes('DataEntryPage') ||
        content.includes('ReviewPage') ||
        content.includes('StatusPage')) {
        console.log('  ⏭️  Already refactored, skipping');
        return;
    }

    // Detect archetype
    const archetype = detectArchetype(filename, content);
    console.log(`  🎯 Archetype: ${archetype}`);

    // Extract title
    const title = extractTitle(content);
    console.log(`  📝 Title: ${title}`);

    // Add imports
    const hasTemplateImport = content.includes('components/templates');
    if (!hasTemplateImport) {
        const importSection = content.match(/import.*from.*;/g);
        if (importSection) {
            const lastImport = importSection[importSection.length - 1];
            content = content.replace(lastImport, `${lastImport}\n${TEMPLATE_IMPORTS[archetype]}\n${COMPONENT_IMPORTS}`);
        }
    }

    // Replace components
    content = replaceButtons(content);
    content = replaceCards(content);

    // Note: Full template wrapping requires more sophisticated parsing
    // For now, we'll add comments to guide manual completion
    if (!content.includes('<OrientationPage') &&
        !content.includes('<DataEntryPage') &&
        !content.includes('<ReviewPage') &&
        !content.includes('<StatusPage')) {

        // Add TODO comment
        const returnMatch = content.match(/return\s*\(/);
        if (returnMatch) {
            const todoComment = `
  // TODO: Wrap in ${archetype}Page template
  // Example:
  // <${archetype.charAt(0).toUpperCase() + archetype.slice(1)}Page title="${title}">
  //   {/* content */}
  // </${archetype.charAt(0).toUpperCase() + archetype.slice(1)}Page>
  `;
            content = content.replace('return (', `${todoComment}\n  return (`);
        }
    }

    // Write refactored file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('  ✅ Refactored');
}

/**
 * Recursively find all JS/JSX/TSX files
 */
function findScreenFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            findScreenFiles(filePath, fileList);
        } else if (/\.(js|jsx|tsx)$/.test(file) && !file.includes('.test.')) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

/**
 * Main execution
 */
function main() {
    console.log('🚀 S28 Automated Refactoring Script\n');
    console.log('📁 Scanning pages directory...');

    // Create backup
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        console.log(`📦 Created backup directory: ${BACKUP_DIR}`);
    }

    // Find all screen files
    const screenFiles = findScreenFiles(PAGES_DIR);
    console.log(`\n📊 Found ${screenFiles.length} screen files\n`);

    // Process each file
    let refactoredCount = 0;
    let skippedCount = 0;

    screenFiles.forEach((filePath, index) => {
        try {
            // Backup original
            const backupPath = path.join(BACKUP_DIR, path.relative(PAGES_DIR, filePath));
            const backupDir = path.dirname(backupPath);
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }
            fs.copyFileSync(filePath, backupPath);

            // Refactor
            refactorFile(filePath);
            refactoredCount++;
        } catch (error) {
            console.error(`  ❌ Error: ${error.message}`);
            skippedCount++;
        }

        // Progress
        if ((index + 1) % 10 === 0) {
            console.log(`\n📈 Progress: ${index + 1}/${screenFiles.length}`);
        }
    });

    console.log('\n\n✅ Refactoring Complete!\n');
    console.log(`📊 Summary:`);
    console.log(`   - Total files: ${screenFiles.length}`);
    console.log(`   - Refactored: ${refactoredCount}`);
    console.log(`   - Skipped: ${skippedCount}`);
    console.log(`\n💾 Backups saved to: ${BACKUP_DIR}`);
    console.log('\n⚠️  Next steps:');
    console.log('   1. Review TODO comments in files');
    console.log('   2. Complete template wrapping manually where needed');
    console.log('   3. Test each screen at 360px, 768px, 1024px');
    console.log('   4. Run: npm run start');
}

// Run
if (require.main === module) {
    main();
}

module.exports = { refactorFile, detectArchetype };
