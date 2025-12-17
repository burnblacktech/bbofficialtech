#!/usr/bin/env node

/**
 * Remaining Color Fixes Script
 * Fixes any remaining non-brand color usage (red-*, gray-* in forms, etc.)
 * 
 * Usage: node scripts/fix-remaining-colors.js [--dry-run] [--path=frontend/src]
 */

const fs = require('fs');
const path = require('path');

// Color replacement mapping for remaining violations
const COLOR_MAP = {
  // Red colors → Error colors
  'text-red-500': 'text-error-500',
  'text-red-600': 'text-error-600',
  'text-red-700': 'text-error-700',
  'border-red-300': 'border-error-300',
  'border-red-500': 'border-error-500',
  'bg-red-50': 'bg-error-50',
  'bg-red-100': 'bg-error-100',
  
  // Gray colors → Slate colors (if not already fixed)
  'text-gray-700': 'text-slate-700',
  'text-gray-600': 'text-slate-600',
  'text-gray-500': 'text-slate-500',
  'text-gray-400': 'text-slate-400',
  'text-gray-300': 'text-slate-300',
  'text-gray-900': 'text-slate-900',
  'border-gray-300': 'border-slate-300',
  'border-gray-200': 'border-slate-200',
  'bg-gray-100': 'bg-slate-100',
  'bg-gray-50': 'bg-slate-50',
  'bg-gray-200': 'bg-slate-200',
};

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const customPath = args.find(arg => arg.startsWith('--path='))?.split('=')[1] || 'frontend/src';

const stats = {
  filesProcessed: 0,
  filesModified: 0,
  replacements: 0,
  errors: [],
};

/**
 * Recursively find all JS/JSX files
 */
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!['node_modules', '.git', 'build', 'dist', '.next', 'coverage'].includes(file)) {
        findFiles(filePath, fileList);
      }
    } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Replace remaining color violations
 */
function replaceColors(content, filePath) {
  let modified = content;
  let replacements = 0;

  Object.entries(COLOR_MAP).forEach(([oldClass, newClass]) => {
    const regex = new RegExp(`\\b${oldClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    const matches = modified.match(regex);
    
    if (matches) {
      modified = modified.replace(regex, newClass);
      replacements += matches.length;
    }
  });

  return { content: modified, replacements };
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    stats.filesProcessed++;
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, replacements } = replaceColors(content, filePath);

    if (replacements > 0) {
      stats.replacements += replacements;
      
      if (!isDryRun) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        stats.filesModified++;
        console.log(`✓ ${filePath} (${replacements} replacements)`);
      } else {
        console.log(`[DRY RUN] ${filePath} (${replacements} replacements would be made)`);
      }
    }
  } catch (error) {
    stats.errors.push({ file: filePath, error: error.message });
    console.error(`✗ Error processing ${filePath}: ${error.message}`);
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🎨 Remaining Color Fixes Script\n');
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (files will be modified)'}`);
  console.log(`Path: ${customPath}\n`);

  if (!fs.existsSync(customPath)) {
    console.error(`Error: Path ${customPath} does not exist`);
    process.exit(1);
  }

  const files = findFiles(customPath);
  console.log(`Found ${files.length} files to process...\n`);

  files.forEach(processFile);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('Summary:');
  console.log(`  Files processed: ${stats.filesProcessed}`);
  console.log(`  Files modified: ${stats.filesModified}`);
  console.log(`  Total replacements: ${stats.replacements}`);
  
  if (stats.errors.length > 0) {
    console.log(`  Errors: ${stats.errors.length}`);
    stats.errors.forEach(({ file, error }) => {
      console.log(`    - ${file}: ${error}`);
    });
  }

  if (isDryRun) {
    console.log('\n⚠️  This was a dry run. Use without --dry-run to apply changes.');
  } else {
    console.log('\n✅ Color fixes complete!');
  }
}

// Run the script
main();

