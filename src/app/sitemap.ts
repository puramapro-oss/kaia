import type { MetadataRoute } from "next";

const BASE = "https://kaia.purama.dev";

const STATIC_PATHS = [
  "/",
  "/pricing",
  "/manifesto",
  "/influencers",
  "/influencers/kit",
  "/legal/cgu",
  "/legal/privacy",
  "/legal/contests-rules",
  "/legal/disclaimer-medical",
  "/login",
  "/signup",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return STATIC_PATHS.map((path) => ({
    url: `${BASE}${path}`,
    lastModified,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1.0 : path === "/pricing" ? 0.9 : 0.6,
  }));
}
