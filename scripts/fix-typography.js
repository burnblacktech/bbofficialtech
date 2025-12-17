#!/usr/bin/env node

/**
 * Typography Standardization Script
 * Automatically replaces direct Tailwind size classes with design system tokens
 * 
 * Usage: node scripts/fix-typography.js [--dry-run] [--path=frontend/src]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Typography replacement mapping
const TYPOGRAPHY_MAP = {
  // Direct size replacements
  'text-xs': 'text-body-small',           // 12px
  'text-sm': 'text-body-regular',         // 14px
  'text-base': 'text-body-large',         // 16px
  'text-lg': 'text-body-large',           // 18px → 16px (body-large, context-dependent)
  'text-xl': 'text-heading-3',            // 20px
  'text-2xl': 'text-heading-2',          // 24px
  'text-3xl': 'text-heading-1',          // 28px
  'text-4xl': 'text-heading-1',          // 36px → 28px (closest)
  'text-5xl': 'text-display-2',          // 48px → 36px (display-2)
  'text-6xl': 'text-display-1',         // 60px → 48px (display-1)
};

// Context-aware replacements for headings
const HEADING_PATTERNS = [
  { pattern: /<(h[1-6]|h1|h2|h3|h4|h5|h6)[^>]*className="[^"]*\btext-lg\b/g, replace: 'text-heading-4' },
  { pattern: /<(h[1-6]|h1|h2|h3|h4|h5|h6)[^>]*className="[^"]*\btext-xl\b/g, replace: 'text-heading-3' },
  { pattern: /<(h[1-6]|h1|h2|h3|h4|h5|h6)[^>]*className="[^"]*\btext-2xl\b/g, replace: 'text-heading-2' },
  { pattern: /<(h[1-6]|h1|h2|h3|h4|h5|h6)[^>]*className="[^"]*\btext-3xl\b/g, replace: 'text-heading-1' },
];

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
      // Skip node_modules, .git, build, dist, etc.
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
 * Replace typography classes in file content
 */
function replaceTypography(content, filePath) {
  let modified = content;
  let fileReplacements = 0;
  const processedRanges = [];

  // First, handle heading elements with context-aware replacements
  const headingRegex = /<(h[1-6]|h1|h2|h3|h4|h5|h6)[^>]*className="([^"]*)"/g;
  modified = modified.replace(headingRegex, (match, tag, className) => {
    let newClassName = className;
    const headingMap = {
      'text-lg': 'text-heading-4',
      'text-xl': 'text-heading-3',
      'text-2xl': 'text-heading-2',
      'text-3xl': 'text-heading-1',
      'text-4xl': 'text-heading-1',
    };
    
    Object.entries(headingMap).forEach(([oldClass, newClass]) => {
      const regex = new RegExp(`\\b${oldClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
      if (regex.test(newClassName)) {
        newClassName = newClassName.replace(regex, newClass);
        fileReplacements++;
      }
    });
    
    return match.replace(className, newClassName);
  });

  // Then, do general replacements for non-heading elements
  Object.entries(TYPOGRAPHY_MAP).forEach(([oldClass, newClass]) => {
    // Match the class in className strings, preserving other classes
    // But skip if it's in a heading tag (already processed)
    const escapedClass = oldClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`className="([^"]*)\\b${escapedClass}\\b([^"]*)"`, 'g');
    
    modified = modified.replace(regex, (match, before, after) => {
      // Check if this is inside a heading tag by looking backwards
      const matchIndex = modified.indexOf(match);
      const beforeMatch = modified.substring(Math.max(0, matchIndex - 200), matchIndex);
      if (/<(h[1-6]|h1|h2|h3|h4|h5|h6)[^>]*$/.test(beforeMatch)) {
        return match; // Skip, already processed
      }
      
      // Replace with appropriate token
      let replacement = newClass;
      // For text-lg in non-headings, use body-large
      if (oldClass === 'text-lg') {
        replacement = 'text-body-large';
      }
      
      fileReplacements++;
      return match.replace(new RegExp(`\\b${escapedClass}\\b`), replacement);
    });
  });

  return { content: modified, replacements: fileReplacements };
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    stats.filesProcessed++;
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, replacements } = replaceTypography(content, filePath);

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
  console.log('🔤 Typography Standardization Script\n');
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
    console.log('\n✅ Typography standardization complete!');
  }
}

// Run the script
main();

