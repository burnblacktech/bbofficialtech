/**
 * Comprehensive S28 Error Fix
 * Removes duplicate imports more aggressively
 */

const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, '../src/pages');

function fixDuplicateImports(content) {
    const lines = content.split('\n');
    const result = [];
    const importsSeen = new Map();

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check for Card/Button imports
        if (line.includes("import { Card }") || line.includes("import { Button }")) {
            const key = line.includes("Card") ? "Card" : "Button";

            if (importsSeen.has(key)) {
                console.log(`  Skipping duplicate ${key} import`);
                continue; // Skip duplicate
            }
            importsSeen.set(key, true);
        }

        result.push(line);
    }

    return result.join('\n');
}

function fixFile(filePath) {
    const filename = path.basename(filePath);
    console.log(`Fixing: ${filename}`);

    let content = fs.readFileSync(filePath, 'utf8');
    content = fixDuplicateImports(content);
    fs.writeFileSync(filePath, content, 'utf8');
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

const files = findFiles(PAGES_DIR);
console.log(`Processing ${files.length} files...\n`);

files.forEach(fixFile);

console.log('\n✅ Done! Restart frontend to see results.');
