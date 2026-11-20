import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const database = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  from: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({ createServiceClient: database.createServiceClient }));

import { GET, POST } from "./route";

type QueryResult = { data?: unknown; error?: { message: string } | null; count?: number | null };
let results: Record<string, QueryResult>;

function request(method = "GET", headers: Record<string, string> = { authorization: "Bearer synthetic-cron-secret" }) {
  return new NextRequest("https://kaia.purama.dev/api/cron/daily-impact-aggregate", { method, headers });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("CRON_SECRET", "synthetic-cron-secret");
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Unexpected network call"); }));
  results = {
    user_impact: { data: [{ trees_planted: 3, waste_collected_kg: "1.5", people_helped: 2, water_saved_l: 4, euros_redistributed: "2.5", total_co2_avoided_kg: 1 }, { trees_planted: 2 }], error: null },
    daily_routines: { count: 7, error: null },
    practice_sessions: { data: [{ user_id: "user-a" }, { user_id: "user-b" }, { user_id: "user-a" }], error: null },
  };
  database.upsert.mockResolvedValue({ error: null });
  database.from.mockImplementation((table: string) => {
    const query = {
      select: vi.fn(() => query),
      gt: vi.fn(() => query),
      eq: vi.fn(() => query),
      gte: vi.fn(() => query),
      then: (resolve: (result: QueryResult) => unknown) => Promise.resolve(results[table]).then(resolve),
      upsert: database.upsert,
    };
    return query;
  });
  database.createServiceClient.mockReturnValue({ from: database.from });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("daily impact aggregation", () => {
  it("writes verified totals and unique active users on success", async () => {
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, routinesCompleted: 7, activeUsers30d: 2, totals: { trees_planted: 5, waste_collected_kg: 1.5, euros_redistributed: 2.5 } });
    expect(database.upsert).toHaveBeenCalledOnce();
    expect(database.upsert).toHaveBeenCalledWith(expect.objectContaining({ id: 1, trees_planted: 5, routines_completed: 7, active_users_30d: 2 }), { onConflict: "id" });
  });

  for (const method of ["GET", "POST"]) {
    for (const host of ["localhost", "localhost.attacker.example", "127.0.0.1.attacker.example"]) {
      it(`${method} refuses spoofed Host ${host} without a configured secret before opening a service client`, async () => {
        vi.stubEnv("CRON_SECRET", "");
        const response = await (method === "POST" ? POST : GET)(request(method, { host }));
        expect(response.status).toBe(401);
        expect(database.createServiceClient).not.toHaveBeenCalled();
        expect(database.upsert).not.toHaveBeenCalled();
      });
    }
  }

  it("rejects an invalid credential before querying the database", async () => {
    const response = await GET(request("GET", { authorization: "Bearer wrong" }));
    expect(response.status).toBe(401);
    expect(database.createServiceClient).not.toHaveBeenCalled();
  });

  for (const table of ["user_impact", "daily_routines", "practice_sessions"]) {
    it(`does not overwrite global impact when ${table} reports an error`, async () => {
      results[table] = { ...results[table], error: { message: "synthetic upstream failure" } };
      const response = await GET(request());
      expect(response.status).toBe(500);
      expect(await response.json()).not.toHaveProperty("ok", true);
      expect(database.upsert).not.toHaveBeenCalled();
      expect(database.from).not.toHaveBeenCalledWith("global_impact");
    });
  }

  for (const [table, missing] of [["user_impact", { data: null }], ["daily_routines", { count: null }], ["practice_sessions", { data: null }]] as const) {
    it(`preserves previous impact when ${table} has no result`, async () => {
      results[table] = { ...missing, error: null };
      const response = await GET(request());
      expect(response.status).toBe(500);
      expect(database.upsert).not.toHaveBeenCalled();
    });
  }

  it("accepts genuinely empty input and an exact zero count", async () => {
    results.user_impact = { data: [], error: null };
    results.daily_routines = { count: 0, error: null };
    results.practice_sessions = { data: [], error: null };
    const response = await POST(request("POST"));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, routinesCompleted: 0, activeUsers30d: 0, totals: { trees_planted: 0 } });
    expect(database.upsert).toHaveBeenCalledOnce();
  });

  it("never reports success when writing the aggregate fails", async () => {
    database.upsert.mockResolvedValue({ error: { message: "synthetic write failure" } });
    const response = await GET(request());
    expect(response.status).toBe(500);
    expect(await response.json()).not.toHaveProperty("ok", true);
  });
});
