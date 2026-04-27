import type { NextRequest } from "next/server";

export function isCronAuthorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    const host = request.headers.get("host") ?? "";
    return host.startsWith("localhost") || host.startsWith("127.0.0.1");
  }
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${expected}`) return true;
  const url = new URL(request.url);
  if (url.searchParams.get("secret") === expected) return true;
  return false;
}
