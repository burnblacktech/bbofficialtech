module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
    commonjs: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/recommended"
  ],
  plugins: ["import"],
  rules: {
    // General rules
    "no-unused-vars": ["warn", { "argsIgnorePattern": "next" }],
    "no-console": "warn",
    "no-debugger": "error",
    "no-var": "error",
    "prefer-const": "error",
    "eqeqeq": ["error", "always"],
    "curly": ["error", "all"],
    "no-trailing-spaces": "error",
    "no-multiple-empty-lines": ["error", { "max": 1 }],
    "comma-dangle": ["error", "always-multiline"],
    "semi": ["error", "always"],
    "quotes": ["error", "single"],
    "indent": ["error", 2],

    // S7 Architecture Enforcement
    "no-restricted-syntax": [
      "error",
      {
        "selector": "AssignmentExpression[left.property.name='status'][left.object.name=/filing|Filing/]",
        "message": "❌ S7 VIOLATION: Direct state mutation forbidden. Use SubmissionStateMachine.transition() instead. (S7_LOCK.md §1)"
      }
    ],
    "no-restricted-imports": [
      "error",
      {
        "patterns": [
          {
            "group": [
              "**/models/*"
            ],
            "message": "❌ S7 VIOLATION: Controllers must not import models directly. Use services instead. Exception: Admin controllers (must be documented in S7_LOCK.md). (S7_LOCK.md §4)"
          }
        ]
      }
    ],

    // Import ordering (from .eslintrc.imports.js)
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
    'import/no-relative-packages': 'error',
    'import/no-relative-parent-imports': 'error',
    'import/newline-after-import': 'error'
  },
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
  },
  settings: {
    'import/resolver': {
      node: {
        paths: ['src']
      }
    }
  },
  ignorePatterns: [
    "node_modules/",
    "dist/",
    "build/",
    "*.min.js",
    "coverage/",
  ],
  overrides: [
    {
      "files": [
        "src/controllers/admin/**/*.js",
        "src/services/**/*.js",
        "src/domain/**/*.js",
        "src/models/**/*.js",
        "src/scripts/**/*.js",
        "src/workers/**/*.js",
        "src/gateways/**/*.js"
      ],
      "rules": {
        "no-restricted-imports": "off"
      }
    }
  ],
  globals: {
    "enterpriseLogger": "readonly",
    "process": "readonly",
    "require": "readonly",
    "module": "readonly",
    "exports": "readonly",
    "__dirname": "readonly",
    "__filename": "readonly",
    "Buffer": "readonly",
    "global": "readonly"
  },
};