// ESLint 9 + Vite + React + Storybook + unused-imports + import/order
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactRefresh from 'eslint-plugin-react-refresh';
import reactHooks from 'eslint-plugin-react-hooks';
import storybook from 'eslint-plugin-storybook';
import unusedImports from 'eslint-plugin-unused-imports';
import importPlugin from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier';

const ENABLE_TYPED_LINT = process.env.ESLINT_TYPED === 'true';

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'functions/**',
      'functions/lib/**',
      '**/*.d.ts',
      'src/hooks/accountsReceivable/useCheckAccountReceivable.tsx',
      'src/router/routes/paths/AccountReceivable.tsx',
      '**/.vite/**',
      'coverage/**',
      'storybook-static/**',
    ],
  },

  js.configs.recommended,
  react.configs.flat.recommended,
  {
    settings: {
      react: { version: 'detect' },
    },
  },
  ...storybook.configs['flat/recommended'],
  ...tseslint.configs.stylistic,

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
      reportUnusedDisableDirectives: 'off',
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
      'react-refresh': reactRefresh,
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-hooks/set-state-in-effect': 'warn',

      // === Limpieza automática ===
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'off',
      'unused-imports/no-unused-vars': 'off',

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
      'import/order': 'off',
      'import/newline-after-import': 'off',

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
      'prefer-const': 'off',

      // Pega aquí el resto de tus reglas del JSON…
      // "no-dupe-args": 2, etc.
    },
  },

  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tseslint.parser,
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
      reportUnusedDisableDirectives: 'off',
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
      '@typescript-eslint': tseslint.plugin,
      'unused-imports': unusedImports,
      import: importPlugin,
      react,
      'react-refresh': reactRefresh,
      'react-hooks': reactHooks,
    },
    rules: {
      ...(ENABLE_TYPED_LINT
        ? tseslint.configs.recommendedTypeChecked.rules
        : tseslint.configs.recommended.rules),
      ...reactHooks.configs.recommended.rules,
      'react-hooks/set-state-in-effect': 'warn',

      // === Limpieza automática ===
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'off',
      'unused-imports/no-unused-vars': 'off',

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
      'import/order': 'off',
      'import/newline-after-import': 'off',

      // React adjustments
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // React Refresh
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'prefer-const': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/no-empty-function': 'off',
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
      parser: tseslint.parser,
      parserOptions: {
        projectService: false,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: { 'import/no-unresolved': 'off' },
  },

  // Scripts Node locales
  {
    files: ['controller.js', 'tools/**/*.{js,cjs}'],
    languageOptions: {
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },

  // Disable stylistic ESLint rules that Prettier will handle.
  eslintConfigPrettier,
];
