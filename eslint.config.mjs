import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([
    ".next/**",
    "coverage/**",
    "lib/generated/**",
    "load-tests/**",
    "node_modules/**",
    "packages/sdk/dist/**",
    "public/openapi.yaml",
  ]),
  {
    // These React Compiler advisory rules require broader UI refactors. Keep the
    // production correctness and Core Web Vitals rules as blocking checks.
    rules: {
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: ["scripts/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);
