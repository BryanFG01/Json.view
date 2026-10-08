import { expect, test } from "@playwright/test";
import { leftPane } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("al pararse en una llave marca apertura, cierre y el bloque en la numeración", async ({ page }) => {
  const pane = leftPane(page);
  await pane.getByRole("button", { name: "Cargar ejemplo" }).click();
  const gutter = pane.locator(".cm-lineNumbers .cm-gutterElement");

  // Línea 6: `"autor": {` → clic justo después de la llave.
  const line6 = pane.locator(".cm-line").nth(5);
  await line6.click();
  await page.keyboard.press("End");

  // `(\s|$)` evita aceptar la variante suave (`cm-scope-edge-soft`).
  await expect(gutter.filter({ hasText: /^6$/ })).toHaveClass(/cm-scope-edge(\s|$)/);
  await expect(gutter.filter({ hasText: /^9$/ })).toHaveClass(/cm-scope-edge(\s|$)/);
  await expect(gutter.filter({ hasText: /^7$/ })).toHaveClass(/cm-scope-mid(\s|$)/);
  await expect(pane.locator(".cm-matchingBracket")).toHaveCount(2);
  await expect(pane.getByText("Bloque: líneas 6–9")).toBeVisible();

  await page.keyboard.press("ControlOrMeta+Shift+Backslash");
  await expect(gutter.filter({ hasText: /^9$/ })).toHaveClass(/cm-activeLineGutter/);

  // Dentro del bloque, sin estar sobre una llave: marca suave del bloque que lo contiene.
  await pane.locator(".cm-line").nth(6).click();
  await expect(gutter.filter({ hasText: /^6$/ })).toHaveClass(/cm-scope-edge-soft/);
});

test("copia solo un bloque desde el editor y un nodo desde el árbol", async ({ page }) => {
  const pane = leftPane(page);
  await pane.getByRole("button", { name: "Cargar ejemplo" }).click();
  // En Windows el portapapeles devuelve saltos de línea \r\n: se normalizan para comparar.
  const clipboard = () => page.evaluate(async () => (await navigator.clipboard.readText()).replace(/\r\n/g, "\n"));

  // Editor: cursor junto a la llave de "autor" (línea 6) → "Copiar bloque".
  await pane.locator(".cm-line").nth(5).click();
  await page.keyboard.press("End");
  await pane.getByRole("button", { name: "Copiar bloque" }).click();
  await expect.poll(clipboard).toBe('{\n  "nombre": "Ada Lovelace",\n  "email": "ada@example.com"\n}');

  // Árbol: botón de copiar de la fila "etiquetas" (copiar no debe plegar/desplegar el nodo).
  await pane.getByRole("tab", { name: "Árbol" }).click();
  const etiquetas = pane.getByRole("button", { name: 'Copiar "etiquetas"' });
  await etiquetas.hover();
  await etiquetas.click();
  await expect.poll(clipboard).toBe('[\n  "json",\n  "formatter",\n  "validator"\n]');
  await expect(pane.getByText('"formatter"')).toBeVisible();

  // Un texto se copia sin comillas.
  await pane.getByRole("button", { name: 'Copiar "proyecto"' }).click();
  await expect.poll(clipboard).toBe("JSON Viewer");
});

test("los iconos muestran rápido un tooltip que explica qué hacen", async ({ page }) => {
  const pane = leftPane(page);
  const tooltip = page.getByRole("tooltip");
  const formatear = pane.locator('[data-tip="Formatear"]');

  // Desactivado (panel vacío): explica por qué.
  await formatear.hover();
  await expect(tooltip).toContainText("Necesita un JSON válido", { timeout: 600 });

  // Activo: explicación y atajo. El retardo real es 150 ms; el margen cubre lo que tarda Playwright
  // en mover el ratón con la máquina cargada (el tooltip nativo del navegador tarda ~1 s o más).
  await pane.getByRole("button", { name: "Cargar ejemplo" }).click();
  await page.mouse.move(0, 400);
  await expect(tooltip).toHaveCount(0);
  const start = Date.now();
  await formatear.hover();
  await expect(tooltip).toContainText("Indenta el JSON", { timeout: 600 });
  expect(Date.now() - start).toBeLessThan(800);
  await expect(tooltip).toContainText("Shift+Alt+F");

  // Pasar a otro icono cambia el tooltip al instante.
  await pane.locator('[data-tip="Minificar"]').hover();
  await expect(tooltip).toContainText("una sola línea", { timeout: 300 });
});
