import { expect, test, type Locator } from "@playwright/test";
import { editorText, leftPane, rightPane } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

const searchBar = (pane: Locator) => pane.getByRole("search", { name: "Buscar en el JSON" });
const searchInput = (pane: Locator) => searchBar(pane).getByRole("textbox", { name: "Buscar", exact: true });

test("Ctrl+F abre el buscador dentro del editor, con contador y navegación", async ({ page }) => {
  const pane = leftPane(page);
  await pane.getByRole("button", { name: "Cargar ejemplo" }).click();
  await pane.locator(".cm-content").click();
  await page.keyboard.press("ControlOrMeta+F");

  await expect(searchBar(pane)).toBeVisible();
  await expect(searchInput(pane)).toBeFocused();
  await page.keyboard.type("nombre");
  await expect(searchBar(pane)).toContainText("4 resultados");
  await expect(pane.locator(".cm-searchMatch")).toHaveCount(4);

  await page.keyboard.press("Enter");
  await expect(searchBar(pane)).toContainText(/\d de 4/);
  await expect(pane.locator(".cm-searchMatch-selected")).toHaveCount(1);

  await page.keyboard.type("zzz");
  await expect(searchBar(pane)).toContainText("Sin resultados");

  await page.keyboard.press("Escape");
  await expect(searchBar(pane)).toHaveCount(0);
});

test("con la pantalla dividida, cada panel tiene su propio buscador", async ({ page }) => {
  await page.getByRole("button", { name: "Dividir pantalla" }).click();
  const left = leftPane(page);
  const right = rightPane(page);
  await left.getByRole("button", { name: "Cargar ejemplo" }).click();
  await right.getByRole("button", { name: "Cargar ejemplo" }).click();

  await left.locator(".cm-content").click();
  await page.keyboard.press("ControlOrMeta+F");
  await page.keyboard.type("proyecto");

  // Ctrl+F con el foco en la barra del panel derecho (fuera del editor) abre el buscador de ESE panel.
  await right.getByRole("button", { name: "Copiar", exact: true }).focus();
  await page.keyboard.press("ControlOrMeta+F");
  await expect(searchInput(right)).toBeFocused();
  await page.keyboard.type("activo");

  await expect(searchInput(left)).toHaveValue("proyecto");
  await expect(searchInput(right)).toHaveValue("activo");
  await expect(searchBar(left)).toContainText("1 resultados");
  await expect(searchBar(right)).toContainText("3 resultados");
});

test("en la vista Árbol, Ctrl+F vuelve al editor y abre el buscador; el botón Buscar también", async ({ page }) => {
  const pane = leftPane(page);
  await pane.getByRole("button", { name: "Cargar ejemplo" }).click();
  await pane.getByRole("tab", { name: "Árbol" }).click();
  await pane.getByRole("tab", { name: "Árbol" }).focus();
  await page.keyboard.press("ControlOrMeta+F");
  await expect(pane.getByRole("tab", { name: "Editor" })).toHaveAttribute("aria-selected", "true");
  await expect(searchInput(pane)).toBeFocused();

  await page.keyboard.press("Escape");
  await pane.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(searchInput(pane)).toBeFocused();
});

test("Ctrl+H reemplaza todas las coincidencias", async ({ page }) => {
  const pane = leftPane(page);
  await pane.getByRole("button", { name: "Cargar ejemplo" }).click();
  await pane.locator(".cm-content").click();
  await page.keyboard.press("ControlOrMeta+H");
  await searchInput(pane).fill("true");
  await searchBar(pane).getByRole("textbox", { name: "Reemplazar por…" }).fill("false");
  await searchBar(pane).getByRole("button", { name: "Reemplazar todos" }).click();

  await expect.poll(() => editorText(pane)).not.toContain("true");
  await expect(pane.getByText("JSON válido")).toBeVisible();
});
