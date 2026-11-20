import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const boundaries = vi.hoisted(() => ({ createServiceClient: vi.fn(), askClaudeJSON: vi.fn(), insert: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createServiceClient: boundaries.createServiceClient }));
vi.mock("@/lib/claude", () => ({ askClaudeJSON: boundaries.askClaudeJSON }));

import { GET } from "./route";

let lookup: { data: { slug: string } | null; error: { message: string } | null };

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("CRON_SECRET", "");
  lookup = { data: { slug: "synthetic-existing-ritual" }, error: null };
  const query = {
    select: () => query,
    eq: () => query,
    maybeSingle: () => Promise.resolve(lookup),
    insert: boundaries.insert,
    single: () => Promise.resolve({ data: { slug: "synthetic-new-ritual" }, error: null }),
  };
  boundaries.insert.mockReturnValue(query);
  boundaries.askClaudeJSON.mockResolvedValue({ intro_short: "Synthetic intro", audio_script_fr: "Synthetic audio", guidance_steps: ["Synthetic step"] });
  boundaries.createServiceClient.mockReturnValue({ from: () => query });
});
afterEach(() => vi.unstubAllEnvs());

describe("weekly ritual cron authorization", () => {
  for (const host of ["localhost", "localhost.attacker.example", "127.0.0.1.attacker.example"]) {
    it(`rejects Host ${host} before querying or generating`, async () => {
      const response = await GET(new NextRequest("https://kaia.purama.dev/api/cron/weekly-ritual", { headers: { host } }));
      expect(response.status).toBe(401);
      expect(boundaries.createServiceClient).not.toHaveBeenCalled();
      expect(boundaries.askClaudeJSON).not.toHaveBeenCalled();
    });
  }

  it("preserves the authenticated existing-ritual response", async () => {
    vi.stubEnv("CRON_SECRET", "synthetic-cron-secret");
    const response = await GET(new NextRequest("https://kaia.purama.dev/api/cron/weekly-ritual", { headers: { authorization: "Bearer synthetic-cron-secret" } }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, action: "skipped_already_exists" });
    expect(boundaries.createServiceClient).toHaveBeenCalledOnce();
    expect(boundaries.askClaudeJSON).not.toHaveBeenCalled();
  });

  for (const data of [null, { slug: "untrusted-result-with-error" }]) {
    it(`refuses an uncertain existing-ritual lookup with ${data ? "data" : "no data"} before generation`, async () => {
      vi.stubEnv("CRON_SECRET", "synthetic-cron-secret");
      lookup = { data, error: { message: "synthetic lookup failure" } };
      const response = await GET(new NextRequest("https://kaia.purama.dev/api/cron/weekly-ritual", { headers: { authorization: "Bearer synthetic-cron-secret" } }));
      expect(response.status).toBe(500);
      expect(await response.json()).not.toHaveProperty("ok", true);
      expect(boundaries.askClaudeJSON).not.toHaveBeenCalled();
      expect(boundaries.insert).not.toHaveBeenCalled();
    });
  }

  it("preserves generation when a successful lookup confirms no existing ritual", async () => {
    vi.stubEnv("CRON_SECRET", "synthetic-cron-secret");
    lookup = { data: null, error: null };
    const response = await GET(new NextRequest("https://kaia.purama.dev/api/cron/weekly-ritual", { headers: { authorization: "Bearer synthetic-cron-secret" } }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, action: "created" });
    expect(boundaries.askClaudeJSON).toHaveBeenCalledOnce();
    expect(boundaries.insert).toHaveBeenCalledOnce();
  });
});
