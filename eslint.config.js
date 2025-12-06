// ESLint 9 + Vite + React + Storybook + unused-imports + import/order
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactRefresh from 'eslint-plugin-react-refresh';
import reactCompiler from 'eslint-plugin-react-compiler';
import storybook from 'eslint-plugin-storybook';
import unusedImports from 'eslint-plugin-unused-imports';
import importPlugin from 'eslint-plugin-import';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'functions/**',
      'functions/lib/**',
      '**/.vite/**',
      'coverage/**',
      'storybook-static/**',
    ],
  },

  js.configs.recommended,
  {
    ...react.configs.flat.recommended,
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  ...storybook.configs['flat/recommended'],

  {
    files: ['src/**/*.{js,jsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node },
    },
    linterOptions: {
      // tu valor 1 => "warn"
      reportUnusedDisableDirectives: 'warn',
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        node: {
          // Permite resolver imports sin extensión explícita para los formatos que usamos.
          extensions: ['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.json'],
        },
        typescript: {
          project: './tsconfig.json',
        },
      },
    },
    plugins: {
      'unused-imports': unusedImports,
      import: importPlugin,
      react,
      react,
      'react-refresh': reactRefresh,
      'react-compiler': reactCompiler,
    },
    rules: {
      'react-compiler/react-compiler': 'error',
      // === Limpieza automática ===
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      // === import/order útil en Vite ===
      'import/no-unresolved': [
        'error',
        {
          ignore: [
            '\\.(css|svg|png|jpe?g|webp)$',
            '^@/',
            '^storybook/test$',
            '^yet-another-react-lightbox/plugins',
          ],
        },
      ],
      'import/order': [
        'warn',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/newline-after-import': ['warn', { count: 1 }],

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

      // React/Vite
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // React Refresh
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

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
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.browser, ...globals.node },
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'warn',
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.json'],
        },
        typescript: {
          project: './tsconfig.json',
        },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'unused-imports': unusedImports,
      import: importPlugin,
      react,
      react,
      'react-refresh': reactRefresh,
      'react-compiler': reactCompiler,
    },
    rules: {
      'react-compiler/react-compiler': 'error',
      ...tseslint.configs['recommended-type-checked'].rules,

      // === Limpieza automática ===
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      // Import helpers
      'import/no-unresolved': [
        'error',
        {
          ignore: [
            '\\.(css|svg|png|jpe?g|webp)$',
            '^@/',
            '^storybook/test$',
            '^yet-another-react-lightbox/plugins',
          ],
        },
      ],
      'import/order': [
        'warn',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/newline-after-import': ['warn', { count: 1 }],

      // React adjustments
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // React Refresh
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
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
    files: ['controller.js', 'tools/setCors.js'],
    languageOptions: {
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },

  // Disable stylistic ESLint rules that Prettier will handle.
  eslintConfigPrettier,
];
