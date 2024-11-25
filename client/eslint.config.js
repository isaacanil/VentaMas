import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {files: ["**/*.{js,mjs,cjs,jsx}"], ignores: ["node_modules/**", "dist/**"]},
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    rules: {
      "no-unused-vars": "error", // Marca variables no usadas como error
      "react/react-in-jsx-scope": "off", // Desactiva la regla que exige React en el scope
      "react/prop-types": "off", // Desactiva la validación de PropTypes
    },
  },
];