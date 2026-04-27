"use client";

/**
 * CopyTextButton — bouton qui copie un texte dans le presse-papier (clipboard API)
 * avec feedback visuel 1.5 s. Fallback gracieux si clipboard indisponible.
 */
import { useState, type ReactNode } from "react";

interface Props {
  text: string;
  children: ReactNode;
  className?: string;
}

export function CopyTextButton({ text, children, className }: Props) {
  const [copied, setCopied] = useState(false);

  async function onClick() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback : sélectionne le texte dans un textarea temporaire
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "absolute";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        // ignore
      }
      document.body.removeChild(ta);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Copier le texte"
      className={
        className ??
        "inline-flex items-center gap-1.5 text-xs font-medium text-white/70 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 wellness-anim"
      }
    >
      {copied ? <span className="text-[var(--color-kaia-accent)]">Copié ✓</span> : children}
    </button>
  );
}
