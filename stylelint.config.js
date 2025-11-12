/**
 * Stylelint configuration for CSS, SCSS, and styled-components.
 * @type {import('stylelint').Config}
 */
const config = {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-order'],
  rules: {
    'order/properties-alphabetical-order': true,
    'selector-class-pattern': null, // Allow existing BEM and utility naming.
    'custom-property-empty-line-before': null,
    'no-descending-specificity': null,
    'no-invalid-position-at-import-rule': null,
    'no-invalid-position-declaration': null,
  },
  overrides: [
    {
      files: ['**/*.{js,jsx,ts,tsx}'],
      customSyntax: '@stylelint/postcss-css-in-js',
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
