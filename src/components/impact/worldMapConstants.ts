type ImpactKind = "tree" | "waste" | "help" | "water" | "donation" | "mission";

export const KIND_COLORS: Record<ImpactKind, string> = {
  tree: "#1A4D3A",
  waste: "#06B6D4",
  help: "#F4C430",
  water: "#06B6D4",
  donation: "#D4906A",
  mission: "#F472B6",
};

export const KIND_LABELS_FR: Record<ImpactKind, string> = {
  tree: "Arbre planté",
  waste: "Déchets collectés",
  help: "Personne aidée",
  water: "Eau économisée",
  donation: "Don",
  mission: "Mission",
};

export const OSM_STYLE = {
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

interface ImpactPoint {
  id: string;
  kind: ImpactKind;
  amount: number;
  lat: number;
  lng: number;
  country_code: string | null;
  created_at: string;
}

export function pointsToGeoJSON(points: ImpactPoint[]) {
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

export type { ImpactKind, ImpactPoint };
