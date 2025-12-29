const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'src/routes');
const files = fs.readdirSync(routesDir);

console.log(`Found ${files.length} files in routes directory.`);

let failures = 0;

files.forEach(file => {
    if (file === 'index.js' || file === 'router.js') return;
    if (!file.endsWith('.js')) return;

    try {
        console.log(`Testing ${file}...`);
        require(path.join(routesDir, file));
        console.log(`✅ ${file} OK`);
    } catch (e) {
        console.error(`❌ ${file} FAILED:`, e.message);
        failures++;
    }
});

if (failures > 0) {
    console.error(`\n${failures} routes failed to load.`);
    process.exit(1);
} else {
    console.log('\nAll routes loaded successfully!');
}
