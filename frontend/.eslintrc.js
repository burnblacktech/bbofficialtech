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
    'react-app',
    'react-app/jest'
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: [
    'react'
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

    // Import/Export rules
    'import/no-unresolved': 'off', // Handled by TypeScript
    'import/export': 'error',
    'import/order': [
      'error',
      {
        'groups': [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index'
        ],
        'newlines-between': 'always',
        'alphabetize': {
          'order': 'asc',
          'caseInsensitive': true
        }
      }
    ],
    'import/no-duplicates': 'error',
    'import/no-cycle': 'error',

    // General code quality
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'warn',
    'no-alert': 'error',
    'no-var': 'error',
    'let-const': 'error',
    'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1 }],
    'no-trailing-spaces': 'error',
    'eol-last': 'error',
    'comma-dangle': ['error', 'always-multiline'],
    'quotes': ['error', 'single', { avoidEscape: true }],

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

    // Accessibility
    'jsx-a11y/anchor-is-valid': 'warn',
    'jsx-a11y/alt-text': 'warn',
    'jsx-a11y/click-events-have-key-events': 'warn',

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