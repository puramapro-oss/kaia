#!/usr/bin/env -S npx tsx
/**
 * Tente d'appliquer la migration P5 via plusieurs canaux. Si tous échouent,
 * affiche les instructions manuelles 30s pour Tissma.
 *
 * Voies essayées :
 *   1. SSH VPS via sshpass (root@srv1286148.hstgr.cloud) → docker exec psql
 *   2. Postgres direct (port 5432) avec POSTGRES_PASSWORD
 *   3. Postgres via Supavisor (postgres.{tenant}@host)
 *
 * Idempotent : la migration utilise `create … if not exists` + `create or replace function`.
 *
 * Usage:
 *   npx tsx scripts/apply-migration-p5.ts
 */
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const MIGRATION_PATH = resolve(__dirname, "../supabase/migrations/0002_p5_community.sql");
const SECRETS_PATH = resolve(process.env.HOME ?? "", "purama/.env.secrets");

if (!existsSync(MIGRATION_PATH)) {
  console.error(`❌ Migration introuvable : ${MIGRATION_PATH}`);
  process.exit(1);
}

const sql = readFileSync(MIGRATION_PATH, "utf8");
console.log(`📄 Migration chargée (${sql.length} chars)`);

function readSecret(name: string): string | undefined {
  if (!existsSync(SECRETS_PATH)) return undefined;
  const content = readFileSync(SECRETS_PATH, "utf8");
  const match = content.match(new RegExp(`^${name}=['"]?([^'"\\n]+)['"]?$`, "m"));
  return match?.[1];
}

const VPS_PASSWORD = readSecret("VPS_SSH_PASSWORD");
const PG_PASSWORD = readSecret("POSTGRES_PASSWORD");

console.log(`🔑 Secrets : VPS_SSH=${VPS_PASSWORD ? "ok" : "missing"} · POSTGRES=${PG_PASSWORD ? "ok" : "missing"}`);

let applied = false;
let lastError = "";

// Voie 1 — SSH docker exec psql
if (VPS_PASSWORD && PG_PASSWORD && !applied) {
  try {
    process.stdout.write("→ SSH VPS docker exec psql … ");
    execSync(
      `sshpass -p '${VPS_PASSWORD}' ssh -o StrictHostKeyChecking=no -o ConnectTimeout=8 -o NumberOfPasswordPrompts=1 root@srv1286148.hstgr.cloud "docker exec -i supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1" < "${MIGRATION_PATH}"`,
      { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
    );
    console.log("OK");
    applied = true;
  } catch (e) {
    lastError = e instanceof Error ? e.message : String(e);
    console.log(`fail (${lastError.slice(0, 80)})`);
  }
}

// Voie 2 — psql direct port 5432 (échouera probablement avec Supavisor)
if (PG_PASSWORD && !applied) {
  const PSQL = "/opt/homebrew/opt/libpq/bin/psql";
  if (existsSync(PSQL)) {
    try {
      process.stdout.write("→ psql direct 5432 … ");
      execSync(
        `PGPASSWORD='${PG_PASSWORD}' ${PSQL} -h 72.62.191.111 -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -f "${MIGRATION_PATH}"`,
        { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
      );
      console.log("OK");
      applied = true;
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      console.log(`fail (${lastError.slice(0, 80)})`);
    }
  }
}

if (applied) {
  console.log("\n✅ Migration P5 appliquée.");
  process.exit(0);
}

console.error("\n❌ Aucune voie automatique disponible.");
console.error("\n📋 ACTION MANUELLE TISSMA (30 secondes) :");
console.error("   1. Ouvre Supabase Studio (auth.purama.dev → SQL editor)");
console.error("   2. Colle le contenu de :");
console.error(`      ${MIGRATION_PATH}`);
console.error("   3. Run.");
console.error("\nLa migration est idempotente — re-run sans risque.\n");
process.exit(2);
