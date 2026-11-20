import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { isAuthorizedCron } from "./cron-auth";
import { isCronAuthorized } from "./contests/cron-helpers";

afterEach(() => vi.unstubAllEnvs());

for (const [name, authorize] of [
  ["shared cron authorization", isAuthorizedCron],
  ["contest compatibility entry point", isCronAuthorized],
] as const) {
  describe(name, () => {
    for (const host of ["localhost", "localhost:3000", "localhost.attacker.example", "127.0.0.1", "127.0.0.1.attacker.example", "[::1]", "kaia.purama.dev"]) {
      it(`requires a configured secret even with Host ${host}`, () => {
        vi.stubEnv("CRON_SECRET", "");
        vi.stubEnv("NODE_ENV", "production");
        const request = new NextRequest("https://kaia.purama.dev/api/cron/example", { headers: { host } });
        expect(authorize(request)).toBe(false);
      });
    }

    it("also requires a secret in development", () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("CRON_SECRET", "");
      expect(authorize(new NextRequest("http://localhost:3000/api/cron/example", { headers: { host: "localhost:3000" } }))).toBe(false);
    });

    it("accepts the exact bearer secret", () => {
      vi.stubEnv("CRON_SECRET", "synthetic-cron-secret");
      expect(authorize(new NextRequest("https://kaia.purama.dev/api/cron/example", { headers: { authorization: "Bearer synthetic-cron-secret" } }))).toBe(true);
    });

    it("preserves explicit manual secret authentication", () => {
      vi.stubEnv("CRON_SECRET", "synthetic secret +/?");
      expect(authorize(new NextRequest("https://kaia.purama.dev/api/cron/example?secret=" + encodeURIComponent("synthetic secret +/?")))).toBe(true);
    });

    for (const authorization of ["", "Bearer wrong-secret", "Bearer synthetic-cron-secret-extra", "bearer synthetic-cron-secret"]) {
      it(`rejects a missing or incorrect bearer ${JSON.stringify(authorization)}`, () => {
        vi.stubEnv("CRON_SECRET", "synthetic-cron-secret");
        expect(authorize(new NextRequest("http://localhost/api/cron/example?secret=wrong-secret", { headers: { host: "localhost", authorization } }))).toBe(false);
      });
    }
  });
}
