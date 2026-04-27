"use client";

/**
 * LinkQrCode — génère un QR code SVG côté client (lib `qrcode`).
 * Permet le téléchargement PNG via canvas.
 */
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

interface Props {
  value: string;
  size?: number;
}

export function LinkQrCode({ value, size = 256 }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    QRCode.toCanvas(
      canvas,
      value,
      {
        width: size,
        margin: 1,
        color: { dark: "#FFFFFF", light: "#0A0A0F" },
        errorCorrectionLevel: "M",
      },
      (err) => {
        if (err) setError("QR indisponible.");
      }
    );
  }, [value, size]);

  function onDownload() {
    const canvas = ref.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `kaia-qr.png`;
    a.click();
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="rounded-2xl bg-[#0A0A0F] p-3 inline-block">
        <canvas
          ref={ref}
          width={size}
          height={size}
          aria-label={`QR code pour ${value}`}
          className="block"
        />
      </div>
      <button
        type="button"
        onClick={onDownload}
        className="text-xs font-medium text-white/70 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 wellness-anim"
      >
        Télécharger en PNG
      </button>
      {error ? (
        <p className="text-sm text-[var(--color-kaia-terracotta)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
