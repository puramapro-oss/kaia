// MapTab placeholder — la version avec MapLibre est branchée en F3.
// On garde un stub server-component qui charge le composant client dynamiquement
// pour éviter `import dynamic` en page server.

import { MapTabClient } from "./MapTabClient";

export function MapTab() {
  return <MapTabClient />;
}
