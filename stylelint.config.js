/**
 * Stylelint configuration for CSS, SCSS, and styled-components.
 * @type {import('stylelint').Config}
 */

const config = {
  extends: [
    'stylelint-config-standard-scss', // CSS + SCSS with sensible defaults.
    'stylelint-config-recess-order', // Logical property ordering.
  ],

  reportDescriptionlessDisables: true,
  reportInvalidScopeDisables: true,
  reportNeedlessDisables: true,

  rules: {
    'selector-class-pattern': null, // Allow existing BEM and utility naming.
    'custom-property-empty-line-before': null,
  },
  overrides: [
    {
      files: ['**/*.{js,jsx,ts,tsx}'],
      customSyntax: 'postcss-styled-syntax',
      rules: {
        'nesting-selector-no-missing-scoping-root': null,
        'no-invalid-position-at-import-rule': null,
        'no-invalid-position-declaration': null,
        'no-descending-specificity': null, // Styled-components often trips this.
        'order/properties-order': null,
        'no-empty-source': null,
        'scss/operator-no-unspaced': null,
        'scss/operator-no-newline-after': null,
      },
    },
  ],
  ignoreFiles: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.storybook/**',
    '**/.vite/**',
    '**/storybook-static/**',
    '**/coverage/**',
    'functions/lib/**',
  ],
};

export default config;
