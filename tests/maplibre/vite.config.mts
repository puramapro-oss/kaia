import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const fixture = dirname(fileURLToPath(import.meta.url));
const application = resolve(fixture, "../..");
const output = resolve(fixture, "../.maplibre-dist");

export default defineConfig({
  root: fixture,
  publicDir: false,
  resolve: { alias: [
    { find: "@/lib/supabase/client", replacement: resolve(fixture, "supabase-fixture.ts") },
    { find: "@", replacement: resolve(application, "src") },
  ] },
  // The fixture uses the published MapLibre CSS; application Tailwind is built by Next CI.
  css: { postcss: { plugins: [] } },
  build: { outDir: output, emptyOutDir: true },
  plugins: [{ name: "copy-locked-map-worker", closeBundle() {
    const relative = "vendor/maplibre-gl-6.19.0/worker.mjs";
    mkdirSync(dirname(resolve(output, relative)), { recursive: true });
    copyFileSync(resolve(application, "public", relative), resolve(output, relative));
  } }],
});
