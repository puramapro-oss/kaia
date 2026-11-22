import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin === "http://127.0.0.1:4185") return route.continue();
    if (url.href === "https://demotiles.maplibre.org/style.json") {
      return route.fulfill({ json: { version: 8, sources: {}, layers: [{ id: "background", type: "background", paint: { "background-color": "#102030" } }] } });
    }
    if (url.origin === "https://tile.openstreetmap.org") {
      return route.fulfill({ contentType: "image/png", body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGMQUDD4DwACBAFgjby7cQAAAABJRU5ErkJggg==", "base64") });
    }
    if (url.origin === "https://fonts.openmaptiles.org") return route.fulfill({ contentType: "application/x-protobuf", body: Buffer.alloc(0) });
    throw new Error(`Unplanned provider request: ${url.origin}`);
  });
});

test("both actual components use MapLibre 6 and its real same-origin ESM worker", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const worker = page.waitForEvent("worker", { predicate: value => value.url().endsWith("/vendor/maplibre-gl-6.19.0/worker.mjs") });
  await page.goto("/");
  expect((await worker).url()).toBe("http://127.0.0.1:4185/vendor/maplibre-gl-6.19.0/worker.mjs");
  await expect(page.locator(".maplibregl-canvas")).toHaveCount(2);
  expect(await page.locator(".maplibregl-canvas").evaluateAll(canvases => canvases.every(canvas => Boolean((canvas as HTMLCanvasElement).getContext("webgl2"))))).toBe(true);
  await expect(page.getByTestId("world")).toContainText("1 point");
  await expect(page.getByTestId("terra").locator(".maplibregl-marker")).toHaveCount(1);
  const marker = page.getByTestId("terra").locator(".maplibregl-marker");
  const previousPosition = await marker.getAttribute("style");
  await page.getByRole("button", { name: "Déplacer le nœud" }).click();
  await expect.poll(() => marker.getAttribute("style")).not.toBe(previousPosition);
  await page.getByRole("button", { name: "Ajouter un point" }).click();
  await expect(page.getByTestId("world")).toContainText("2 points");
  await page.getByRole("button", { name: "Démonter les cartes" }).click();
  await expect(page.locator(".maplibregl-canvas, .maplibregl-marker")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("both actual components show their fallback when WebGL2 is unavailable", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(`
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(kind, ...args) {
      return kind === 'webgl2' ? null : original.call(this, kind, ...args);
    };
  `);
  await page.goto("/");
  await expect(page.getByRole("alert")).toHaveCount(2);
  for (const name of ["world", "terra"]) await expect(page.getByTestId(name).getByRole("alert")).toHaveText("La carte ne peut pas s’afficher sur cet appareil.");
  await page.getByRole("button", { name: "Démonter les cartes" }).click();
  expect(errors).toEqual([]);
});
