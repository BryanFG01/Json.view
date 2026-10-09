// Genera las capturas del README (docs/screenshots) contra un build de producción.
// Uso: npm run build && npx next start -p 3230   y luego   npx tsx scripts/readme-screenshots.mts
import { mkdirSync } from "node:fs";
import { chromium, type Page } from "@playwright/test";
import { SAMPLE_JSON } from "../src/features/json-viewer/presentation/utils/sampleJson";
import { flutterLikeDb } from "../test/fixtures";

const BASE = process.argv[2] ?? "http://localhost:3230";
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1360, height: 720 }, deviceScaleFactor: 1, permissions: ["clipboard-read", "clipboard-write"] });

async function open(theme: "dark" | "light" = "dark"): Promise<Page> {
  const page = await context.newPage();
  await page.addInitScript((t) => localStorage.setItem("json-viewer-theme", t), theme);
  await page.goto(BASE);
  return page;
}
const pane = (page: Page, name: "Panel izquierdo" | "Panel derecho") => page.getByRole("region", { name });
const shot = async (page: Page, file: string) => {
  await page.mouse.move(0, 700);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${file}` });
  await page.close();
};

// 1) Portada: JSON a la izquierda (bloque del cursor marcado) y SQL formateado a la derecha.
{
  const page = await open();
  await page.getByRole("button", { name: "Dividir pantalla" }).click();
  const left = pane(page, "Panel izquierdo");
  await left.getByRole("button", { name: "Cargar ejemplo" }).click();
  await left.locator('.cm-content[aria-label="Editor JSON"] .cm-line').nth(14).click();
  await page.keyboard.press("End");
  const right = pane(page, "Panel derecho");
  await right.getByRole("button", { name: "Modo SQL" }).click();
  await right.getByRole("button", { name: "Cargar ejemplo" }).click();
  await shot(page, "editor-json-sql.png");
}

// 2) Comparar: el mismo ejemplo con otro orden de claves y 3 cambios reales; con "Claves A → Z"
//    solo se marcan los cambios de verdad.
{
  const page = await open();
  await page.getByRole("button", { name: "Dividir pantalla" }).click();
  await pane(page, "Panel izquierdo").getByRole("button", { name: "Cargar ejemplo" }).click();
  const sample = JSON.parse(SAMPLE_JSON);
  const changed = {
    ...sample,
    version: 1.3,
    etiquetas: [...sample.etiquetas, "sql"],
    estadisticas: { ...sample.estadisticas, usuarios: 18900 },
  };
  const reordered = Object.fromEntries(Object.entries(changed).reverse());
  const right = pane(page, "Panel derecho");
  await right.locator('.cm-content[aria-label="Editor JSON"]').click();
  await page.keyboard.insertText(JSON.stringify(reordered));
  await right.getByRole("button", { name: "Formatear", exact: true }).click();
  await page.getByRole("button", { name: "Comparar" }).click();
  await page.getByRole("combobox", { name: "Orden de las claves" }).selectOption("asc");
  await shot(page, "comparar.png");
}

// 3) Base SQLite (como la de una app Flutter) con autocompletado de columnas.
{
  const page = await open();
  const left = pane(page, "Panel izquierdo");
  await left.locator('input[type="file"]').setInputFiles({ name: "app_flutter.db", mimeType: "application/octet-stream", buffer: Buffer.from(flutterLikeDb()) });
  await page.getByLabel("Consulta SQL").click();
  await page.keyboard.press("Control+A");
  await page.keyboard.type("SELECT c.nombre, p.foto, p.sync_id FROM pedidos p JOIN clientes c ON c.");
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/sqlite.png` });
  await page.close();
}

// 4) Vista Árbol y menú Ordenar, en tema claro.
{
  const page = await open("light");
  const left = pane(page, "Panel izquierdo");
  await left.getByRole("button", { name: "Cargar ejemplo" }).click();
  await left.getByRole("tab", { name: "Árbol" }).click();
  await left.getByRole("button", { name: "Ordenar" }).click();
  await page.getByRole("menu").getByLabel("Campo para ordenar").selectOption("prioridad");
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/arbol-ordenar.png` });
  await page.close();
}

await browser.close();
console.log("capturas en", OUT);
