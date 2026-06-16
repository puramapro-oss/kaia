import { NextResponse } from "next/server";
import { createClient as createSupabase } from "@/lib/supabase/server";
import { SUPER_ADMIN_EMAIL } from "@/lib/constants";
import { Pool } from "pg";
import fs from "fs";
import path from "path";

export async function POST() {
  try {
    const supabase = await createSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.email !== SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const password = process.env.POSTGRES_PASSWORD;
    const host = process.env.POSTGRES_HOST ?? "72.62.191.111";

    if (!password) {
      return NextResponse.json({ error: "POSTGRES_PASSWORD not set" }, { status: 500 });
    }

    const pool = new Pool({
      host,
      port: 5432,
      database: "postgres",
      user: "postgres",
      password,
      ssl: false,
      connectionTimeoutMillis: 15000,
    });

    const sqlPath = path.join(process.cwd(), "migrations", "kaia_v2_schema.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    const client = await pool.connect();
    try {
      await client.query(sql);
      return NextResponse.json({ success: true, message: "KAÏA V2 schema migration applied." });
    } finally {
      client.release();
      await pool.end();
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
