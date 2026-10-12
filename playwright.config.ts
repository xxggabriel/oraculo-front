import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "/tmp/oraculo-front-e2e",
  fullyParallel: false,
  use: {
    baseURL: process.env.FRONT_URL ?? "http://127.0.0.1:4200",
    browserName: "chromium",
    headless: true,
    locale: "pt-BR",
  },
  reporter: "line",
  webServer: {
    command: "npm run start -- --port 4200",
    url: "http://127.0.0.1:4200",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
