import { expect, test } from "@playwright/test";
import { editorText, leftPane, rightPane, typeJson } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
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

test("ordena un array de objetos anidado por un campo, descendente", async ({ page }) => {
  const pane = leftPane(page);
  await pane.getByRole("button", { name: "Cargar ejemplo" }).click();
  await pane.getByRole("button", { name: "Ordenar" }).click();

  const menu = page.getByRole("menu", { name: "Ordenar JSON" });
  await menu.getByLabel("Campo para ordenar").selectOption("prioridad");
  await menu.getByRole("button", { name: "Ascendente" }).click();
  await menu.getByRole("menuitem", { name: "Ordenar" }).click();

  const json = JSON.parse(await editorText(pane));
  expect(json.caracteristicas.map((c: { nombre: string }) => c.nombre)).toEqual(["Árbol", "Formatear", "Validar"]);
  expect(Object.keys(json)[0]).toBe("proyecto");
});

test("ordena solo el bloque del cursor sin tocar el resto", async ({ page }) => {
  const pane = leftPane(page);
  await pane.getByRole("button", { name: "Cargar ejemplo" }).click();
  // Cursor junto a la llave de "autor" (línea 6).
  await pane.locator(".cm-line").nth(5).click();
  await page.keyboard.press("End");

  await pane.getByRole("button", { name: "Ordenar" }).click();
  const menu = page.getByRole("menu", { name: "Ordenar JSON" });
  await menu.getByLabel(/Solo el bloque del cursor \(Líneas 6–9\)/).check();
  // A→Z sí cambia el orden de "autor" (nombre, email → email, nombre); las claves de la raíz no deben moverse.
  await menu.getByRole("menuitem", { name: /^Claves A → Z item2/ }).click();

  const text = await editorText(pane);
  const json = JSON.parse(text);
  expect(Object.keys(json.autor)).toEqual(["email", "nombre"]);
  expect(Object.keys(json)).toEqual(["proyecto", "version", "publico", "licencia", "autor", "etiquetas", "caracteristicas", "estadisticas"]);
  expect(text).toContain('  "autor": {\n    "email": "ada@example.com",\n    "nombre": "Ada Lovelace"\n  },');
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
