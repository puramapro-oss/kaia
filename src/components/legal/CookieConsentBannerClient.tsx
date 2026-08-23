"use client";

import CookieConsentBanner from "@/lib/legal/components/CookieConsentBanner";
import type { CookieConsent } from "@/lib/legal/hooks/useCookieConsent";

/**
 * Synchronise le choix en base (si connecté) en plus du localStorage géré par
 * `useCookieConsent` — preuve de consentement indépendante du navigateur.
 */
export default function CookieConsentBannerClient() {
  function handleConsent(consent: CookieConsent) {
    fetch("/api/legal/cookie-consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mesure: consent.mesure, marketing: consent.marketing }),
    }).catch(() => {});
  }

  return (
    <CookieConsentBanner
      appName="KAÏA"
      politiqueHref="/politique-confidentialite"
      onConsent={handleConsent}
    />
  );
}
