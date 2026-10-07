import { expect, test } from "@playwright/test";
import { editorText, leftPane, rightPane, typeJson } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

const QUERY = "select id, nombre from clientes where activo = 1 order by nombre";
const FORMATTED = "SELECT\n  id,\n  nombre\nFROM\n  clientes\nWHERE\n  activo = 1\nORDER BY\n  nombre";

test("pegar una consulta SQL activa el modo SQL y la formatea sola", async ({ page }) => {
  const pane = leftPane(page);
  await page.evaluate((q) => navigator.clipboard.writeText(q), QUERY);
  await pane.locator(".cm-content").click();
  await page.keyboard.press("ControlOrMeta+V");

  await expect.poll(() => editorText(pane)).toBe(FORMATTED);
  await expect(pane.getByRole("button", { name: "Modo SQL" })).toHaveAttribute("aria-pressed", "true");
  await expect(pane.getByText("Dialecto: SQL estándar")).toBeVisible();
  await expect(pane.getByRole("tab", { name: "Árbol" })).toBeDisabled();
  await expect(pane.getByRole("alert")).toHaveCount(0);
});

test("si se escribe SQL en modo JSON, el aviso ofrece cambiar a SQL y Formatear lo ordena", async ({ page }) => {
  const pane = leftPane(page);
  await typeJson(pane, QUERY);
  await expect(pane.getByText("JSON inválido")).toBeVisible();

  await pane.getByRole("button", { name: "Parece SQL: cambiar a modo SQL" }).click();
  await expect(pane.getByRole("alert")).toHaveCount(0);
  await pane.getByRole("button", { name: "Formatear", exact: true }).click();
  await expect.poll(() => editorText(pane)).toBe(FORMATTED);

  // Cambiar la sangría reformatea; deshacer vuelve atrás.
  await pane.getByLabel("Sangría").selectOption("4");
  await expect.poll(() => editorText(pane)).toContain("\n    id,");
  await pane.getByRole("button", { name: "Deshacer" }).click();
  await expect.poll(() => editorText(pane)).toBe(FORMATTED);
});

test("el dialecto se aplica al formatear y las acciones de JSON explican que no aplican", async ({ page }) => {
  const pane = leftPane(page);
  await pane.getByRole("button", { name: "Modo SQL" }).click();
  await typeJson(pane, "select top 5 [nombre] from clientes");
  await pane.getByRole("combobox", { name: "Dialecto SQL" }).selectOption("tsql");
  await expect.poll(() => editorText(pane)).toBe("SELECT\n  TOP 5 [nombre]\nFROM\n  clientes");

  await pane.locator('[data-tip="Minificar"]').hover();
  await expect(page.getByRole("tooltip")).toContainText("Solo disponible en modo JSON");
});

test("sube un .sql, lo detecta y lo descarga como consulta.sql", async ({ page }) => {
  const pane = leftPane(page);
  await pane.locator('input[type="file"]').setInputFiles({
    name: "reporte.sql",
    mimeType: "application/sql",
    buffer: Buffer.from("update pedidos set estado = 'ok' where id = 7"),
  });
  await expect(pane.getByRole("button", { name: "Modo SQL" })).toHaveAttribute("aria-pressed", "true");

  const download = page.waitForEvent("download");
  await pane.getByRole("button", { name: "Descargar" }).click();
  expect((await download).suggestedFilename()).toBe("consulta.sql");
});

test("con la pantalla dividida, cada panel tiene su propio modo", async ({ page }) => {
  await page.getByRole("button", { name: "Dividir pantalla" }).click();
  await leftPane(page).getByRole("button", { name: "Cargar ejemplo" }).click();
  await rightPane(page).getByRole("button", { name: "Modo SQL" }).click();
  await rightPane(page).getByRole("button", { name: "Cargar ejemplo" }).click();

  await expect(leftPane(page).getByText("JSON válido")).toBeVisible();
  await expect.poll(() => editorText(rightPane(page))).toMatch(/^SELECT\n/);
  await expect(rightPane(page).locator("footer").getByText(/^SQL$/)).toBeVisible();
});
