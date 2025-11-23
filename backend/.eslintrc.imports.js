module.exports = {
  extends: [
    'plugin:import/recommended',
    'plugin:import/typescript'
  ],
  settings: {
    'import/resolver': {
      node: {
        paths: ['src']
      }
    }
  },
  rules: {
    // Enforce consistent import order
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
    // Prefer absolute imports over relative imports
    'import/no-relative-packages': 'error',
    'import/no-relative-parent-imports': 'error',
    // Enforce newlines after import statements
    'import/newline-after-import': 'error'
  }
};