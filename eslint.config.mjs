import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Annes Ursprungsdateien: Skripte und das Original-Artefakt aus der
    // Artefakt-Zeit. Sie sind Archiv, nicht Teil der Anwendung, und sollen
    // unverändert bleiben.
    "daten/**",
  ]),
]);

export default eslintConfig;
