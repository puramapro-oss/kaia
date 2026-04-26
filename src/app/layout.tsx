import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import { Toaster } from "sonner";
import { AppBackground } from "@/components/shared/AppBackground";
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
  ],
  openGraph: {
    type: "website",
    siteName: "KAÏA",
    locale: "fr_FR",
    title: "KAÏA — Routine multisensorielle pour le bien-être quotidien",
    description:
      "Respire, bouge, accueille. Une routine sensorielle courte chaque jour.",
    url: "https://kaia.purama.dev",
  },
  twitter: { card: "summary_large_image", title: "KAÏA", description: "Bien-être quotidien" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans text-white">
        <AppBackground />
        {children}
        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{
            classNames: {
              toast: "glass !rounded-2xl",
            },
          }}
        />
      </body>
    </html>
  );
}
