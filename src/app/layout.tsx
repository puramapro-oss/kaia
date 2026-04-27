import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTimeZone, getNow } from "next-intl/server";
import Script from "next/script";
import { Toaster } from "sonner";
import { AppBackground } from "@/components/shared/AppBackground";
import { A11yProvider } from "@/components/shared/A11yProvider";
import { isLocale, isRtl, BCP47_MAP, type Locale } from "@/i18n/locales";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kaia.purama.dev"),
  title: {
    default: "KAÏA — Routine multisensorielle pour le bien-être quotidien",
    template: "%s · KAÏA",
  },
  description:
    "Respire, bouge, accueille. KAÏA construit avec toi une routine de bien-être courte, sensorielle, durable. Essai 14 jours.",
  applicationName: "KAÏA",
  authors: [{ name: "SASU PURAMA" }],
  keywords: [
    "bien-être",
    "respiration",
    "méditation",
    "routine",
    "wellness",
    "mindfulness",
    "gratitude",
    "sons binauraux",
    "sommeil",
    "anxiété",
    "stress",
  ],
  openGraph: {
    type: "website",
    siteName: "KAÏA",
    locale: "fr_FR",
    title: "KAÏA — Routine multisensorielle pour le bien-être quotidien",
    description:
      "Respire, bouge, accueille. Une routine sensorielle courte chaque jour.",
    url: "https://kaia.purama.dev",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "KAÏA" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "KAÏA",
    description: "Bien-être quotidien",
    images: ["/api/og"],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "https://kaia.purama.dev" },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://kaia.purama.dev#org",
      name: "SASU PURAMA",
      url: "https://kaia.purama.dev",
      logo: "https://kaia.purama.dev/icon.png",
      address: {
        "@type": "PostalAddress",
        streetAddress: "8 Rue de la Chapelle",
        postalCode: "25560",
        addressLocality: "Frasne",
        addressCountry: "FR",
      },
    },
    {
      "@type": "WebApplication",
      "@id": "https://kaia.purama.dev#app",
      name: "KAÏA",
      url: "https://kaia.purama.dev",
      applicationCategory: "HealthApplication",
      operatingSystem: "Web, iOS, Android",
      description:
        "Routine multisensorielle quotidienne — respiration, méditation, gratitude, sons binauraux. Essai 14 jours.",
      offers: {
        "@type": "Offer",
        price: "14.99",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
      },
      publisher: { "@id": "https://kaia.purama.dev#org" },
    },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const rawLocale = await getLocale();
  const locale = (isLocale(rawLocale) ? rawLocale : "fr") as Locale;
  const messages = await getMessages();
  const timeZone = await getTimeZone();
  const now = await getNow();
  const dir = isRtl(locale) ? "rtl" : "ltr";
  const htmlLang = BCP47_MAP[locale] ?? "fr-FR";

  return (
    <html
      lang={htmlLang}
      dir={dir}
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans text-white">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-black"
        >
          Aller au contenu principal
        </a>
        <NextIntlClientProvider
          locale={locale}
          messages={messages}
          timeZone={timeZone}
          now={now}
        >
          <A11yProvider>
            <AppBackground />
            <main id="main" className="contents">
              {children}
            </main>
          </A11yProvider>
        </NextIntlClientProvider>
        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{
            classNames: {
              toast: "glass !rounded-2xl",
            },
          }}
        />
        <Script
          id="ld-json-organization"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
      </body>
    </html>
  );
}
