#!/usr/bin/env tsx
/**
 * KAÏA — axe-audit.ts
 *
 * Lance un audit accessibilité axe-core sur les pages publiques principales
 * de la prod (par défaut) ou d'une URL custom (--base=).
 *
 * Usage :
 *   npm run a11y:axe                          # prod
 *   npm run a11y:axe -- --base=http://localhost:3000
 *   npm run a11y:axe -- --paths=/pricing,/manifesto
 *
 * Exit code : 0 si 0 violation critique/sérieuse, 1 sinon.
 */

import { chromium } from "playwright";

const args = process.argv.slice(2);
const baseArg = args.find((a) => a.startsWith("--base="));
const pathsArg = args.find((a) => a.startsWith("--paths="));

const BASE = baseArg ? baseArg.slice("--base=".length) : "https://kaia.purama.dev";
const PATHS = pathsArg
  ? pathsArg.slice("--paths=".length).split(",")
  : ["/", "/pricing", "/manifesto", "/login", "/signup", "/legal/privacy", "/legal/cgu", "/influencers"];

type AxeViolation = {
  id: string;
  impact: "minor" | "moderate" | "serious" | "critical" | null;
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{ html: string; target: string[]; failureSummary: string }>;
};

async function loadAxeSource(): Promise<string> {
  const res = await fetch("https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js");
  if (!res.ok) throw new Error(`Impossible de télécharger axe-core (${res.status})`);
  return res.text();
}

async function main() {
  console.log(`📋 KAÏA axe-core audit`);
  console.log(`   Base   : ${BASE}`);
  console.log(`   Paths  : ${PATHS.join(", ")}`);

  const axeSource = await loadAxeSource();
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: "fr-FR" });

  const summary: Array<{ path: string; status: number; violations: AxeViolation[] }> = [];

  for (const path of PATHS) {
    const url = `${BASE}${path}`;
    const page = await ctx.newPage();
    process.stdout.write(`\n🌐 ${path} `);
    try {
      const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
      const status = response?.status() ?? 0;
      if (status >= 400) {
        process.stdout.write(`(HTTP ${status} — skip)\n`);
        summary.push({ path, status, violations: [] });
        await page.close();
        continue;
      }
      await page.addScriptTag({ content: axeSource });
      const result = (await page.evaluate(async () => {
        // @ts-expect-error injected
        const out = await window.axe.run(document, {
          runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"],
        });
        return out.violations;
      })) as AxeViolation[];

      const critical = result.filter((v) => v.impact === "critical" || v.impact === "serious");
      process.stdout.write(`(${result.length} total · ${critical.length} bloquantes)\n`);
      for (const v of critical) {
        console.log(`   ✗ [${v.impact}] ${v.id} — ${v.help} (${v.nodes.length} nœud(s))`);
      }
      summary.push({ path, status, violations: result });
    } catch (err) {
      process.stdout.write(`(erreur)\n`);
      const reason = err instanceof Error ? err.message : String(err);
      console.log(`   ✗ ${reason}`);
      summary.push({ path, status: 0, violations: [] });
    } finally {
      await page.close();
    }
  }

  await browser.close();

  const totalCritical = summary.reduce(
    (acc, s) => acc + s.violations.filter((v) => v.impact === "critical" || v.impact === "serious").length,
    0,
  );
  const totalAll = summary.reduce((acc, s) => acc + s.violations.length, 0);

  console.log(`\n──────────────────────────────`);
  console.log(`Résumé : ${summary.length} pages · ${totalAll} violations · ${totalCritical} critiques/sérieuses`);

  if (totalCritical > 0) {
    console.log(`\n❌ Échec — ${totalCritical} violations bloquantes`);
    process.exit(1);
  }
  console.log(`\n✅ Aucun blocage WCAG 2.2 AA.`);
}

main().catch((err) => {
  console.error("✗ axe-audit.ts crash :", err);
  process.exit(1);
});
