import { expect, test, type Page } from "@playwright/test";
import { leftPane, rightPane } from "./helpers";

// Mide cada operación con JSON de distintos tamaños y falla si alguna supera el límite.
const SIZES = [10_000, 100_000, 500_000, 1_000_000];
const LIMIT_MS = 15_000;

function buildJson(targetLines: number, variant = 0): string {
  const rows = Array.from({ length: Math.ceil(targetLines / 9) }, (_, i) => ({
    id: i, nombre: `cliente_${i}`, activo: i % 2 === 0, saldo: i * 1.5, ciudad: "Bogotá",
    tags: [`t${i % 7}`], nota: i === 3 ? variant : null,
  }));
  return JSON.stringify(rows, null, 2);
}

/** Espera a que el hilo principal termine el trabajo pendiente y pinte dos cuadros. */
const settle = (page: Page) =>
  page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null)))));

async function time(page: Page, action: () => Promise<unknown>): Promise<number> {
  const start = Date.now();
  await action();
  await settle(page);
  return Date.now() - start;
}

async function upload(page: Page, pane: ReturnType<typeof leftPane>, text: string) {
  await pane.locator('input[type="file"]').setInputFiles({
    name: "big.json", mimeType: "application/json", buffer: Buffer.from(text),
  });
  await pane.getByText("JSON válido").waitFor();
}

for (const size of SIZES) {
  test(`JSON de ${size.toLocaleString("es")} líneas`, async ({ page }) => {
    test.setTimeout(600_000);
    page.setDefaultTimeout(120_000);
    const text = buildJson(size);
    await page.goto("/");
    const left = leftPane(page);
    const t: Record<string, number> = {};

    t.abrir = await time(page, () => upload(page, left, text));
    await left.locator(".cm-content").click();
    t.teclear = await time(page, async () => {
      for (let i = 0; i < 5; i++) await page.keyboard.insertText(" ");
    });
    t.ordenar = await time(page, async () => {
      await left.getByRole("button", { name: "Ordenar" }).click();
      await page.getByRole("menuitem", { name: /Claves A → Z y arrays/ }).click();
    });
    t.minificar = await time(page, () => left.getByRole("button", { name: "Minificar" }).click());
    t.deshacer = await time(page, () => left.getByRole("button", { name: /^Deshacer/ }).click());
    t.arbol = await time(page, async () => {
      await left.getByRole("tab", { name: "Árbol" }).click();
      await left.getByRole("button", { name: "Expandir todo" }).waitFor();
    });
    await left.getByRole("tab", { name: "Editor" }).click();
    await page.getByRole("button", { name: "Dividir pantalla" }).click();
    await upload(page, rightPane(page), buildJson(size, 1));
    t.comparar = await time(page, async () => {
      await page.getByRole("button", { name: "Comparar" }).click();
      await page.getByText("Diferencias").waitFor();
    });

    const heapMB = await page.evaluate(
      () => Math.round(((performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? 0) / 1048576),
    );
    console.log(`${size} líneas (${(text.length / 1048576).toFixed(1)} MB) → ${JSON.stringify(t)} heap=${heapMB}MB`);
    for (const [name, ms] of Object.entries(t)) expect.soft(ms, name).toBeLessThan(LIMIT_MS);
  });
}
