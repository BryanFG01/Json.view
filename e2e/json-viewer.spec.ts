import { expect, test } from "@playwright/test";
import { editorText, leftPane, rightPane, typeJson } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("valida en vivo y ubica el error", async ({ page }) => {
  const pane = leftPane(page);
  await typeJson(pane, '{"a": 1,}');
  await expect(pane.getByText("JSON inválido")).toBeVisible();
  await expect(pane.getByRole("alert")).toContainText("Línea 1, columna 9");
  await expect(pane.locator(".cm-error-line")).toHaveCount(1);

  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Backspace");
  await expect(pane.getByText("JSON válido")).toBeVisible();
  await expect(pane.getByRole("alert")).toHaveCount(0);
});

test("formatea y permite plegar bloques", async ({ page }) => {
  const pane = leftPane(page);
  await typeJson(pane, '{"a":1,"b":[1,2]}');
  await pane.getByRole("button", { name: /^Formatear/ }).click();
  expect(await editorText(pane)).toBe('{\n  "a": 1,\n  "b": [\n    1,\n    2\n  ]\n}');

  await pane.getByTitle("Plegar bloque", { exact: true }).first().click();
  await expect(pane.locator(".cm-foldPlaceholder")).toBeVisible();
  await expect(pane.locator(".cm-line")).toHaveCount(1);
});

test("deshacer y rehacer cruzan escritura y acciones de la barra", async ({ page }) => {
  const pane = leftPane(page);
  await typeJson(pane, '{"a":1}');
  await pane.getByRole("button", { name: /^Formatear/ }).click();
  await expect.poll(() => editorText(pane)).toBe('{\n  "a": 1\n}');

  await pane.getByRole("button", { name: /^Deshacer/ }).click();
  await expect.poll(() => editorText(pane)).toBe('{"a":1}');

  await pane.locator(".cm-content").click();
  await page.keyboard.press("ControlOrMeta+Y");
  await expect.poll(() => editorText(pane)).toBe('{\n  "a": 1\n}');
  await page.keyboard.press("ControlOrMeta+Z");
  await expect.poll(() => editorText(pane)).toBe('{"a":1}');
});

test("pegar en el editor vacío formatea", async ({ page }) => {
  const pane = leftPane(page);
  await page.evaluate(() => navigator.clipboard.writeText('{"x":[true,null]}'));
  await pane.locator(".cm-content").click();
  await page.keyboard.press("ControlOrMeta+V");
  await expect.poll(() => editorText(pane)).toBe('{\n  "x": [\n    true,\n    null\n  ]\n}');
});

test("divide la pantalla en dos paneles independientes", async ({ page }) => {
  await expect(rightPane(page)).toHaveCount(0);
  await page.getByRole("button", { name: "Dividir pantalla" }).click();
  await typeJson(leftPane(page), "[1]");
  await typeJson(rightPane(page), '{"b":2}');
  expect(await editorText(leftPane(page))).toBe("[1]");
  expect(await editorText(rightPane(page))).toBe('{"b":2}');
});

test("compara dos JSON y sale con Esc", async ({ page }) => {
  await page.getByRole("button", { name: "Dividir pantalla" }).click();
  await typeJson(leftPane(page), '{"a":1,"b":2}');
  await typeJson(rightPane(page), '{"a":1,"b":3}');
  await page.getByRole("button", { name: "Comparar" }).click();

  await expect(page.getByText("Diferencias")).toBeVisible();
  await expect(page.getByText("+1", { exact: true })).toBeVisible();
  await expect(page.getByText("−1", { exact: true })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(leftPane(page)).toBeVisible();
});

test("ordena el JSON de un panel: claves en orden natural y arrays por número", async ({ page }) => {
  await page.getByRole("button", { name: "Dividir pantalla" }).click();
  const pane = rightPane(page);
  await typeJson(pane, '{"item10":1,"b":[10,9,100],"item2":2}');

  await pane.getByRole("button", { name: "Ordenar" }).click();
  await page.getByRole("menuitem", { name: /Claves A → Z y arrays/ }).click();
  await expect.poll(() => editorText(pane)).toBe(
    '{\n  "b": [\n    9,\n    10,\n    100\n  ],\n  "item2": 2,\n  "item10": 1\n}',
  );
  await expect(page.getByRole("menu")).toHaveCount(0);

  await pane.getByRole("button", { name: /^Deshacer/ }).click();
  await expect.poll(() => editorText(pane)).toBe('{"item10":1,"b":[10,9,100],"item2":2}');
});

test("al comparar, ordenar claves y arrays deja iguales JSON con distinto orden", async ({ page }) => {
  await page.getByRole("button", { name: "Dividir pantalla" }).click();
  await typeJson(leftPane(page), '{"b":[3,1,2],"a":1}');
  await typeJson(rightPane(page), '{"a":1,"b":[1,2,3]}');
  await page.getByRole("button", { name: "Comparar" }).click();
  await expect(page.getByText("Los dos JSON son idénticos.")).toHaveCount(0);

  await page.getByRole("combobox", { name: "Orden de las claves" }).selectOption("asc");
  await expect(page.getByText("Los dos JSON son idénticos.")).toHaveCount(0);
  await page.getByLabel(/Ordenar arrays/).check();
  await expect(page.getByText("Los dos JSON son idénticos.")).toBeVisible();
});

test("sube un archivo JSON", async ({ page }) => {
  const pane = leftPane(page);
  await pane.locator('input[type="file"]').setInputFiles({
    name: "datos.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"desde":"archivo"}'),
  });
  await expect.poll(() => editorText(pane)).toBe('{"desde":"archivo"}');
});

test("comparte por enlace y lo vuelve a abrir", async ({ page, context }) => {
  await typeJson(leftPane(page), '{"compartido":true}');
  await leftPane(page).getByRole("button", { name: "Copiar enlace para compartir" }).click();
  await expect(page).toHaveURL(/#.+/);

  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toBe(page.url());

  const other = await context.newPage();
  await other.goto(copied);
  await expect.poll(() => editorText(leftPane(other))).toBe('{"compartido":true}');
});
