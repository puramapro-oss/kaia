"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ARConsentQR from "@/components/ar/ARConsentQR";
import ARSession from "@/components/ar/ARSession";
import { getARProtocol, type ARTargetType } from "@/lib/ar/protocols";
import { detectARCapability, type ARCapability } from "@/lib/ar/capability";
import type { ARStyle } from "@/lib/ar/consent";

/**
 * Flux AR : consentement OBLIGATOIRE → session. Aucune session ne démarre sans
 * token de consentement frais.
 */
export default function ARFlowClient({
  userId,
  style,
  protocolSlug,
  targetType,
  enabled,
}: {
  userId: string;
  style: ARStyle;
  protocolSlug: string;
  targetType: ARTargetType;
  enabled: boolean;
}) {
  const router = useRouter();
  const [consentToken, setConsentToken] = useState<string | null>(null);
  const [capability] = useState<ARCapability | null>(() =>
    detectARCapability({
      hasXR: typeof navigator !== "undefined" && "xr" in navigator,
      hasCamera:
        typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    })
  );
  const protocol = getARProtocol(protocolSlug);

  if (!enabled) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <p className="text-sm text-[var(--kaia-gold)]">Le Miroir Énergétique arrive bientôt ✨</p>
      </div>
    );
  }

  // Tant que la capacité n'est pas résolue, on n'affiche pas le consentement
  // (évite un flash du QR sur un appareil non compatible).
  if (!capability) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <div className="h-3 w-2/3 mx-auto rounded-full bg-white/5 animate-pulse" />
      </div>
    );
  }

  // Fallback gracieux : appareil non compatible (desktop / pas de caméra).
  if (!capability.supported) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <p className="text-sm text-[var(--foreground-muted)]">{capability.reason}</p>
      </div>
    );
  }

  if (!protocol || !protocol.targetTypes.includes(targetType)) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <p className="text-sm text-[var(--foreground-muted)]">Protocole indisponible pour cette cible.</p>
      </div>
    );
  }

  if (!consentToken) {
    return (
      <ARConsentQR
        userId={userId}
        style={style}
        protocolSlug={protocolSlug}
        onConsent={setConsentToken}
      />
    );
  }

  return (
    <ARSession
      style={style}
      protocolSlug={protocolSlug}
      targetType={targetType}
      consentToken={consentToken}
      onClose={() => router.push("/ar")}
    />
  );
}
