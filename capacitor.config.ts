import type { CapacitorConfig } from "@capacitor/cli";

/**
 * KAÏA — Capacitor 7 config (P10)
 *
 * Stratégie : web wrapping. L'app web Next.js sert de binaire iOS/Android
 * via WebView avec haptics natifs, push OneSignal, IAP RevenueCat, Apple
 * Pay via Stripe Payment Sheet. Bundle id: dev.purama.kaia.
 *
 * IMPORTANT — App Store Apple §3.1.1 : les écrans iOS NE DOIVENT PAS
 * mentionner de paiement externe. Bouton neutre "Continuer" qui ouvre
 * Universal Link → /subscribe (web). RevenueCat gère l'entitlement
 * `kaia_active` côté client + webhook serveur pour sync Supabase.
 */

const config: CapacitorConfig = {
  appId: "dev.purama.kaia",
  appName: "KAÏA",
  webDir: ".next/standalone",
  server: {
    url: "https://kaia.purama.dev",
    androidScheme: "https",
    iosScheme: "https",
    cleartext: false,
    allowNavigation: ["kaia.purama.dev", "auth.purama.dev", "*.stripe.com", "*.onesignal.com"],
  },
  ios: {
    contentInset: "automatic",
    backgroundColor: "#0A0A0F",
    preferredContentMode: "mobile",
    scheme: "KAÏA",
    limitsNavigationsToAppBoundDomains: false,
  },
  android: {
    backgroundColor: "#0A0A0F",
    captureInput: true,
    webContentsDebuggingEnabled: false,
    allowMixedContent: false,
    overrideUserAgent: undefined,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0A0A0F",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#0A0A0F",
      overlaysWebView: true,
    },
    Haptics: {},
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    Preferences: {
      group: "dev.purama.kaia.prefs",
    },
  },
};

export default config;
