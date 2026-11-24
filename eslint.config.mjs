import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // The reading sections are prose written straight into JSX: apostrophes and
  // quotes there are meant ("isn't"), not typos for a closing tag or brace.
  { files: ["src/components/sections/**"], rules: { "react/no-unescaped-entities": "off" } },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Original single-file logic, ported unchanged. Its functions are called
    // from inline handlers, so "unused" warnings there are false positives.
    "public/legacy/**",
    // Snippets the extractor inserts into that same script (same reason).
    "scripts/legacy-units.js",
    "scripts/legacy-labels.js",
  ]),
]);

export default eslintConfig;
