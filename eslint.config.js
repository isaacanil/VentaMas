// ESLint 9 + Vite + React + optional Storybook + import/no-unresolved
import js from '@eslint/js';
import reactRefresh from 'eslint-plugin-react-refresh';
import reactHooks from 'eslint-plugin-react-hooks';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

const ENABLE_TYPED_LINT = process.env.ESLINT_TYPED === 'true';
const ENABLE_STORYBOOK_LINT = process.env.ESLINT_STORYBOOK === 'true';
const storybookConfigs = ENABLE_STORYBOOK_LINT
  ? (await import('eslint-plugin-storybook')).default.configs['flat/recommended']
  : [];

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'functions/**',
      'functions/lib/**',
      '.codex-artifacts/**',
      '.tmp/**',
      'tmp/**',
      'artifacts/**',
      'reports/**',
      '**/*.d.ts',
      '**/.vite/**',
      'coverage/**',
      'storybook-static/**',
    ],
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },

  js.configs.recommended,
  ...storybookConfigs,

  {
    files: ['src/**/*.{js,jsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node },
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    plugins: {
      'react-refresh': reactRefresh,
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-hooks/set-state-in-effect': 'error',

      // === Limpieza automática ===
      'no-unused-vars': 'off',
      // === Reglas de tu JSON portadas (puedes pegar todas aquí) ===
      'constructor-super': 2,
      'for-direction': 2,
      'getter-return': [2, { allowImplicit: false }],
      'no-async-promise-executor': 2,
      'no-case-declarations': 2,
      'no-class-assign': 2,
      'no-compare-neg-zero': 2,
      'no-cond-assign': [2, 'except-parens'],
      'no-const-assign': 2,
      'no-constant-binary-expression': 2,
      // ⚠ Ajuste recomendado:
      'no-constant-condition': [2, { checkLoops: true }],

      // React Refresh
      'react-refresh/only-export-components': [
        'error',
        { allowConstantExport: true },
      ],
      'prefer-const': 'error',

      // Pega aquí el resto de tus reglas del JSON…
      // "no-dupe-args": 2, etc.
    },
  },

  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ...(ENABLE_TYPED_LINT
          ? {
              projectService: true,
              tsconfigRootDir: import.meta.dirname,
            }
          : {
              projectService: false,
              tsconfigRootDir: import.meta.dirname,
            }),
      },
      globals: { ...globals.browser, ...globals.node },
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    plugins: {
      'react-refresh': reactRefresh,
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-hooks/set-state-in-effect': 'error',

      // === Limpieza automática ===
      'no-unused-vars': 'off',
      // React Refresh
      'react-refresh/only-export-components': [
        'error',
        { allowConstantExport: true },
      ],
      'prefer-const': 'error',
      'no-undef': 'off',
      'no-redeclare': 'off',
    },
  },

  // Archivos de config (Node)
  {
    files: [
      'vite.config.{js,ts,mjs,mts,cjs,cts}',
      'vitest.config.{js,ts,mjs,mts,cjs,cts}',
      '*.config.{js,ts,mjs,mts,cjs,cts}',
      '.storybook/**/*.{js,ts,mjs,mts,cjs,cts}',
    ],
    languageOptions: {
      globals: { ...globals.node },
      sourceType: 'module',
      parser: tsParser,
      parserOptions: {
        projectService: false,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: { 'import/no-unresolved': 'off' },
  },

  // Scripts Node locales
  {
    files: [
      'controller.js',
      'scripts/**/*.{js,mjs,cjs}',
      'tools/**/*.{js,mjs,cjs}',
    ],
    languageOptions: {
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },

];
