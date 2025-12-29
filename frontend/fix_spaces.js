const fs = require('fs');
const path = 'e:\\Burnblack\\bbofficial\\frontend\\src\\pages\\ITR\\ITRComputation.js';

try {
    const content = fs.readFileSync(path, 'utf8');
    const lines = content.split(/\r?\n/);
    const cleanedLines = lines.map(line => line.trimRight());
    // Use \n or \r\n? Source likely uses CRLF on Windows, but let's stick to what's common.
    // Preserving original line ending style is hard if mixed, but usually consistency is good.
    const newContent = cleanedLines.join('\n'); // normalization to LF is usually fine for git
    fs.writeFileSync(path, newContent, 'utf8');
    console.log(`Cleaned trailing spaces in ${lines.length} lines.`);
} catch (e) {
    console.error('Error:', e);
}
