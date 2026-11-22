type Listener = (payload: { new: Record<string, unknown> }) => void;
let listener: Listener | undefined;
let sequence = 1;
const point = (id: number) => ({ id: `point-${id}`, kind: "tree", amount: 2, lat: id === 1 ? 48.85 : -33.86, lng: id === 1 ? 2.35 : 151.2, country_code: null, created_at: "2026-01-01T00:00:00Z" });

/** Only the provider boundary is replaced; the React components and MapLibre are real. */
export function createClient() {
  return {
    from: () => ({ select: () => ({ order: () => ({ limit: async () => ({ data: [point(1)], error: null }) }) }) }),
    channel: () => ({ on: (_event: string, _filter: unknown, callback: Listener) => {
      listener = callback;
      return { subscribe: () => ({ id: "local-fixture" }) };
    } }),
    removeChannel: () => { listener = undefined; },
  };
}

export function emitPoint() { listener?.({ new: point(++sequence) }); }
