#!/usr/bin/env -S npx tsx
/**
 * Tente d'appliquer la migration P7 via plusieurs canaux. Si tous échouent,
 * affiche les instructions manuelles 30s pour Tissma.
 *
 * Voies essayées :
 *   1. SSH VPS via sshpass (root@72.62.191.111) → docker exec psql
 *   2. SSH VPS via hostname `srv1286148.hstgr.cloud`
 *   3. psql direct port 5432 (Supavisor)
 *
 * Idempotent : `alter … add column if not exists`, `create … if not exists`,
 * `create or replace function`, `drop policy if exists … create policy`.
 *
 * Usage:
 *   npx tsx scripts/apply-migration-p7.ts
 */
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const MIGRATION_PATH = resolve(__dirname, "../supabase/migrations/0004_p7_gamification.sql");
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

console.log(
  `🔑 Secrets : VPS_SSH=${VPS_PASSWORD ? "ok" : "missing"} · POSTGRES=${PG_PASSWORD ? "ok" : "missing"}`
);

let applied = false;
let lastError = "";

const SSH_HOSTS = ["72.62.191.111", "srv1286148.hstgr.cloud"];

if (VPS_PASSWORD) {
  for (const host of SSH_HOSTS) {
    if (applied) break;
    try {
      process.stdout.write(`→ SSH ${host} docker exec psql … `);
      execSync(
        `sshpass -p '${VPS_PASSWORD}' ssh -o StrictHostKeyChecking=no -o ConnectTimeout=8 -o NumberOfPasswordPrompts=1 root@${host} "docker exec -i supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1" < "${MIGRATION_PATH}"`,
        { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" }
      );
      console.log("OK");
      applied = true;
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      console.log(`fail (${lastError.slice(0, 80)})`);
    }
  }
}

if (PG_PASSWORD && !applied) {
  const PSQL_PATHS = [
    "/opt/homebrew/opt/libpq/bin/psql",
    "/usr/local/opt/libpq/bin/psql",
    "/usr/bin/psql",
  ];
  const PSQL = PSQL_PATHS.find((p) => existsSync(p));
  if (PSQL) {
    try {
      process.stdout.write(`→ psql direct 5432 … `);
      execSync(
        `PGPASSWORD='${PG_PASSWORD}' ${PSQL} -h 72.62.191.111 -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -f "${MIGRATION_PATH}"`,
        { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" }
      );
      console.log("OK");
      applied = true;
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      console.log(`fail (${lastError.slice(0, 80)})`);
    }
  } else {
    console.log("→ psql introuvable (pas de fallback direct)");
  }
}

if (applied) {
  console.log("\n✅ Migration P7 appliquée.");
  process.exit(0);
}

console.error("\n❌ Aucune voie automatique disponible.");
console.error("\n📋 ACTION MANUELLE TISSMA (30 secondes) :");
console.error("   1. Ouvre Supabase Studio (auth.purama.dev → SQL editor)");
console.error("   2. Colle le contenu de :");
console.error(`      ${MIGRATION_PATH}`);
console.error("   3. Run.");
console.error("\nLa migration est idempotente — re-run sans risque.");
console.error("\nFallback applicatif : routes /api/influencer/* et /api/referral/* fonctionnent");
console.error("avec ou sans la migration ; les nouvelles colonnes ont des defaults SQL.\n");
process.exit(2);
