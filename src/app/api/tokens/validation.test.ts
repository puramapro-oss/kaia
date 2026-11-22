import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const boundary = vi.hoisted(() => ({
  createClient: vi.fn(),
  createServiceClient: vi.fn(),
  rateLimit: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: boundary.createClient }));
vi.mock("@/lib/supabase/admin", () => ({ createServiceClient: boundary.createServiceClient }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: boundary.rateLimit }));

import { POST as earn } from "./earn/route";
import { POST as spend } from "./spend/route";

function request(body: unknown) {
  return new NextRequest("http://localhost/api/tokens/test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  boundary.createClient.mockResolvedValue({
    auth: { getUser: async () => ({ data: { user: { id: "fixture-user" } } }) },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { balance: 10_000 }, error: null }) }) }) }),
  });
  boundary.rateLimit.mockResolvedValue({ allowed: true });
  boundary.createServiceClient.mockReturnValue({ rpc: boundary.rpc });
  boundary.rpc.mockResolvedValue({ data: [{ new_balance: 500, applied: true }], error: null });
});

describe("the token routes keep their input contracts with Zod 4", () => {
  it("passes arbitrary JSON metadata through the earn route", async () => {
    const metadata = { source: "fixture", nested: { values: [1, null, true] } };
    const response = await earn(request({ reason: "routine_completed", amount: 5, idempotencyKey: "fixture-key", metadata }));
    expect(response.status).toBe(200);
    expect(boundary.rpc).toHaveBeenCalledWith("apply_token_event", expect.objectContaining({ p_delta: 5, p_metadata: metadata, p_idempotency_key: "fixture-key" }));
  });

  it("passes metadata and the existing computed cost through the spend route", async () => {
    const response = await spend(request({ kind: "contest_ticket", metadata: { source: "fixture", accepted: true } }));
    expect(response.status).toBe(200);
    expect(boundary.rpc).toHaveBeenCalledWith("apply_token_event", expect.objectContaining({ p_delta: -500, p_metadata: expect.objectContaining({ source: "fixture", accepted: true }) }));
  });

  it.each([
    { reason: "donation_per_10cents" },
    { reason: "shop_purchase_cashback" },
    { reason: "referral_converted" },
    { reason: "routine_completed", amount: 501 },
    { reason: "routine_completed", amount: 0 },
    { reason: "routine_completed", amount: 1.5 },
    { reason: "routine_completed", metadata: [] },
    { reason: "routine_completed", metadata: null },
    { reason: "routine_completed", idempotencyKey: "short" },
  ])("rejects invalid earn input before authentication or database work: %j", async (body) => {
    const response = await earn(request(body));
    expect(response.status).toBe(400);
    expect((await response.json()).details).toEqual(expect.any(Array));
    expect(boundary.createClient).not.toHaveBeenCalled();
    expect(boundary.rpc).not.toHaveBeenCalled();
  });

  it.each([
    { kind: "unknown" },
    { kind: "promo_subscription_pct", discountPct: 40 },
    { kind: "shop_product", itemCostTokens: -1 },
    { kind: "shop_product", itemCostTokens: 0.5 },
    { kind: "shop_product", productId: "invalid" },
    { kind: "contest_ticket", metadata: [] },
    { kind: "contest_ticket", metadata: "invalid" },
  ])("rejects invalid spend input before authentication or database work: %j", async (body) => {
    const response = await spend(request(body));
    expect(response.status).toBe(400);
    expect((await response.json()).details).toEqual(expect.any(Array));
    expect(boundary.createClient).not.toHaveBeenCalled();
    expect(boundary.rpc).not.toHaveBeenCalled();
  });

  it("retains the authentication boundary for valid metadata", async () => {
    boundary.createClient.mockResolvedValue({ auth: { getUser: async () => ({ data: { user: null } }) } });
    expect((await earn(request({ reason: "routine_completed", metadata: {} }))).status).toBe(401);
    expect((await spend(request({ kind: "contest_ticket", metadata: {} }))).status).toBe(401);
    expect(boundary.createServiceClient).not.toHaveBeenCalled();
  });
});
