import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const boundary = vi.hoisted(() => ({ createServiceClient: vi.fn(), stampHashHex: vi.fn(), requireAdmin: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createServiceClient: boundary.createServiceClient }));
vi.mock("@/lib/opentimestamps", () => ({ stampHashHex: boundary.stampHashHex }));
vi.mock("@/lib/admin/guard", () => ({ requireAdmin: boundary.requireAdmin }));

import { runContestDraw } from "./run-draw";
import { POST } from "@/app/api/contests/draw/route";
import { GET as weekly } from "@/app/api/cron/contest-weekly/route";
import { GET as monthly } from "@/app/api/cron/contest-monthly/route";
import { GET as yearly } from "@/app/api/cron/contest-yearly/route";

const contestId = "11111111-1111-4111-8111-111111111111";
const contest = {
  id: contestId, slug: "fixture-contest", status: "live", ends_at: "2020-01-01T00:00:00Z",
  prizes: [{ type: "tokens", value: 50 }, { type: "tokens", value: 75 }],
};
const fixtures = {
  contestError: false, entriesError: false, recordError: false, seedError: false,
  creditError: false, listError: false, periodReads: 0, emptyEntries: false, nullEntries: false,
  recordData: [] as unknown, creditData: [] as unknown, seedRow: { id: contestId } as unknown,
};
const writes = vi.fn();
const rpc = vi.fn();
const from = vi.fn((table: string) => {
  if (table === "contest_entries") return { select: () => ({ eq: async () => ({
    data: fixtures.nullEntries ? null : fixtures.emptyEntries ? [] : [{ user_id: "user-a", tickets: 1 }, { user_id: "user-b", tickets: 1 }],
    error: fixtures.entriesError ? { message: "synthetic entries outage" } : null,
  }) }) };
  if (table !== "contests") throw new Error(`Unexpected table ${table}`);
  return {
    select: () => ({ eq: (field: string) => {
      if (field === "kind") return { lte: () => ({ neq: () => ({ order: () => ({ limit: async () => ({
        data: [{ id: contestId, slug: contest.slug }], error: fixtures.listError ? { message: "synthetic list outage" } : null,
      }) }) }) }) };
      if (field === "slug") fixtures.periodReads++;
      return { maybeSingle: async () => ({ data: contest, error: fixtures.contestError ? { message: "synthetic contest outage" } : null }) };
    } }),
    update: (payload: unknown) => {
      writes(payload);
      const result = { data: fixtures.seedRow, error: fixtures.seedError ? { message: "synthetic write outage" } : null };
      return { eq: () => Object.assign(Promise.resolve(result), {
        select: () => ({ maybeSingle: async () => result }),
      }) };
    },
  };
});
const admin = { from, rpc } as unknown as Parameters<typeof runContestDraw>[0]["admin"];
const draw = () => runContestDraw({ admin, contestId });
const credits = () => rpc.mock.calls.filter(([name]) => name === "apply_token_event");
const request = (body = { contestId }) => new NextRequest("http://localhost/api/contests/draw", {
  method: "POST", headers: { authorization: "Bearer fixture-cron-secret", "content-type": "application/json" }, body: JSON.stringify(body),
});
const cronRequest = () => new NextRequest("http://localhost/api/cron/contest", { headers: { authorization: "Bearer fixture-cron-secret" } });

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("CRON_SECRET", "fixture-cron-secret");
  Object.assign(fixtures, {
    contestError: false, entriesError: false, recordError: false, seedError: false,
    creditError: false, listError: false, periodReads: 0, emptyEntries: false, nullEntries: false,
    recordData: [{ applied: true, reason: "ok" }], creditData: [{ applied: true, reason: "ok" }], seedRow: { id: contestId },
  });
  boundary.createServiceClient.mockReturnValue(admin);
  boundary.stampHashHex.mockResolvedValue(null);
  boundary.requireAdmin.mockResolvedValue({ ok: false, status: 401, error: "Unauthorized" });
  rpc.mockImplementation(async (name: string) => {
    if (name === "record_contest_winners") return { data: fixtures.recordData, error: fixtures.recordError ? { message: "synthetic ambiguous RPC failure" } : null };
    if (name === "apply_token_event") return { data: fixtures.creditData, error: fixtures.creditError ? { message: "synthetic credit failure" } : null };
    throw new Error(`Unexpected RPC ${name}`);
  });
});
afterEach(() => vi.unstubAllEnvs());

describe("the real draw runner respects each database acknowledgement", () => {
  it("keeps successful deterministic draws and existing credit parameters", async () => {
    expect(await draw()).toMatchObject({ drew: true, winnersCount: 2, totalParticipants: 2, totalTickets: 2 });
    expect(credits()).toHaveLength(2);
    expect(credits().map(([, args]) => args.p_delta)).toEqual([50, 75]);
    expect(credits().every(([, args]) => args.p_daily_cap === undefined)).toBe(true);
    expect(writes).toHaveBeenCalledWith({ draw_seed: expect.any(String) });
  });

  it("does not treat a contest read failure as a missing contest", async () => {
    fixtures.contestError = true;
    expect(await draw()).toMatchObject({ drew: false, reason: "contest_read_failed" });
    expect(rpc).not.toHaveBeenCalled();
    expect(boundary.stampHashHex).not.toHaveBeenCalled();
  });

  it("never records an empty draw after a failed participant query", async () => {
    fixtures.entriesError = true;
    expect(await draw()).toMatchObject({ drew: false, reason: "entries_unavailable" });
    expect(rpc).not.toHaveBeenCalled();
    expect(writes).not.toHaveBeenCalled();
    expect(boundary.stampHashHex).not.toHaveBeenCalled();
  });

  it("retains a genuinely empty contest without attempting credits", async () => {
    fixtures.emptyEntries = true;
    expect(await draw()).toMatchObject({ drew: true, winnersCount: 0 });
    expect(credits()).toHaveLength(0);
  });

  it("refuses unconfirmed null entries even when the database reports no error", async () => {
    fixtures.nullEntries = true;
    expect(await draw()).toMatchObject({ drew: false, reason: "entries_unavailable" });
    expect(rpc).not.toHaveBeenCalled();
    expect(writes).not.toHaveBeenCalled();
    expect(boundary.stampHashHex).not.toHaveBeenCalled();
  });

  it("never bypasses an ambiguous record RPC with direct writes or credits", async () => {
    fixtures.recordError = true;
    expect(await draw()).toMatchObject({ drew: false, reason: "draw_recording_failed", reconciliationRequired: true });
    expect(writes).not.toHaveBeenCalled();
    expect(credits()).toHaveLength(0);
  });

  it("does not credit a draw lost to a concurrent request", async () => {
    fixtures.recordData = [{ applied: false, reason: "already_drawn" }];
    expect(await draw()).toMatchObject({ drew: false, reason: "already_drawn" });
    expect(writes).not.toHaveBeenCalled();
    expect(credits()).toHaveLength(0);
  });

  it.each([null, [], [{}], [{ applied: true }], [{ applied: true, reason: "ok" }, { applied: true, reason: "ok" }]])("refuses an unconfirmed record response: %j", async (response) => {
    fixtures.recordData = response;
    expect(await draw()).toMatchObject({ drew: false, reason: "draw_recording_unconfirmed", reconciliationRequired: true });
    expect(writes).not.toHaveBeenCalled();
    expect(credits()).toHaveLength(0);
  });

  it("reports a recorded draw needing reconciliation when its seed write fails", async () => {
    fixtures.seedError = true;
    expect(await draw()).toMatchObject({ drew: false, reason: "draw_recorded_seed_failed", reconciliationRequired: true });
    expect(credits()).toHaveLength(0);
  });

  it("requires the exact returned contest row before any credit", async () => {
    for (const row of [null, { id: "different-contest" }]) {
      fixtures.seedRow = row;
      expect(await draw()).toMatchObject({ drew: false, reason: "draw_recorded_seed_failed", reconciliationRequired: true });
      expect(credits()).toHaveLength(0);
    }
  });

  it("stops after the first failed credit and does not claim completion", async () => {
    fixtures.creditError = true;
    expect(await draw()).toMatchObject({ drew: false, reason: "draw_recorded_credit_failed", reconciliationRequired: true });
    expect(credits()).toHaveLength(1);
  });

  it.each([null, [], [{ applied: false, reason: "daily_cap_reached" }], [{ applied: true, reason: "unknown" }]])("does not report a declined or unknown credit as paid: %j", async (response) => {
    fixtures.creditData = response;
    expect(await draw()).toMatchObject({ drew: false, reason: "draw_recorded_credit_unconfirmed", reconciliationRequired: true });
    expect(credits()).toHaveLength(1);
  });

  it("accepts the existing explicit idempotent replay result", async () => {
    fixtures.creditData = [{ applied: false, reason: "idempotent_replay" }];
    expect(await draw()).toMatchObject({ drew: true });
    expect(credits()).toHaveLength(2);
  });
});

describe("the actual HTTP callers report draw failures truthfully", () => {
  it("returns 503 and a reconciliation marker for an ambiguous admin draw", async () => {
    fixtures.recordError = true;
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ ok: false, reason: "draw_recording_failed", reconciliationRequired: true });
    expect(credits()).toHaveLength(0);
  });

  it("retains the conflict response when another request has already recorded the draw", async () => {
    fixtures.recordData = [{ applied: false, reason: "already_drawn" }];
    expect((await POST(request())).status).toBe(409);
    expect(credits()).toHaveLength(0);
  });

  for (const [name, handler] of [["weekly", weekly], ["monthly", monthly], ["yearly", yearly]] as const) {
    it(`${name}: stops when the pending contest list cannot be read`, async () => {
      fixtures.listError = true;
      const response = await handler(cronRequest());
      expect(response.status).toBe(503);
      expect(await response.json()).toMatchObject({ ok: false, reason: "contest_list_unavailable" });
      expect(rpc).not.toHaveBeenCalled();
      expect(fixtures.periodReads).toBe(0);
    });

    it(`${name}: reports a failed draw and does not silently continue period creation`, async () => {
      fixtures.recordError = true;
      const response = await handler(cronRequest());
      expect(response.status).toBe(503);
      expect(await response.json()).toMatchObject({ ok: false, reason: "draw_recording_failed", reconciliationRequired: true });
      expect(fixtures.periodReads).toBe(0);
      expect(credits()).toHaveLength(0);
    });

    it(`${name}: a confirmed concurrent completion remains a harmless replay`, async () => {
      fixtures.recordData = [{ applied: false, reason: "already_drawn" }];
      const response = await handler(cronRequest());
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ ok: true });
      expect(fixtures.periodReads).toBe(1);
      expect(credits()).toHaveLength(0);
    });

    it(`${name}: authentication still precedes all database work`, async () => {
      const response = await handler(new NextRequest("http://localhost/api/cron/contest"));
      expect(response.status).toBe(401);
      expect(boundary.createServiceClient).not.toHaveBeenCalled();
    });
  }
});
