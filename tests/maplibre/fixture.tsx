import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { WorldMap } from "../../src/components/impact/WorldMap";
import TerraNovaMap from "../../src/components/terra-nova/TerraNovaMap";
import { emitPoint } from "./supabase-fixture";
import "./fixture.css";

function Fixture() {
  const [mounted, setMounted] = useState(true);
  const [lat, setLat] = useState(48.85);
  return <main>
    <button onClick={emitPoint}>Ajouter un point</button>
    <button onClick={() => setLat(-33.86)}>Déplacer le nœud</button>
    <button onClick={() => setMounted(false)}>Démonter les cartes</button>
    {mounted && <>
      <section data-testid="world"><WorldMap /></section>
      <section data-testid="terra"><TerraNovaMap nodes={[{ id: "local-node", lat, lng: 2.35, meeting_type: null }]} /></section>
    </>}
  </main>;
}

createRoot(document.getElementById("root")!).render(<StrictMode><Fixture /></StrictMode>);
