"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MlMap, Marker as MlMarker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export interface TerraNode {
  id: string;
  lat: number;
  lng: number;
  meeting_type: string | null;
}

/**
 * Carte mondiale des nœuds TERRA NOVA (rencontres IRL). MapLibre + tiles OSM.
 * Chargé en client-only (`ssr:false`) par la page — `maplibre-gl` touche
 * `window`, donc import dynamique. La carte est initialisée UNE fois ; seuls
 * les marqueurs sont diffés quand `nodes` change (pas de rebuild/refetch style).
 */
export default function TerraNovaMap({ nodes }: { nodes: TerraNode[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markersRef = useRef<MlMarker[]>([]);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  // Init une seule fois.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let cancelled = false;

    (async () => {
      const maplibregl = (await import("@/lib/maplibre")).default;
      if (cancelled || !el) return;
      const m = new maplibregl.Map({
        container: el,
        style: "https://demotiles.maplibre.org/style.json",
        center: [2.35, 48.85],
        zoom: 1.5,
        attributionControl: { compact: true },
      });
      mapRef.current = m;
      m.on("load", () => !cancelled && setReady(true));
    })().catch(() => {
      if (!cancelled) setUnavailable(true);
    });

    return () => {
      cancelled = true;
      markersRef.current.forEach((mk) => mk.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Diff des marqueurs quand nodes change (carte déjà prête).
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    let cancelled = false;

    (async () => {
      const maplibregl = (await import("@/lib/maplibre")).default;
      if (cancelled || !mapRef.current) return;
      markersRef.current.forEach((mk) => mk.remove());
      markersRef.current = nodes
        .filter((n) => Number.isFinite(n.lat) && Number.isFinite(n.lng) && Math.abs(n.lat) <= 90 && Math.abs(n.lng) <= 180)
        .map((n) => {
          const el = document.createElement("div");
          el.style.cssText =
            "width:14px;height:14px;border-radius:9999px;background:#C8B9F0;box-shadow:0 0 12px #E8C87A;border:2px solid #F5F5FA";
          return new maplibregl.Marker({ element: el }).setLngLat([n.lng, n.lat]).addTo(map);
        });
    })().catch(() => {
      if (!cancelled) setUnavailable(true);
    });

    return () => {
      cancelled = true;
    };
  }, [nodes, ready]);

  return (
    <div>
      <div ref={containerRef} className="w-full h-72 rounded-2xl overflow-hidden glass" />
      {unavailable && <p role="alert" className="mt-2 text-sm text-white/60">La carte ne peut pas s’afficher sur cet appareil.</p>}
    </div>
  );
}
