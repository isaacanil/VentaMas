import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';

const FUNCTION_FILES = ['src/**/*.{js,jsx,ts,tsx}'];
const SCRIPT_FILES = ['debug-exports.js', 'scripts/**/*.js', 'tools/**/*.js'];

function applyFiles(configs, files) {
  return (Array.isArray(configs) ? configs : [configs]).map((config) => ({
    ...config,
    files,
  }));
}

export default [
  {
    ignores: [
      'lib/**',
      'generated/**',
      'node_modules/**',
      '.tmp/**',
      'tmp/**',
      'coverage/**',
      'eslint.config.js',
    ],
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
  {
    ...js.configs.recommended,
    files: FUNCTION_FILES,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsParser,
      globals: globals.node,
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs'],
          moduleDirectory: ['node_modules', '../node_modules'],
        },
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
  },
  ...applyFiles(importPlugin.flatConfigs.recommended, FUNCTION_FILES),
  ...applyFiles(importPlugin.flatConfigs.typescript, FUNCTION_FILES),
  ...applyFiles(tsPlugin.configs['flat/recommended'], FUNCTION_FILES),
  {
    files: FUNCTION_FILES,
    rules: {
      quotes: ['error', 'single', { avoidEscape: true }],
      'import/no-unresolved': 'error',
      indent: 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    ...js.configs.recommended,
    files: SCRIPT_FILES,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      quotes: ['error', 'single', { avoidEscape: true }],
      indent: 'off',
    },
  },
];
