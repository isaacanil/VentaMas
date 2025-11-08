import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  {
    ignores: [
      "lib/**",
      "generated/**",
      "node_modules/**",
      "eslint.config.js",
    ],
  },
  ...compat.config({
    env: { es2021: true, node: true },
    parser: "@typescript-eslint/parser",
    parserOptions: {
      project: ["tsconfig.json"],
      sourceType: "module",
    },
    extends: [
      "eslint:recommended",
      "plugin:import/errors",
      "plugin:import/warnings",
      "plugin:import/typescript",
      "plugin:@typescript-eslint/recommended",
    ],
    plugins: [
      "@typescript-eslint",
      "import",
    ],
    rules: {
      quotes: ["error", "double"],
      "import/no-unresolved": "off",
      indent: ["error", 2],
    },
  }),
];
