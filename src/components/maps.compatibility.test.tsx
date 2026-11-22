// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("maplibre-gl/dist/maplibre-gl.css", () => ({}));

const state = vi.hoisted(() => ({
  failWebGL: false,
  maps: [] as Array<{ fireLoad: () => void; addSource: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> }>,
  markers: [] as Array<{ setLngLat: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> }>,
  removeChannel: vi.fn(),
}));

vi.mock("@/lib/maplibre", () => {
  class Map {
    callbacks: Array<() => void> = [];
    source = { setData: vi.fn() };
    addSource = vi.fn();
    addLayer = vi.fn();
    addControl = vi.fn();
    remove = vi.fn();
    constructor() {
      if (state.failWebGL) throw new Error("WebGL2 unavailable");
      state.maps.push(this);
    }
    on(event: string, callback: unknown) {
      if (event === "load" && typeof callback === "function") this.callbacks.push(callback as () => void);
    }
    once(event: string, callback: unknown) { this.on(event, callback); }
    fireLoad = () => this.callbacks.splice(0).forEach((callback) => callback());
    getSource() { return this.source; }
    isStyleLoaded() { return false; }
  }
  class Marker {
    setLngLat = vi.fn(() => this);
    remove = vi.fn();
    addTo() { return this; }
    constructor() { state.markers.push(this); }
  }
  return { default: { Map, Marker, NavigationControl: class {} } };
});

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({ select: () => ({ order: () => ({ limit: async () => ({
      data: [{ id: "point-1", kind: "tree", amount: 2, lat: 48.85, lng: 2.35, country_code: "FR", created_at: "2026-01-01T00:00:00Z" }], error: null,
    }) }) }) }),
    channel: () => ({ on: () => ({ subscribe: () => ({ id: "fixture-channel" }) }) }),
    removeChannel: state.removeChannel,
  }),
}));

import { WorldMap } from "./impact/WorldMap";
import TerraNovaMap from "./terra-nova/TerraNovaMap";

let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  state.failWebGL = false;
  state.maps.length = 0;
  state.markers.length = 0;
  state.removeChannel.mockClear();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});

describe("the actual map components with the MapLibre 6 boundary", () => {
  it("keeps data received before the WorldMap load callback and cleans up", async () => {
    await act(async () => root.render(<WorldMap />));
    expect(host.textContent).toContain("1 point");
    expect(state.maps).toHaveLength(1);
    await act(async () => state.maps[0].fireLoad());
    expect(state.maps[0].addSource).toHaveBeenCalledWith("impact", expect.objectContaining({ data: expect.objectContaining({ features: [expect.objectContaining({ geometry: { type: "Point", coordinates: [2.35, 48.85] } })] }) }));
    await act(async () => root.render(null));
    expect(state.maps[0].remove).toHaveBeenCalledTimes(1);
    expect(state.removeChannel).toHaveBeenCalledTimes(1);
  });

  it("updates TerraNova markers without reconstructing the map and rejects invalid coordinates", async () => {
    const valid = { id: "valid", lat: 48.85, lng: 2.35, meeting_type: null };
    await act(async () => root.render(<TerraNovaMap nodes={[valid, { ...valid, id: "out-of-range", lat: 91 }, { ...valid, id: "nan", lng: Number.NaN }]} />));
    await act(async () => state.maps[0].fireLoad());
    expect(state.markers).toHaveLength(1);
    expect(state.markers[0].setLngLat).toHaveBeenCalledWith([2.35, 48.85]);
    await act(async () => root.render(<TerraNovaMap nodes={[]} />));
    expect(state.maps).toHaveLength(1);
    expect(state.markers[0].remove).toHaveBeenCalledTimes(1);
  });

  it.each(["world", "terra"])("shows an accessible fallback when WebGL2 is unavailable: %s", async (kind) => {
    state.failWebGL = true;
    await act(async () => root.render(kind === "world" ? <WorldMap /> : <TerraNovaMap nodes={[]} />));
    expect(host.querySelector('[role="alert"]')?.textContent).toContain("La carte ne peut pas s’afficher sur cet appareil.");
    expect(state.maps).toHaveLength(0);
  });
});
