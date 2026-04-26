"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_NATURE,
  getNatureToken,
  natureVideoUrl,
  natureVideoUrlWebm,
  type NatureSlug,
} from "@/lib/multisensorial/motion-tokens";
import {
  ZERO_OFFSET,
  deviceOrientationToOffset,
  pointerToOffset,
  prefersReducedMotion,
  type ParallaxOffset,
} from "@/lib/multisensorial/parallax";
import { useMultisensorialPrefs } from "@/hooks/useMultisensorialPrefs";

interface ParallaxNatureBackgroundProps {
  /** Nature à afficher. Default = forêt. */
  slug?: NatureSlug;
  /** Force le fallback gradient (utile en preview / settings). */
  forceStatic?: boolean;
  /** Opacité globale du calque (0..1). UI au-dessus reste lisible. */
  intensity?: number;
}

/**
 * Fond plein-écran fixe : 3 couches CSS translate3d réagissant au gyroscope
 * (mobile) ou pointeur (desktop). Si `multisensorial_background_video` =
 * false ou si la vidéo MP4 n'existe pas, on retombe sur le gradient CSS.
 *
 * Ne capture jamais d'événement (pointer-events: none) — l'UI au-dessus
 * reste totalement interactive.
 */
export function ParallaxNatureBackground({
  slug = DEFAULT_NATURE,
  forceStatic = false,
  intensity = 0.65,
}: ParallaxNatureBackgroundProps) {
  const prefs = useMultisensorialPrefs();
  const token = useMemo(() => getNatureToken(slug), [slug]);
  const [offset, setOffset] = useState<ParallaxOffset>(ZERO_OFFSET);
  const [videoOk, setVideoOk] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const layerNearRef = useRef<HTMLDivElement | null>(null);
  const layerMidRef = useRef<HTMLDivElement | null>(null);
  const layerFarRef = useRef<HTMLDivElement | null>(null);

  const wantsVideo = !forceStatic && prefs.background_video;

  // Détection reduced-motion (live + au mount).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Probe vidéo HEAD une seule fois (cache navigateur ensuite).
  useEffect(() => {
    if (!wantsVideo) {
      setVideoOk(false);
      return;
    }
    let cancelled = false;
    async function probe() {
      try {
        const res = await fetch(natureVideoUrl(slug), { method: "HEAD" });
        if (!cancelled) setVideoOk(res.ok);
      } catch {
        if (!cancelled) setVideoOk(false);
      }
    }
    probe();
    return () => {
      cancelled = true;
    };
  }, [slug, wantsVideo]);

  // Listeners parallax (gyroscope + pointer fallback).
  useEffect(() => {
    if (forceStatic || !prefs.background_video) return;
    if (reducedMotion || prefersReducedMotion()) return;

    let raf = 0;
    let pendingOffset: ParallaxOffset = ZERO_OFFSET;

    const flush = () => {
      raf = 0;
      setOffset(pendingOffset);
    };

    const schedule = (next: ParallaxOffset) => {
      pendingOffset = next;
      if (!raf) raf = requestAnimationFrame(flush);
    };

    const onOrient = (event: DeviceOrientationEvent) => {
      schedule(deviceOrientationToOffset(event.beta, event.gamma));
    };
    const onPointer = (event: PointerEvent) => {
      schedule(
        pointerToOffset(
          event.clientX,
          event.clientY,
          window.innerWidth,
          window.innerHeight
        )
      );
    };

    let usingOrient = false;
    if (typeof window !== "undefined" && "DeviceOrientationEvent" in window) {
      // Sur iOS 13+ on n'a accès qu'après user gesture (cf. parallax.ts).
      // On l'ajoute opt-in passif : si l'OS le pousse, ok ; sinon pointer prend le relais.
      window.addEventListener("deviceorientation", onOrient, { passive: true });
      usingOrient = true;
    }
    window.addEventListener("pointermove", onPointer, { passive: true });

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (usingOrient) window.removeEventListener("deviceorientation", onOrient);
      window.removeEventListener("pointermove", onPointer);
    };
  }, [forceStatic, prefs.background_video, reducedMotion]);

  const showVideo = wantsVideo && videoOk && !reducedMotion;

  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-[5] overflow-hidden pointer-events-none"
      style={{ opacity: intensity }}
    >
      {/* Couche far : gradient principal (toujours présent, c'est le fallback fiable). */}
      <div
        ref={layerFarRef}
        className="absolute inset-0 will-change-transform"
        style={{
          background: token.gradient,
          transform: `translate3d(${offset.x * -8}px, ${offset.y * -6}px, 0) scale(1.05)`,
          transition: "transform 600ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />

      {/* Couche mid : vidéo si dispo + autorisée. */}
      {showVideo ? (
        <div
          ref={layerMidRef}
          className="absolute inset-0 will-change-transform"
          style={{
            transform: `translate3d(${offset.x * -16}px, ${offset.y * -12}px, 0) scale(1.08)`,
            transition: "transform 700ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <video
            key={slug}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="h-full w-full object-cover opacity-70"
            poster=""
          >
            <source src={natureVideoUrlWebm(slug)} type="video/webm" />
            <source src={natureVideoUrl(slug)} type="video/mp4" />
          </video>
        </div>
      ) : null}

      {/* Couche near : voile d'ambiance + vignette pour assurer la lisibilité de l'UI. */}
      <div
        ref={layerNearRef}
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 100% at 50% 0%, transparent 0%, rgba(10,10,15,0.35) 60%, rgba(10,10,15,0.85) 100%)",
          transform: `translate3d(${offset.x * -4}px, ${offset.y * -3}px, 0)`,
        }}
      />

      {/* Glow d'accent — couleur du token, ultra subtile, pulse 22s. */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(40% 40% at 70% 30%, ${token.accent}26 0%, transparent 70%)`,
          mixBlendMode: "screen",
          opacity: 0.55,
        }}
      />
    </div>
  );
}
