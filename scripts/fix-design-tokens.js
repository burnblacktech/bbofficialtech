#!/usr/bin/env node

/**
 * Design Token Standardization Script
 * Automatically replaces non-standard border radius and shadow classes with design system tokens
 * 
 * Usage: node scripts/fix-design-tokens.js [--dry-run] [--path=frontend/src] [--type=border-radius|shadows|all]
 */

const fs = require('fs');
const path = require('path');

// Border radius replacement mapping
const BORDER_RADIUS_MAP = {
  'rounded-sm': 'rounded-xl',    // 2px → 12px (standard)
  'rounded-md': 'rounded-xl',    // 6px → 12px (standard)
  'rounded-lg': 'rounded-xl',    // 8px → 12px (standard)
  // Keep: rounded-xl, rounded-2xl, rounded-3xl, rounded-full
};

// Shadow replacement mapping
const SHADOW_MAP = {
  'shadow-sm': 'shadow-elevation-1',     // Level 1: cards at rest
  'shadow-md': 'shadow-elevation-2',     // Level 2: cards hover
  'shadow-lg': 'shadow-elevation-3',     // Level 3: dropdowns, popovers
  'shadow-xl': 'shadow-elevation-4',     // Level 4: modals, dialogs
  'shadow-2xl': 'shadow-elevation-4',   // Extra large → Level 4
  // Keep: shadow-none, shadow-elevation-*, shadow-gold-accent
};

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const customPath = args.find(arg => arg.startsWith('--path='))?.split('=')[1] || 'frontend/src';
const fixType = args.find(arg => arg.startsWith('--type='))?.split('=')[1] || 'all';

const stats = {
  filesProcessed: 0,
  filesModified: 0,
  borderRadiusReplacements: 0,
  shadowReplacements: 0,
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
 * Replace design tokens in file content
 */
function replaceDesignTokens(content, filePath) {
  let modified = content;
  let borderRadiusCount = 0;
  let shadowCount = 0;

  // Replace border radius
  if (fixType === 'all' || fixType === 'border-radius') {
    Object.entries(BORDER_RADIUS_MAP).forEach(([oldClass, newClass]) => {
      const regex = new RegExp(`\\b${oldClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
      const matches = modified.match(regex);
      
      if (matches) {
        modified = modified.replace(regex, newClass);
        borderRadiusCount += matches.length;
      }
    });
  }

  // Replace shadows
  if (fixType === 'all' || fixType === 'shadows') {
    Object.entries(SHADOW_MAP).forEach(([oldClass, newClass]) => {
      const regex = new RegExp(`\\b${oldClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
      const matches = modified.match(regex);
      
      if (matches) {
        modified = modified.replace(regex, newClass);
        shadowCount += matches.length;
      }
    });
  }

  return { 
    content: modified, 
    borderRadiusReplacements: borderRadiusCount,
    shadowReplacements: shadowCount,
    totalReplacements: borderRadiusCount + shadowCount
  };
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    stats.filesProcessed++;
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, borderRadiusReplacements, shadowReplacements, totalReplacements } = replaceDesignTokens(content, filePath);

    if (totalReplacements > 0) {
      stats.borderRadiusReplacements += borderRadiusReplacements;
      stats.shadowReplacements += shadowReplacements;
      
      if (!isDryRun) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        stats.filesModified++;
        const details = [];
        if (borderRadiusReplacements > 0) details.push(`${borderRadiusReplacements} border-radius`);
        if (shadowReplacements > 0) details.push(`${shadowReplacements} shadows`);
        console.log(`✓ ${filePath} (${details.join(', ')})`);
      } else {
        const details = [];
        if (borderRadiusReplacements > 0) details.push(`${borderRadiusReplacements} border-radius`);
        if (shadowReplacements > 0) details.push(`${shadowReplacements} shadows`);
        console.log(`[DRY RUN] ${filePath} (${details.join(', ')} would be fixed)`);
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
  console.log('🎨 Design Token Standardization Script\n');
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (files will be modified)'}`);
  console.log(`Path: ${customPath}`);
  console.log(`Type: ${fixType}\n`);

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
  console.log(`  Border radius replacements: ${stats.borderRadiusReplacements}`);
  console.log(`  Shadow replacements: ${stats.shadowReplacements}`);
  console.log(`  Total replacements: ${stats.borderRadiusReplacements + stats.shadowReplacements}`);
  
  if (stats.errors.length > 0) {
    console.log(`  Errors: ${stats.errors.length}`);
    stats.errors.forEach(({ file, error }) => {
      console.log(`    - ${file}: ${error}`);
    });
  }

  if (isDryRun) {
    console.log('\n⚠️  This was a dry run. Use without --dry-run to apply changes.');
  } else {
    console.log('\n✅ Design token standardization complete!');
  }
}

// Run the script
main();

