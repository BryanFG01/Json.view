import { expect, test } from "@playwright/test";
import { editorText, leftPane, typeJson } from "./helpers";

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

  await pane.getByLabel("Plegar bloque", { exact: true }).first().click();
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

test("autocierra llaves, corchetes y comillas al teclear", async ({ page }) => {
  const pane = leftPane(page);
  await pane.locator(".cm-content").click();

  // Tecla a tecla, como una persona: cada apertura añade su cierre y el cierre escrito se "salta".
  await page.keyboard.type('{"a');
  expect(await editorText(pane)).toBe('{"a"}');
  await page.keyboard.type('": [1');
  expect(await editorText(pane)).toBe('{"a": [1]}');
  await page.keyboard.type("]}");
  expect(await editorText(pane)).toBe('{"a": [1]}');
  await expect(pane.getByText("JSON válido")).toBeVisible();

  // Backspace sobre un par vacío borra los dos.
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.press("Delete");
  await page.keyboard.type("[");
  expect(await editorText(pane)).toBe("[]");
  await page.keyboard.press("Backspace");
  expect(await editorText(pane)).toBe("");

  // Enter entre llaves abre el bloque con sangría.
  await page.keyboard.type("{");
  await page.keyboard.press("Enter");
  expect(await editorText(pane)).toBe("{\n  \n}");

  // Con texto seleccionado, la comilla lo envuelve.
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("hola");
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type('"');
  expect(await editorText(pane)).toBe('"hola"');
});

test("pegar en el editor vacío formatea", async ({ page }) => {
  const pane = leftPane(page);
  await page.evaluate(() => navigator.clipboard.writeText('{"x":[true,null]}'));
  await pane.locator(".cm-content").click();
  await page.keyboard.press("ControlOrMeta+V");
  await expect.poll(() => editorText(pane)).toBe('{\n  "x": [\n    true,\n    null\n  ]\n}');
});
