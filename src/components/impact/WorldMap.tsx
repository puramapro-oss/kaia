"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { type Map as MapLibre, type GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { createClient } from "@/lib/supabase/client";

type ImpactKind = "tree" | "waste" | "help" | "water" | "donation" | "mission";

interface ImpactPoint {
  id: string;
  kind: ImpactKind;
  amount: number;
  lat: number;
  lng: number;
  country_code: string | null;
  created_at: string;
}

const KIND_COLORS: Record<ImpactKind, string> = {
  tree: "#1A4D3A",
  waste: "#06B6D4",
  help: "#F4C430",
  water: "#06B6D4",
  donation: "#D4906A",
  mission: "#F472B6",
};

const KIND_LABELS_FR: Record<ImpactKind, string> = {
  tree: "Arbre planté",
  waste: "Déchets collectés",
  help: "Personne aidée",
  water: "Eau économisée",
  donation: "Don",
  mission: "Mission",
};

const OSM_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap",
    },
  },
  glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
  layers: [
    {
      id: "osm",
      type: "raster" as const,
      source: "osm",
      paint: {
        "raster-saturation": -0.4,
        "raster-brightness-min": 0.05,
        "raster-brightness-max": 0.85,
        "raster-contrast": 0.1,
      } as Record<string, number>,
    },
  ],
};

function pointsToGeoJSON(points: ImpactPoint[]) {
  return {
    type: "FeatureCollection" as const,
    features: points.map((p) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [p.lng, p.lat] as [number, number],
      },
      properties: {
        id: p.id,
        kind: p.kind,
        amount: p.amount,
        color: KIND_COLORS[p.kind] ?? "#06B6D4",
        label: KIND_LABELS_FR[p.kind] ?? "Action",
        created_at: p.created_at,
      },
    })),
  };
}

export function WorldMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibre | null>(null);
  const [points, setPoints] = useState<ImpactPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch initial points + subscribe realtime.
  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    (async () => {
      const { data, error: dbError } = await supabase
        .from("impact_locations")
        .select("id, kind, amount, lat, lng, country_code, created_at")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (!mounted) return;
      if (dbError) {
        setError("Carte indisponible pour le moment.");
        setLoading(false);
        return;
      }
      const mapped: ImpactPoint[] = (data ?? [])
        .map((r) => {
          const lat = typeof r.lat === "number" ? r.lat : parseFloat(String(r.lat ?? ""));
          const lng = typeof r.lng === "number" ? r.lng : parseFloat(String(r.lng ?? ""));
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
          return {
            id: String(r.id),
            kind: r.kind as ImpactKind,
            amount:
              typeof r.amount === "number"
                ? r.amount
                : parseFloat(String(r.amount ?? "0")) || 0,
            lat,
            lng,
            country_code: r.country_code as string | null,
            created_at: String(r.created_at),
          } satisfies ImpactPoint;
        })
        .filter((p): p is ImpactPoint => p !== null);
      setPoints(mapped);
      setLoading(false);
    })();

    const channel = supabase
      .channel("impact_locations:public")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "kaia", table: "impact_locations" },
        (payload) => {
          if (!mounted) return;
          const r = payload.new as Record<string, unknown>;
          const lat = typeof r.lat === "number" ? r.lat : parseFloat(String(r.lat ?? ""));
          const lng = typeof r.lng === "number" ? r.lng : parseFloat(String(r.lng ?? ""));
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
          const next: ImpactPoint = {
            id: String(r.id),
            kind: r.kind as ImpactKind,
            amount:
              typeof r.amount === "number"
                ? r.amount
                : parseFloat(String(r.amount ?? "0")) || 0,
            lat,
            lng,
            country_code: (r.country_code as string | null) ?? null,
            created_at: String(r.created_at ?? new Date().toISOString()),
          };
          setPoints((prev) => [next, ...prev].slice(0, 1000));
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Init map once.
  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OSM_STYLE,
      center: [2.5, 30],
      zoom: 1.6,
      minZoom: 1,
      maxZoom: 8,
      attributionControl: { compact: true },
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      map.addSource("impact", {
        type: "geojson",
        data: pointsToGeoJSON([]),
        cluster: true,
        clusterRadius: 40,
      });

      map.addLayer({
        id: "impact-clusters",
        type: "circle",
        source: "impact",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#06B6D4",
          "circle-opacity": 0.32,
          "circle-radius": [
            "step",
            ["get", "point_count"],
            14,
            10,
            18,
            50,
            22,
            200,
            28,
          ],
          "circle-stroke-color": "#06B6D4",
          "circle-stroke-width": 1,
          "circle-stroke-opacity": 0.7,
        },
      });
      map.addLayer({
        id: "impact-cluster-count",
        type: "symbol",
        source: "impact",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 11,
        },
        paint: {
          "text-color": "#FFFEF7",
        },
      });

      map.addLayer({
        id: "impact-points",
        type: "circle",
        source: "impact",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": 6,
          "circle-blur": 0.4,
          "circle-opacity": 0.85,
          "circle-stroke-color": "#FFFEF7",
          "circle-stroke-width": 1,
          "circle-stroke-opacity": 0.6,
        },
      });

      map.on("click", "impact-points", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
        const props = (f.properties ?? {}) as { label?: string; amount?: number; created_at?: string };
        const dateStr = props.created_at
          ? new Intl.DateTimeFormat("fr-FR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }).format(new Date(props.created_at))
          : "";
        const html = `<div style="color:#FFFEF7;font-family:Inter,system-ui;padding:6px 4px">
          <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.55">${dateStr}</div>
          <div style="font-size:14px;margin-top:2px">${props.label ?? "Action"}</div>
          <div style="font-size:12px;opacity:0.7;margin-top:4px">Quantité : ${props.amount ?? "—"}</div>
        </div>`;
        new maplibregl.Popup({ closeButton: false, offset: 12 })
          .setLngLat(coords)
          .setHTML(html)
          .addTo(map);
      });

      map.on("mouseenter", "impact-points", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "impact-points", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Push points → source.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const src = map.getSource("impact") as GeoJSONSource | undefined;
      if (src) src.setData(pointsToGeoJSON(points));
    };
    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }, [points]);

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="rounded-3xl border border-white/10 overflow-hidden h-[60vh] min-h-[420px] bg-[#0A0A0F]"
        aria-label="Carte mondiale de l'impact KAÏA"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/55">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(KIND_LABELS_FR) as ImpactKind[]).map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: KIND_COLORS[k] }}
                aria-hidden
              />
              {KIND_LABELS_FR[k]}
            </span>
          ))}
        </div>
        <div className="tabular-nums">
          {loading ? "Chargement…" : `${points.length} point${points.length === 1 ? "" : "s"}`}
        </div>
      </div>
      {error && (
        <p className="text-sm text-[var(--color-kaia-terracotta)]" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && points.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-sm text-white/55">
          Aucune action enregistrée pour le moment — les premiers points apparaîtront en live ici
          dès qu'une mission sera validée.
        </div>
      )}
    </div>
  );
}
