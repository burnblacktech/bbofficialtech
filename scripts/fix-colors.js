#!/usr/bin/env node

/**
 * Color Replacement Script
 * Automatically replaces non-brand colors with design system colors
 * 
 * Usage: node scripts/fix-colors.js [--dry-run] [--file <path>]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color mapping rules
const COLOR_MAPPINGS = {
  // Gray → Slate
  'gray-50': 'slate-50',
  'gray-100': 'slate-100',
  'gray-200': 'slate-200',
  'gray-300': 'slate-300',
  'gray-400': 'slate-400',
  'gray-500': 'slate-500',
  'gray-600': 'slate-600',
  'gray-700': 'slate-700',
  'gray-800': 'slate-800',
  'gray-900': 'slate-900',
  'gray-950': 'slate-950',
  
  // Blue → Primary or Info
  'blue-50': 'info-50',
  'blue-100': 'info-100',
  'blue-200': 'info-200',
  'blue-300': 'info-300',
  'blue-400': 'info-400',
  'blue-500': 'primary-500', // Primary actions
  'blue-600': 'primary-600',
  'blue-700': 'primary-700',
  'blue-800': 'primary-800',
  'blue-900': 'primary-900',
  
  // Green → Success
  'green-50': 'success-50',
  'green-100': 'success-100',
  'green-200': 'success-200',
  'green-300': 'success-300',
  'green-400': 'success-400',
  'green-500': 'success-500',
  'green-600': 'success-600',
  'green-700': 'success-700',
  'green-800': 'success-800',
  'green-900': 'success-900',
  
  // Purple → Primary or Ember
  'purple-50': 'primary-50',
  'purple-100': 'primary-100',
  'purple-200': 'primary-200',
  'purple-300': 'primary-300',
  'purple-400': 'primary-400',
  'purple-500': 'primary-500',
  'purple-600': 'ember-600',
  'purple-700': 'ember-700',
  'purple-800': 'ember-800',
  'purple-900': 'ember-900',
  
  // Orange → Ember
  'orange-50': 'ember-50',
  'orange-100': 'ember-100',
  'orange-200': 'ember-200',
  'orange-300': 'ember-300',
  'orange-400': 'ember-400',
  'orange-500': 'ember-500',
  'orange-600': 'ember-600',
  'orange-700': 'ember-700',
  'orange-800': 'ember-800',
  'orange-900': 'ember-900',
  
  // Neutral → Slate
  'neutral-50': 'slate-50',
  'neutral-100': 'slate-100',
  'neutral-200': 'slate-200',
  'neutral-300': 'slate-300',
  'neutral-400': 'slate-400',
  'neutral-500': 'slate-500',
  'neutral-600': 'slate-600',
  'neutral-700': 'slate-700',
  'neutral-800': 'slate-800',
  'neutral-900': 'slate-900',
};

// Patterns to match color classes in className strings
const COLOR_PATTERNS = [
  // Standard Tailwind classes: bg-gray-500, text-blue-600, etc.
  /\b(bg|text|border|ring|outline|from|to|via|divide|placeholder|caret|accent|shadow|fill|stroke)-(gray|blue|green|purple|orange|neutral)-\d{2,3}\b/g,
  
  // Hover/focus states: hover:bg-gray-500, focus:ring-blue-600, etc.
  /\b(hover|focus|active|disabled|group-hover|group-focus|peer-focus|peer-hover):(bg|text|border|ring|outline|from|to|via|divide|placeholder|caret|accent|shadow|fill|stroke)-(gray|blue|green|purple|orange|neutral)-\d{2,3}\b/g,
  
  // Focus-visible states
  /\bfocus-visible:(bg|text|border|ring|outline|from|to|via|divide|placeholder|caret|accent|shadow|fill|stroke)-(gray|blue|green|purple|orange|neutral)-\d{2,3}\b/g,
];

// Files to exclude
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /dist/,
  /build/,
  /\.next/,
  /coverage/,
  /scripts\/fix-colors\.js$/, // Exclude this script itself
  /tailwind\.config\.js$/, // Don't modify Tailwind config
  /\.md$/, // Don't modify markdown files
];

// Directories to process
const TARGET_DIRS = [
  'frontend/src/components',
  'frontend/src/pages',
  'frontend/src/features',
];

let stats = {
  filesProcessed: 0,
  filesModified: 0,
  replacements: 0,
  errors: 0,
};

/**
 * Check if file should be processed
 */
function shouldProcessFile(filePath) {
  // Only process JS/JSX/TS/TSX files
  if (!/\.(js|jsx|ts|tsx)$/.test(filePath)) {
    return false;
  }
  
  // Check exclude patterns
  for (const pattern of EXCLUDE_PATTERNS) {
    if (pattern.test(filePath)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Replace colors in a string
 */
function replaceColors(content) {
  let modified = content;
  let replacements = 0;
  
  // Replace each color mapping
  for (const [oldColor, newColor] of Object.entries(COLOR_MAPPINGS)) {
    // Match the color in various contexts
    const patterns = [
      // Direct class: bg-gray-500
      new RegExp(`\\b(bg|text|border|ring|outline|from|to|via|divide|placeholder|caret|accent|shadow|fill|stroke)-${oldColor}\\b`, 'g'),
      // With state: hover:bg-gray-500
      new RegExp(`\\b(hover|focus|active|disabled|group-hover|group-focus|peer-focus|peer-hover|focus-visible):(bg|text|border|ring|outline|from|to|via|divide|placeholder|caret|accent|shadow|fill|stroke)-${oldColor}\\b`, 'g'),
    ];
    
    for (const pattern of patterns) {
      const matches = modified.match(pattern);
      if (matches) {
        replacements += matches.length;
        modified = modified.replace(pattern, (match) => {
          return match.replace(oldColor, newColor);
        });
      }
    }
  }
  
  return { content: modified, replacements };
}

/**
 * Process a single file
 */
function processFile(filePath, dryRun = false) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, replacements } = replaceColors(content);
    
    if (replacements > 0) {
      stats.filesModified++;
      stats.replacements += replacements;
      
      if (!dryRun) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✓ ${filePath} (${replacements} replacements)`);
      } else {
        console.log(`[DRY RUN] ${filePath} (${replacements} replacements)`);
      }
    }
    
    stats.filesProcessed++;
  } catch (error) {
    stats.errors++;
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
}

/**
 * Recursively find and process files
 */
function processDirectory(dirPath, dryRun = false) {
  if (!fs.existsSync(dirPath)) {
    console.warn(`Warning: Directory not found: ${dirPath}`);
    return;
  }
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      // Skip excluded directories
      if (!EXCLUDE_PATTERNS.some(pattern => pattern.test(fullPath))) {
        processDirectory(fullPath, dryRun);
      }
    } else if (entry.isFile() && shouldProcessFile(fullPath)) {
      processFile(fullPath, dryRun);
    }
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const fileArg = args.find(arg => arg.startsWith('--file='));
  const specificFile = fileArg ? fileArg.split('=')[1] : null;
  
  console.log('🎨 Color Replacement Script');
  console.log('============================\n');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
  }
  
  if (specificFile) {
    // Process single file
    if (fs.existsSync(specificFile) && shouldProcessFile(specificFile)) {
      processFile(specificFile, dryRun);
    } else {
      console.error(`Error: File not found or excluded: ${specificFile}`);
      process.exit(1);
    }
  } else {
    // Process all target directories
    const rootDir = path.resolve(__dirname, '..');
    
    for (const targetDir of TARGET_DIRS) {
      const fullPath = path.join(rootDir, targetDir);
      console.log(`Processing: ${targetDir}`);
      processDirectory(fullPath, dryRun);
    }
  }
  
  // Print statistics
  console.log('\n📊 Statistics');
  console.log('============================');
  console.log(`Files processed: ${stats.filesProcessed}`);
  console.log(`Files modified: ${stats.filesModified}`);
  console.log(`Total replacements: ${stats.replacements}`);
  console.log(`Errors: ${stats.errors}`);
  
  if (dryRun && stats.replacements > 0) {
    console.log('\n💡 Run without --dry-run to apply changes');
  }
}

// Run the script
main();

