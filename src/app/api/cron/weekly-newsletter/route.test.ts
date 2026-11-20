import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const boundaries = vi.hoisted(() => ({ createServiceClient: vi.fn(), from: vi.fn(), createResend: vi.fn(), send: vi.fn(), insert: vi.fn(), update: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createServiceClient: boundaries.createServiceClient }));
vi.mock("resend", () => ({ Resend: class {
  emails = { send: boundaries.send };
  constructor(key: string) { boundaries.createResend(key); }
} }));

import { GET } from "./route";

type Result = { data?: unknown; count?: number | null; error?: { message: string } | null };
let results: Record<string, Result>;
let enforceSchema: boolean;
let schemaErrors: string[];

const migration = readFileSync(path.resolve(process.cwd(), "supabase/migrations/0001_init_kaia.sql"), "utf8");
const tableDefinition = migration.match(/create table if not exists kaia\.global_impact \(([\s\S]*?)\n\);/)?.[1];
if (!tableDefinition) throw new Error("Canonical global_impact table definition missing");
const impactColumns = new Set(tableDefinition.split("\n").map((line) => line.trim().split(/\s+/)[0]).filter((column) => column && column !== "constraint"));

function request(headers = { authorization: "Bearer synthetic-cron-secret" }) {
  return new NextRequest("https://kaia.purama.dev/api/cron/weekly-newsletter", { headers });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("CRON_SECRET", "synthetic-cron-secret");
  vi.stubEnv("RESEND_API_KEY", "synthetic-resend-key");
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Unexpected network call"); }));
  enforceSchema = false;
  schemaErrors = [];
  results = {
    global_impact: { data: { active_users_30d: 33, trees_planted: 17 }, error: null },
    practice_sessions: { count: 9, error: null },
    newsletter_sends: { data: [], error: null },
    newsletter_subscriptions: { data: [{ email: "first@example.invalid", locale: "fr", unsubscribe_token: "test-unsub-1", user_id: "user-1" }, { email: "second@example.invalid", locale: "fr", unsubscribe_token: "test-unsub-2", user_id: "user-2" }], error: null },
    profiles: { data: [{ id: "user-1", full_name: "Camille" }, { id: "user-2", full_name: "Alex" }], error: null },
  };
  boundaries.send.mockResolvedValue({ data: { id: "synthetic-message-id" }, error: null });
  boundaries.from.mockImplementation((table: string) => {
    let mutation = false;
    let selectedId: string | undefined;
    let schemaError: string | undefined;
    const response = () => {
      if (mutation) return { error: null };
      if (schemaError) return { data: null, error: { message: schemaError } };
      return results[table];
    };
    const query = {
      select: vi.fn((columns: string) => {
        if (enforceSchema && table === "global_impact") {
          const missing = columns.split(",").map((column) => column.trim()).filter((column) => !impactColumns.has(column));
          if (missing.length) { schemaError = `Unknown canonical columns: ${missing.join(",")}`; schemaErrors.push(schemaError); }
        }
        return query;
      }),
      order: vi.fn(() => query),
      limit: vi.fn(() => query),
      eq: vi.fn((column: string, value: string) => { if (table === "profiles" && column === "id") selectedId = value; return query; }),
      gte: vi.fn(() => query),
      in: vi.fn(() => query),
      maybeSingle: vi.fn(() => {
        const value = response();
        if (table === "profiles" && Array.isArray(value.data)) return Promise.resolve({ ...value, data: value.data.find((row) => row.id === selectedId) ?? null });
        return Promise.resolve(value);
      }),
      insert: vi.fn((value: unknown) => { boundaries.insert(table, value); mutation = true; return query; }),
      update: vi.fn((value: unknown) => { boundaries.update(table, value); mutation = true; return query; }),
      then: (resolve: (result: Result) => unknown) => Promise.resolve(response()).then(resolve),
    };
    return query;
  });
  boundaries.createServiceClient.mockReturnValue({ from: boundaries.from });
});

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("weekly newsletter source integrity", () => {
  it("preserves verified statistics and personalized names in the real template", async () => {
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, sent: 2 });
    expect(boundaries.send).toHaveBeenCalledTimes(2);
    const email = boundaries.send.mock.calls[0][0];
    expect(email.to).toEqual(["first@example.invalid"]);
    expect(email.html).toContain("Bonjour Camille");
    expect(email.html).toContain(">33</strong> personnes actives");
    expect(email.html).toContain(">9</strong> pratiques terminées");
    expect(email.html).toContain(">17</strong> arbres plantés");
  });

  it("selects only columns present in the repository SQL schema", async () => {
    enforceSchema = true;
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(schemaErrors).toEqual([]);
    expect(boundaries.send.mock.calls[0][0].html).toContain(">33</strong> personnes actives");
  });

  for (const table of ["global_impact", "practice_sessions", "newsletter_sends", "newsletter_subscriptions", "profiles"]) {
    it(`refuses an error from ${table} before creating an email client or sending`, async () => {
      results[table] = { ...results[table], error: { message: "synthetic source unavailable" } };
      const response = await GET(request());
      expect(response.status).toBe(503);
      expect(await response.json()).not.toHaveProperty("ok", true);
      expect(boundaries.createResend).not.toHaveBeenCalled();
      expect(boundaries.send).not.toHaveBeenCalled();
      expect(boundaries.insert).not.toHaveBeenCalled();
    });
  }

  for (const [table, missing] of [["global_impact", { data: null }], ["practice_sessions", { count: null }], ["newsletter_sends", { data: null }], ["newsletter_subscriptions", { data: null }], ["profiles", { data: null }]] as const) {
    it(`does not interpret an absent ${table} result as an empty successful result`, async () => {
      results[table] = { ...missing, error: null };
      const response = await GET(request());
      expect(response.status).toBe(503);
      expect(boundaries.createResend).not.toHaveBeenCalled();
      expect(boundaries.send).not.toHaveBeenCalled();
    });
  }

  for (const statistics of [{ trees_planted: 17 }, { active_users_30d: 33, trees_planted: null }, { active_users_30d: -1, trees_planted: 17 }]) {
    it(`refuses unverified statistics ${JSON.stringify(statistics)}`, async () => {
      results.global_impact = { data: statistics, error: null };
      const response = await GET(request());
      expect(response.status).toBe(503);
      expect(boundaries.send).not.toHaveBeenCalled();
    });
  }

  it("accepts confirmed zero statistics", async () => {
    results.global_impact = { data: { active_users_30d: 0, trees_planted: 0 }, error: null };
    results.practice_sessions = { count: 0, error: null };
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ sent: 2 });
    expect(boundaries.send.mock.calls[0][0].html).toContain(">0</strong> personnes actives");
  });

  it("does not create an email client for a confirmed empty subscription set", async () => {
    results.newsletter_subscriptions = { data: [], error: null };
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, sent: 0 });
    expect(boundaries.createResend).not.toHaveBeenCalled();
    expect(boundaries.from).not.toHaveBeenCalledWith("profiles");
  });

  it("retains campaign deduplication for previously recorded recipients", async () => {
    results.newsletter_sends = { data: [{ email: "first@example.invalid" }, { email: "second@example.invalid" }], error: null };
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, sent: 0 });
    expect(boundaries.send).not.toHaveBeenCalled();
  });

  it("preserves a generic greeting for confirmed missing profiles", async () => {
    results.profiles = { data: [], error: null };
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(boundaries.send.mock.calls[0][0].html).toContain("Bonjour toi");
  });

  it("does not require a profile lookup for email-only subscribers", async () => {
    results.newsletter_subscriptions = { data: [{ email: "guest@example.invalid", locale: "fr", unsubscribe_token: "test-unsub-guest", user_id: null }], error: null };
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(boundaries.send.mock.calls[0][0].html).toContain("Bonjour toi");
    expect(boundaries.from).not.toHaveBeenCalledWith("profiles");
  });

  it("rejects a missing cron secret before any service client", async () => {
    vi.stubEnv("CRON_SECRET", "");
    const response = await GET(new NextRequest("https://kaia.purama.dev/api/cron/weekly-newsletter", { headers: { host: "localhost.attacker.example" } }));
    expect(response.status).toBe(401);
    expect(boundaries.createServiceClient).not.toHaveBeenCalled();
    expect(boundaries.createResend).not.toHaveBeenCalled();
  });

  it("rejects a missing provider key before database lookup", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(boundaries.createServiceClient).not.toHaveBeenCalled();
    expect(boundaries.send).not.toHaveBeenCalled();
  });
});
