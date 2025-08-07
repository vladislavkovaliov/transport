import js from "@eslint/js";
import globals from "globals";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: [
    "dist",
    "types",
    ".idea",
    ".storybook",
    ".config",
    "node_modules/*",
    "config/*",
    "public/*",
    "scripts/*",
    "src/react-app-env.d.ts",
    "src/reportWebVitals.ts",
    "vite.config.ts",
    "stats"
  ] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      prettierConfig,
    ],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "@typescript-eslint/no-empty-object-type": "off",
      "linebreak-style": ["error", "unix"],
      semi: ["error", "always"],
      "prettier/prettier": "error",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unsafe-function-type": "warn",
    },
  },
);
