"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/**
 * Rendu QR partagé (data-URL + skeleton). Couleurs KAÏA par défaut.
 * Factorise le pattern dupliqué entre DualSync et ARConsentQR.
 */
export default function QrImage({
  value,
  size = 200,
  alt = "QR code",
  className = "",
}: {
  value: string;
  size?: number;
  alt?: string;
  className?: string;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!value) return;
    let active = true;
    QRCode.toDataURL(value, { margin: 1, width: size, color: { dark: "#0D0D1A", light: "#F5F5FA" } })
      .then((url) => active && setDataUrl(url))
      .catch(() => active && setDataUrl(null));
    return () => {
      active = false;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        className={`rounded-xl bg-[var(--kaia-soft)] animate-pulse ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={dataUrl} alt={alt} className={`rounded-xl ${className}`} style={{ width: size, height: size }} />;
}
