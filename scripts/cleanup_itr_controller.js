const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../backend/src/controllers/ITRController.js');
const raw = fs.readFileSync(filePath, 'utf8');
const lines = raw.split(/\r?\n/);

console.log(`Original lines: ${lines.length}`);

// We want to DELETE lines 4311 to 5300 (1-based).
// 0-based: index 4310 to 5299.
// But wait, line 5300 was "  }". This belongs to the helper method we are deleting?
// See Step 2388. Line 5300 is "  }". Line 5301 is comment.
// So yes, delete 5300 (index 5299).
// So keep 0 to 4309 (4310 lines).
// And keep 5300 to end (lines 5301+).

const startDelete = 4311;
const endDelete = 5300;

if (startDelete > lines.length || endDelete > lines.length) {
    console.error('Indices out of bounds');
    process.exit(1);
}

const keptHeader = lines.slice(0, startDelete - 1); // 0 to 4309
const keptFooter = lines.slice(endDelete); // 5300 to end

const newLines = [...keptHeader, ...keptFooter];
const newContent = newLines.join('\n');

console.log(`New lines: ${newLines.length}`);
console.log(`Deleted: ${lines.length - newLines.length}`);

// fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Dry run complete. Use writeFileSync to save.');
console.log('Sample of cut point:');
console.log('--- Last Kept Header ---');
console.log(keptHeader[keptHeader.length - 1]);
console.log('--- First Kept Footer ---');
console.log(keptFooter[0]);

// Actually write it if everything looks right.
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('File updated.');
