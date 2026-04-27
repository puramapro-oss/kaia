import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/manifesto", "/influencers", "/legal/", "/i/", "/r/"],
        disallow: ["/api/", "/admin", "/dashboard", "/onboarding", "/auth/"],
      },
    ],
    sitemap: "https://kaia.purama.dev/sitemap.xml",
    host: "https://kaia.purama.dev",
  };
}
