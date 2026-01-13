/**
 * Final S28 Fix - Restore JSX Structure
 * Removes TODO comments that broke JSX
 */

const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, '../src/pages');

function removeTODOComments(content) {
    // Remove the TODO comment blocks that broke JSX
    const lines = content.split('\n');
    const result = [];
    let skipNext = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Skip TODO comment blocks
        if (line.includes('// TODO: Wrap in')) {
            // Skip this line and the next 4 lines (the example block)
            i += 4;
            continue;
        }

        result.push(line);
    }

    return result.join('\n');
}

function fixFile(filePath) {
    const filename = path.basename(filePath);

    let content = fs.readFileSync(filePath, 'utf8');
    const before = content;

    content = removeTODOComments(content);

    if (content !== before) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Fixed: ${filename}`);
    }
}

function findFiles(dir, files = []) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            findFiles(fullPath, files);
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            files.push(fullPath);
        }
    });
    return files;
}

console.log('🔧 Removing TODO comments that broke JSX...\n');

const files = findFiles(PAGES_DIR);
files.forEach(fixFile);

console.log('\n✅ Done! Frontend should compile now.');
console.log('Note: TODO comments removed - use LoginPage as reference for manual wrapping.');
