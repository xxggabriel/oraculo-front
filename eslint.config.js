import js from "@eslint/js";
import ts from "typescript-eslint";
export default ts.config(
  { ignores: ["contracts/generated/**", "dist/**", "node_modules/**"] },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ["**/*.ts", "**/*.mjs"],
    languageOptions: {
      globals: {
        fetch: "readonly",
        Response: "readonly",
        document: "readonly",
        AbortController: "readonly",
        AbortSignal: "readonly",
        console: "readonly",
        process: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        window: "readonly",
        setTimeout: "readonly",
        Event: "readonly",
      },
    },
  },
);
