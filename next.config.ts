import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Package workspace `@purama/smarana` livré en source TS (pas de build step, cf packages/ui) —
  // Next.js n'applique SWC qu'aux packages listés ici, sinon node_modules est ignoré par défaut.
  transpilePackages: ['@purama/smarana'],
  // `@purama/smarana` vit hors de `kaia/` (lié par symlink npm `file:../packages/smarana`) —
  // sans ce flag, Next refuse de bundler un module resolu en dehors du dossier racine du projet.
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=(self), accelerometer=(self), gyroscope=(self)",
          },
          {
            // CSP volontairement permissive sur script/style (Next App Router sans nonce,
            // Tailwind inline) mais connect/frame/img restreints aux origines connues.
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://eu.i.posthog.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://auth.purama.dev wss://auth.purama.dev https://*.supabase.co https://eu.i.posthog.com https://demotiles.maplibre.org https://*.maplibre.org https://api.stripe.com",
              "frame-src 'self' https://js.stripe.com",
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
