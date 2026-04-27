#!/usr/bin/env tsx
/**
 * KAÏA — translate-messages.ts
 *
 * Lit src/messages/fr.json comme source de vérité, génère src/messages/{locale}.json
 * pour les 34 autres langues via Claude Sonnet 4.6, en batchant par 5 langues
 * (BRIEF §16 — pas tout en 1 call sinon coût + risque tronquage).
 *
 * Idempotent : ne ré-écrit que les locales manquantes ou explicitement passées en CLI.
 *
 * Usage :
 *   npx tsx scripts/translate-messages.ts                 # toutes les manquantes
 *   npx tsx scripts/translate-messages.ts en es ar       # locales spécifiques
 *   npx tsx scripts/translate-messages.ts --force en      # force ré-écriture
 *   npx tsx scripts/translate-messages.ts --plan          # dry-run, affiche le plan
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, LOCALE_LABELS, type Locale } from "../src/i18n/locales";

const MESSAGES_DIR = resolve(__dirname, "../src/messages");
const SOURCE_FILE = resolve(MESSAGES_DIR, `${DEFAULT_LOCALE}.json`);

const args = process.argv.slice(2);
const isPlan = args.includes("--plan");
const isForce = args.includes("--force");
const explicit = args.filter((a) => !a.startsWith("--")) as Locale[];

function envTrim(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

const apiKey = envTrim(process.env.ANTHROPIC_API_KEY);
if (!apiKey && !isPlan) {
  console.error("✗ ANTHROPIC_API_KEY manquante");
  process.exit(1);
}

const model = envTrim(process.env.ANTHROPIC_MODEL_MAIN) || "claude-sonnet-4-6";

const client = apiKey ? new Anthropic({ apiKey }) : null;

if (!existsSync(SOURCE_FILE)) {
  console.error(`✗ Source ${SOURCE_FILE} introuvable`);
  process.exit(1);
}

const source = JSON.parse(readFileSync(SOURCE_FILE, "utf-8")) as Record<string, unknown>;

const targets = (explicit.length > 0 ? explicit : SUPPORTED_LOCALES).filter(
  (l) => l !== DEFAULT_LOCALE,
);

const toBuild = targets.filter((locale) => {
  const file = resolve(MESSAGES_DIR, `${locale}.json`);
  if (!existsSync(file)) return true;
  if (isForce && (explicit.length === 0 || explicit.includes(locale))) return true;
  return false;
});

console.log(`📋 KAÏA i18n — ${SUPPORTED_LOCALES.length} locales totales (1 source ${DEFAULT_LOCALE})`);
console.log(`   Modèle    : ${model}`);
console.log(`   Cibles    : ${targets.length} (${targets.length === SUPPORTED_LOCALES.length - 1 ? "toutes" : explicit.join(", ")})`);
console.log(`   À générer : ${toBuild.length} ${toBuild.length === 0 ? "(rien à faire)" : `(${toBuild.join(", ")})`}`);

if (isPlan) {
  console.log("\n--plan : aucune écriture.");
  process.exit(0);
}

if (toBuild.length === 0) {
  console.log("✓ Toutes les locales déjà générées. Utilise --force pour ré-écrire.");
  process.exit(0);
}

const SYSTEM_PROMPT = `Tu es traducteur professionnel pour KAÏA, une app de bien-être et de routine multisensorielle (respiration, méditation, gratitude, sons binauraux). Audience : grand public adulte 18-65 ans.

Règles strictes :
1. Conserve EXACTEMENT la structure JSON (mêmes clés, même imbrication)
2. Conserve les variables {placeholder} et leur format exact
3. Conserve les emojis (🌱 etc.)
4. Conserve les sauts de ligne et la ponctuation
5. Tutoiement chaleureux dans les langues qui le distinguent (français → "tu", espagnol → "tú", allemand → "du", etc.)
6. Vocabulaire SANS claim médical : jamais "soigner", "guérir", "diagnostiquer". Préfère "apaiser", "accompagner", "ressourcer".
7. Numéros de téléphone et codes (3114, 112, 09 72…) = LITTÉRAUX, ne traduis pas
8. Marques (KAÏA, VIDA, SOS Amitié, OpenDyslexic, VoiceOver, TalkBack) = LITTÉRAUX
9. Pour l'arabe, persan, hébreu, ourdou : direction RTL automatique côté UI, ton texte reste lisible naturellement
10. Adapte les références culturelles (ex : "3114" reste pour la France, mais le texte général reste universel)

Réponds UNIQUEMENT avec le JSON traduit, sans markdown, sans fence, sans préambule.`;

async function translateLocale(locale: Locale): Promise<Record<string, unknown>> {
  if (!client) throw new Error("Anthropic client non initialisé");

  const userMessage = `Traduis ce JSON depuis le français vers ${LOCALE_LABELS[locale]} (code BCP-47 : ${locale}).

Source FR :
${JSON.stringify(source, null, 2)}`;

  const response = await client.messages.create({
    model,
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const text = response.content
    .filter((b): b is { type: "text"; text: string } => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  // Strip markdown code fences si jamais le modèle en met
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch (err) {
    console.error(`✗ JSON parse failed pour ${locale}. Réponse brute :\n${text.slice(0, 500)}…`);
    throw err;
  }
}

function validateShape(translated: Record<string, unknown>, ref: Record<string, unknown>, path = ""): string[] {
  const issues: string[] = [];
  for (const key of Object.keys(ref)) {
    const refVal = ref[key];
    const tVal = translated[key];
    const fullKey = path ? `${path}.${key}` : key;
    if (tVal === undefined) {
      issues.push(`clé manquante : ${fullKey}`);
      continue;
    }
    if (typeof refVal === "object" && refVal !== null && !Array.isArray(refVal)) {
      if (typeof tVal !== "object" || tVal === null) {
        issues.push(`type incompatible : ${fullKey} (attendu object, reçu ${typeof tVal})`);
        continue;
      }
      issues.push(...validateShape(tVal as Record<string, unknown>, refVal as Record<string, unknown>, fullKey));
    } else if (typeof refVal === "string" && typeof tVal !== "string") {
      issues.push(`type incompatible : ${fullKey} (attendu string, reçu ${typeof tVal})`);
    }
  }
  return issues;
}

/**
 * Limite Anthropic Tier 1 : 8 000 output tokens / minute.
 * Notre payload de réponse fait ~3 500 tokens output → 2 traductions max / 60s.
 * On reste safe avec 1 traduction toutes les 35s, retry exponentiel sur 429.
 */
const SEQUENTIAL_DELAY_MS = 35000;
const MAX_RETRIES = 4;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function withRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let attempt = 0;
  let lastErr: unknown;
  while (attempt < MAX_RETRIES) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("429") && !msg.includes("rate_limit")) throw err;
      const wait = 30000 * Math.pow(2, attempt); // 30s → 60s → 120s → 240s
      console.log(`   ⏳ ${label} rate-limited, retry dans ${wait / 1000}s (essai ${attempt + 1}/${MAX_RETRIES})`);
      await sleep(wait);
      attempt++;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("retries exhausted");
}

async function runSequential() {
  const errors: { locale: Locale; reason: string }[] = [];
  console.log(`\n🐢 Mode séquentiel : 1 traduction toutes les ~${SEQUENTIAL_DELAY_MS / 1000}s pour respecter rate limit Anthropic.\n`);

  for (let i = 0; i < toBuild.length; i++) {
    const locale = toBuild[i];
    const t0 = Date.now();
    process.stdout.write(`🌐 [${i + 1}/${toBuild.length}] ${locale} … `);
    try {
      const translated = await withRetry(locale, () => translateLocale(locale));
      const issues = validateShape(translated, source);
      if (issues.length > 0) {
        throw new Error(`Validation échouée (${issues.length} issues) : ${issues.slice(0, 2).join(" / ")}`);
      }
      const file = resolve(MESSAGES_DIR, `${locale}.json`);
      writeFileSync(file, JSON.stringify(translated, null, 2) + "\n", "utf-8");
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      process.stdout.write(`✓ (${elapsed}s)\n`);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      process.stdout.write(`✗ ${reason.slice(0, 120)}\n`);
      errors.push({ locale, reason });
    }

    if (i < toBuild.length - 1) {
      await sleep(SEQUENTIAL_DELAY_MS);
    }
  }

  if (errors.length > 0) {
    console.log(`\n⚠️  ${errors.length} échec(s). Re-run :`);
    console.log(`   npx tsx scripts/translate-messages.ts ${errors.map((e) => e.locale).join(" ")}`);
    process.exit(1);
  }

  console.log(`\n✅ ${toBuild.length} locales générées.`);
}

runSequential().catch((err) => {
  console.error("✗ translate-messages crash :", err);
  process.exit(1);
});
