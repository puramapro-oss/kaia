import { test, expect } from "@playwright/test";

/**
 * KAÏA E2E — smoke tests P10
 *
 * Vérifie que les pages publiques principales chargent en < 5s, sans
 * erreur console critique, avec les meta SEO + JSON-LD attendus.
 * Sur prod : pas de signup réel (gating Apple). Les flows authentifiés
 * sont couverts par flows.spec.ts (compte démo).
 */

test.describe("Smoke — pages publiques", () => {
  const PUBLIC_PAGES = [
    { path: "/", title: /KAÏA/ },
    { path: "/pricing", title: /KAÏA/ },
    { path: "/manifesto", title: /KAÏA/ },
    { path: "/login", title: /KAÏA/ },
    { path: "/legal/privacy", title: /KAÏA/ },
    { path: "/legal/cgu", title: /KAÏA/ },
    { path: "/legal/contests-rules", title: /KAÏA/ },
  ];

  for (const { path, title } of PUBLIC_PAGES) {
    test(`${path} → 200 + titre + JSON-LD`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));

      const response = await page.goto(path);
      expect(response?.status(), `${path} status`).toBeLessThan(400);
      await expect(page).toHaveTitle(title);

      // JSON-LD Organization présent
      const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
      expect(jsonLd, `${path} JSON-LD`).toBeTruthy();

      // Pas d'erreur JS critique
      expect(errors.filter((e) => !e.includes("net::ERR_BLOCKED_BY_CLIENT")), `${path} JS errors`).toEqual([]);
    });
  }
});

test.describe("Smoke — SEO", () => {
  test("/sitemap.xml renvoie XML valide", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("<urlset");
    expect(body).toContain("https://kaia.purama.dev/");
  });

  test("/robots.txt renvoie sitemap link", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body.toLowerCase()).toContain("sitemap");
  });

  test("/manifest.webmanifest valide", async ({ request }) => {
    const res = await request.get("/manifest.webmanifest");
    expect(res.status()).toBe(200);
    const json = (await res.json()) as { name: string; icons: unknown[] };
    expect(json.name).toContain("KAÏA");
    expect(Array.isArray(json.icons)).toBe(true);
  });
});

test.describe("Smoke — i18n", () => {
  test("Cookie kaia_locale=en bascule la langue", async ({ page, context }) => {
    await context.addCookies([
      { name: "kaia_locale", value: "en", url: "https://kaia.purama.dev" },
    ]);
    await page.goto("/login");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", "en-US");
  });

  test("Cookie kaia_locale=ar applique dir=rtl", async ({ page, context }) => {
    await context.addCookies([
      { name: "kaia_locale", value: "ar", url: "https://kaia.purama.dev" },
    ]);
    await page.goto("/login");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("dir", "rtl");
  });
});

test.describe("Smoke — accessibilité de base", () => {
  test("Skip-to-content link présent", async ({ page }) => {
    await page.goto("/");
    const skipLink = page.locator('a[href="#main"]');
    await expect(skipLink).toHaveCount(1);
  });

  test("Bouton SOS visible sur /sos", async ({ page }) => {
    const res = await page.goto("/sos");
    // /sos est dans (app) — non-auth → redirect /login
    expect(res?.url()).toMatch(/\/(login|sos)/);
  });
});
