import { defineConfig } from "@playwright/test";
import path from "node:path";

export default defineConfig({
  testDir: ".",
  testMatch: "compatibility.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  timeout: 30_000,
  reporter: [["list"]],
  outputDir: "../.maplibre-results",
  use: {
    baseURL: "http://127.0.0.1:4185",
    browserName: "chromium",
    viewport: { width: 1000, height: 1000 },
    launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] },
  },
  webServer: {
    cwd: path.resolve(__dirname, "../.."),
    command: "node node_modules/vite/bin/vite.js preview --config tests/maplibre/vite.config.mts --host 127.0.0.1 --port 4185 --strictPort",
    url: "http://127.0.0.1:4185",
    reuseExistingServer: false,
    timeout: 20_000,
  },
});
