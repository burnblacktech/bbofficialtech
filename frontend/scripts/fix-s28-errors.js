/**
 * Fix S28 Compilation Errors
 * 
 * Fixes duplicate imports and JSX issues from automated refactoring
 * Run: node frontend/scripts/fix-s28-errors.js
 */

const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, '../src/pages');

/**
 * Remove duplicate imports
 */
function removeDuplicateImports(content) {
    const lines = content.split('\n');
    const seenImports = new Set();
    const result = [];

    for (const line of lines) {
        // Check if it's an import line
        if (line.trim().startsWith('import ')) {
            // Extract import identifier
            const match = line.match(/import\s+(?:\{([^}]+)\}|(\w+))\s+from/);
            if (match) {
                const imports = match[1] || match[2];
                const key = imports.trim();

                // Skip if we've seen this import
                if (seenImports.has(key)) {
                    console.log(`  Removing duplicate: ${line.trim()}`);
                    continue;
                }
                seenImports.add(key);
            }
        }

        result.push(line);
    }

    return result.join('\n');
}

/**
 * Remove trailing spaces
 */
function removeTrailingSpaces(content) {
    return content.split('\n').map(line => line.trimEnd()).join('\n');
}

/**
 * Remove multiple empty lines
 */
function removeMultipleEmptyLines(content) {
    return content.replace(/\n\n\n+/g, '\n\n');
}

/**
 * Fix a single file
 */
function fixFile(filePath) {
    console.log(`\n📄 Fixing: ${path.basename(filePath)}`);

    let content = fs.readFileSync(filePath, 'utf8');
    let fixed = false;

    // Remove duplicate imports
    const beforeImports = content;
    content = removeDuplicateImports(content);
    if (content !== beforeImports) {
        fixed = true;
    }

    // Remove trailing spaces
    const beforeSpaces = content;
    content = removeTrailingSpaces(content);
    if (content !== beforeSpaces) {
        console.log('  ✓ Removed trailing spaces');
        fixed = true;
    }

    // Remove multiple empty lines
    const beforeLines = content;
    content = removeMultipleEmptyLines(content);
    if (content !== beforeLines) {
        console.log('  ✓ Removed multiple empty lines');
        fixed = true;
    }

    if (fixed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('  ✅ Fixed');
    } else {
        console.log('  ⏭️  No issues found');
    }
}

/**
 * Find all JS/JSX/TSX files
 */
function findFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            findFiles(filePath, fileList);
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
    console.log('🔧 Fixing S28 Compilation Errors\n');

    const files = findFiles(PAGES_DIR);
    console.log(`📊 Found ${files.length} files\n`);

    let fixedCount = 0;

    files.forEach((filePath, index) => {
        try {
            fixFile(filePath);
            fixedCount++;
        } catch (error) {
            console.error(`  ❌ Error: ${error.message}`);
        }

        if ((index + 1) % 20 === 0) {
            console.log(`\n📈 Progress: ${index + 1}/${files.length}`);
        }
    });

    console.log('\n\n✅ Fix Complete!\n');
    console.log(`📊 Summary:`);
    console.log(`   - Total files: ${files.length}`);
    console.log(`   - Processed: ${fixedCount}`);
    console.log('\n⚠️  Next: Check for remaining JSX errors manually');
}

if (require.main === module) {
    main();
}

module.exports = { fixFile };
