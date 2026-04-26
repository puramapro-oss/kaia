"use client";

import dynamic from "next/dynamic";

const WorldMap = dynamic(() => import("@/components/impact/WorldMap").then((m) => m.WorldMap), {
  ssr: false,
  loading: () => (
    <div className="rounded-3xl border border-white/10 bg-white/[0.025] h-[60vh] grid place-items-center">
      <p className="text-white/55 text-sm">Chargement de la carte…</p>
    </div>
  ),
});

export function MapTabClient() {
  return (
    <div className="space-y-3">
      <p className="text-white/65 max-w-2xl leading-relaxed">
        Chaque point lumineux est une action concrète — un arbre planté, des déchets ramassés,
        une personne aidée — réalisée par un membre de la communauté.
      </p>
      <WorldMap />
    </div>
  );
}
