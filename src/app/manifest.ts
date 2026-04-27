import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KAÏA — Routine multisensorielle",
    short_name: "KAÏA",
    description:
      "Une routine sensorielle courte chaque jour. Construite avec toi, pour ton équilibre durable.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0f",
    theme_color: "#1a4d3a",
    orientation: "portrait-primary",
    categories: ["health", "lifestyle", "wellness"],
    lang: "fr-FR",
    dir: "ltr",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
