const tsParser = require('@typescript-eslint/parser');

module.exports = [
  {
    ignores: ['**/.DS_Store', 'build/**', 'plugin/build/**'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        __DEV__: 'readonly',
        console: 'readonly',
        describe: 'readonly',
        expect: 'readonly',
        it: 'readonly',
        jest: 'readonly',
        test: 'readonly',
      },
    },
    rules: {
      'constructor-super': 'error',
      'getter-return': 'error',
      'no-const-assign': 'error',
      'no-dupe-args': 'error',
      'no-dupe-class-members': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-func-assign': 'error',
      'no-import-assign': 'error',
      'no-invalid-regexp': 'error',
      'no-new-native-nonconstructor': 'error',
      'no-obj-calls': 'error',
      'no-sparse-arrays': 'error',
      'no-this-before-super': 'error',
      'no-unreachable': 'error',
      'no-unsafe-negation': 'error',
      'prefer-const': 'warn',
      'use-isnan': 'error',
      'valid-typeof': 'error',
    },
  },
];
