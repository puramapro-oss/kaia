import { NextResponse, type NextRequest } from "next/server";
import { Client } from "pg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One-shot diagnostic admin route — utilise pg direct vers Postgres VPS.
 * Protégé par un token unique partagé via env (ADMIN_DB_TOKEN).
 *
 * GET /api/admin/db-diagnose?token=...
 * → renvoie state du trigger handle_new_auth_user + dernière erreur de la
 *   table profiles + version Postgres.
 */
function trim(value: string | undefined): string | undefined {
  return value?.replace(/\\n/g, "").trim() || undefined;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const expected = trim(process.env.ADMIN_DB_TOKEN);
  if (!expected || token !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const password = trim(process.env.POSTGRES_PASSWORD);
  const host = trim(process.env.POSTGRES_HOST) ?? "72.62.191.111";
  if (!password) {
    return NextResponse.json({ error: "POSTGRES_PASSWORD missing" }, { status: 500 });
  }

  // Try multiple supavisor tenant formats + raw postgres
  const candidates = [
    { user: "postgres", port: 5432, label: "raw-5432" },
    { user: "postgres", port: 6543, label: "raw-6543" },
    { user: "postgres.kaia", port: 5432, label: "kaia-5432" },
    { user: "postgres.kaia", port: 6543, label: "kaia-6543" },
    { user: "postgres.purama", port: 5432, label: "purama-5432" },
    { user: "postgres.postgres", port: 5432, label: "tenant-postgres" },
    { user: "postgres.default", port: 5432, label: "tenant-default" },
    { user: "supabase_admin", port: 5432, label: "admin-5432" },
  ];

  const probeUserParam = url.searchParams.get("user");
  const probePortParam = url.searchParams.get("port");
  const queue = probeUserParam
    ? [{ user: probeUserParam, port: Number(probePortParam ?? 5432), label: "explicit" }]
    : candidates;

  const probes: Array<{ label: string; user: string; port: number; status: string; error?: string }> = [];
  let connected: { client: Client; user: string; port: number } | null = null;

  for (const candidate of queue) {
    const c = new Client({
      host,
      port: candidate.port,
      user: candidate.user,
      password,
      database: "postgres",
      ssl: false,
      statement_timeout: 5000,
      connectionTimeoutMillis: 5000,
    });
    try {
      await c.connect();
      probes.push({ ...candidate, status: "OK" });
      connected = { client: c, user: candidate.user, port: candidate.port };
      break;
    } catch (err) {
      probes.push({
        ...candidate,
        status: "FAIL",
        error: err instanceof Error ? err.message : String(err),
      });
      await c.end().catch(() => undefined);
    }
  }

  if (!connected) {
    return NextResponse.json({ ok: false, error: "no_candidate_worked", probes }, { status: 502 });
  }

  const client = connected.client;
  try {
    const fnExists = await client.query(
      `SELECT proname, prosrc FROM pg_proc WHERE proname = 'handle_new_auth_user' LIMIT 1`,
    );
    const triggerExists = await client.query(
      `SELECT tgname, tgrelid::regclass::text AS rel
       FROM pg_trigger WHERE tgname = 'on_auth_user_created' LIMIT 1`,
    );
    const profileCols = await client.query(
      `SELECT column_name, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_schema = 'kaia' AND table_name = 'profiles'
       ORDER BY ordinal_position`,
    );
    const profilesCount = await client.query(
      `SELECT count(*)::int AS n FROM kaia.profiles`,
    );
    const authUsersCount = await client.query(
      `SELECT count(*)::int AS n FROM auth.users`,
    );
    const version = await client.query(`SELECT version()`);

    return NextResponse.json({
      ok: true,
      connected_via: { user: connected.user, port: connected.port },
      probes,
      version: version.rows[0]?.version,
      function_exists: (fnExists.rowCount ?? 0) > 0,
      function_body_preview: fnExists.rows[0]?.prosrc?.slice(0, 600),
      trigger_exists: (triggerExists.rowCount ?? 0) > 0,
      trigger_target: triggerExists.rows[0]?.rel,
      profiles_columns: profileCols.rows,
      profiles_count: profilesCount.rows[0]?.n,
      auth_users_count: authUsersCount.rows[0]?.n,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "db_query_failed", details: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  } finally {
    await client.end().catch(() => undefined);
  }
}
