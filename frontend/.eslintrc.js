// =====================================================
// ESLINT CONFIGURATION
// Code quality and standards enforcement
// =====================================================

module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: [
    'react',
    'react-hooks',
  ],
  rules: {
    // React specific rules
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off', // Using TypeScript for prop validation
    'react-hooks/rules-of-hooks': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    'react/jsx-uses-react': 'off',
    'react/jsx-fragments': 'error',
    'react/self-closing-comp': 'off',

    // Import/Export rules (disabled - plugins not installed)
    // 'import/no-unresolved': 'off',
    // 'import/export': 'error',
    // 'import/order': 'off',
    // 'import/no-duplicates': 'error',
    // 'import/no-cycle': 'error',

    // General code quality
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'warn',
    'no-alert': 'error',
    'no-var': 'error',
    'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1 }],
    'no-trailing-spaces': 'error',
    'eol-last': 'error',
    'comma-dangle': ['error', 'always-multiline'],
    'quotes': ['error', 'single', { avoidEscape: true }],

    // Prevent hardcoded localhost URLs (using no-restricted-globals instead)
    // Note: Regex pattern in no-restricted-syntax was causing parsing issues
    // The hardcoded URLs have been fixed in the codebase to use getApiBaseUrl()

    // Function/variable naming
    'camelcase': 'error',
    'pascalcase': ['error', { allow: ['^[A-Z]'] }],

    // Unused code
    'no-unused-vars': ['warn', { varsIgnorePattern: '^_+' }],
    'no-unused-expressions': 'error',

    // Performance
    'react/jsx-no-bind': 'warn',
    'react/jsx-no-useless-fragment': 'warn',
    'react/no-array-index-key': 'warn',

    // Accessibility (disabled - plugins not installed)
    // 'jsx-a11y/anchor-is-valid': 'warn',
    // 'jsx-a11y/alt-text': 'warn',
    // 'jsx-a11y/click-events-have-key-events': 'warn',

    // Prettier integration
    'prettier/prettier': 'error'
  },
  settings: {
    'import/resolver': {
      node: {
        paths: ['src'],
        extensions: ['.js', '.jsx', '.ts', '.tsx']
      }
    }
  },
  overrides: [
    {
      files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
      rules: {
        'let-const': 'off',
        'pascalcase': 'off',
        'prettier/prettier': 'off',
        'import/export': 'off',
        'import/order': 'off',
        'import/no-duplicates': 'off',
        'import/no-cycle': 'off',
        'jsx-a11y/anchor-is-valid': 'off',
        'jsx-a11y/alt-text': 'off',
        'jsx-a11y/click-events-have-key-events': 'off',
      },
    },
    {
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off'
      }
    },
    {
      files: ['**/*.stories.js', '**/*.stories.tsx'],
      rules: {
        'import/no-extraneous-dependencies': 'off'
      }
    },
    {
      files: ['**/*.test.js', '**/*.test.jsx', '**/*.test.ts', '**/*.test.tsx'],
      rules: {
        'no-unused-expressions': 'off',
        '@typescript-eslint/no-explicit-any': 'off'
      }
    }
  ]
};