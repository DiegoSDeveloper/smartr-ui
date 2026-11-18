// ESLint flat config (ESLint 9). `npm run lint` lints `src/`.
import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default [
  { ignores: ["dist/**", "node_modules/**", "core/**", "config/**", "presets/**", "*.tgz"] },
  js.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react-hooks": reactHooks,
    },
    rules: {
      ...tsPlugin.configs["eslint-recommended"].overrides[0].rules,
      ...tsPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // The public API (config values, option objects, events of custom
      // controls) is intentionally loosely typed (`any`): narrowing it would be
      // a breaking type change for existing apps.
      "@typescript-eslint/no-explicit-any": "off",
      // Unused parameters document callback signatures (`(value, index) =>`).
      "@typescript-eslint/no-unused-vars": [
        "error",
        { args: "none", ignoreRestSiblings: true, caughtErrors: "none" },
      ],
      // Effects / callbacks of the 1.1.0 components keep their original
      // dependency lists on purpose: "fixing" them changes when effects run
      // (re-registration in Container, async select reloads), i.e. behavior.
      // New code uses `useLatestCallback` instead of dependency lists.
      "react-hooks/exhaustive-deps": "off",
    },
  },
];
