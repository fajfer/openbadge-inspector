// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/", "web-ext-artifacts/", "coverage/", "node_modules/"] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.browser, ...globals.webextensions },
    },
    linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: "error" },
    rules: {
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-restricted-properties": [
        "error",
        { property: "innerHTML", message: "Use textContent (ADR-010)." },
        { property: "outerHTML", message: "Use textContent (ADR-010)." },
        { property: "insertAdjacentHTML", message: "Use createElement (ADR-010)." },
      ],
      "no-restricted-globals": ["error", { name: "chrome", message: "Use browser.* (AGENTS.md)." }],
    },
  },
  {
    files: ["scripts/**", "*.config.ts", "eslint.config.mjs"],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ["eslint.config.mjs"],
    ...tseslint.configs.disableTypeChecked,
  },
);
