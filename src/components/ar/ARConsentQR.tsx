"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import {
  buildConsentPayload,
  encodeConsent,
  CONSENT_TTL_SEC,
  type ARStyle,
} from "@/lib/ar/consent";
import QrImage from "@/components/ui/QrImage";

/**
 * Consentement AR OBLIGATOIRE. Affiche un QR encodant un consentement frais et
 * exige une confirmation explicite avant toute session. Sans `onConsent`,
 * aucune session ne peut démarrer.
 */
export default function ARConsentQR({
  userId,
  style,
  protocolSlug,
  onConsent,
}: {
  userId: string;
  style: ARStyle;
  protocolSlug: string;
  onConsent: (token: string) => void;
}) {
  const [token, setToken] = useState("");

  useEffect(() => {
    const payload = buildConsentPayload({ userId, style, protocolSlug, issuedAt: Date.now() });
    setToken(encodeConsent(payload));
  }, [userId, style, protocolSlug]);

  return (
    <div className="glass rounded-2xl p-6 flex flex-col items-center text-center">
      <ShieldCheck className="w-6 h-6 text-[var(--kaia-moon)] mb-2" />
      <h3 className="font-medium mb-1">Consentement requis</h3>
      <p className="text-xs text-[var(--foreground-muted)] mb-4 max-w-sm leading-relaxed">
        Le Miroir Énergétique utilise ta caméra pour une expérience de présence,
        en réalité augmentée. Aucune image n&apos;est enregistrée ni transmise.
        Ce n&apos;est ni un soin ni un diagnostic. Tu peux arrêter à tout moment.
      </p>
      <QrImage value={token} size={160} alt="QR de consentement AR" className="mb-4" />
      <button
        onClick={() => token && onConsent(token)}
        disabled={!token}
        className="px-6 py-3 rounded-full bg-gradient-to-r from-[var(--kaia-moon)] to-[var(--kaia-gold)] text-sm font-medium disabled:opacity-50"
      >
        Je comprends et je consens
      </button>
      <p className="text-[10px] text-[var(--foreground-muted)] mt-2">
        Consentement valable {Math.round(CONSENT_TTL_SEC / 60)} min.
      </p>
    </div>
  );
}
