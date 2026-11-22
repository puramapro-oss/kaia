"use client";

import * as maplibre from "maplibre-gl";

// MapLibre 6 uses an external ESM worker. The build copies the exact locked
// worker to this same-origin versioned path; no CDN or third-party script runs.
maplibre.setWorkerUrl("/vendor/maplibre-gl-6.19.0/worker.mjs");

export default maplibre;
