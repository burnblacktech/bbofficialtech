// =====================================================
// PRETTIER CONFIGURATION
// Code formatting standards for the BurnBlack platform
// =====================================================

module.exports = {
  semi: true,
  trailingComma: true,
  singleQuote: true,
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',
  proseWrap: 80,
  endOfLine: 'lf',
  quoteProps: 'as-needed',
  jsxSingleQuote: true,
  jsxBracketSameLine: false,
  requirePragma: false,
  insertPragma: false,

  // Vue/JSX specific
  htmlWhitespaceSensitivity: 'ignore',

  // Import sorting
  importOrder: [
    '^react',
    '^next',
    '^@',
    '^[./]',
    '^[../]'
  ],

  // Rules to override
  overrides: [
    {
      files: ['*.json', '*.jsonc'],
      options: {
        printWidth: 2
      }
    },
    {
      files: ['*.md', '*.mdx'],
      options: {
        proseWrap: 80
      }
    },
    {
      files: ['*.css', '*.scss', '*.less'],
      options: {
        singleQuote: false
      }
    }
  ]
};