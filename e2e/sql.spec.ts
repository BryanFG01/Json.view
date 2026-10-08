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

test("una consulta de SQL Server (@variables, FORMAT, OVER) detecta el dialecto y se formatea sin error", async ({ page }) => {
  const pane = leftPane(page);
  const query =
    "SELECT COUNT(*) OVER() AS dsd_total_rows, FORMAT(h.created_at, 'dd/MM/yyyy HH:mm:ss') created_at , h.document " +
    "FROM header h WITH (NOLOCK) WHERE (@seller IS NULL OR h.seller_id = @seller) ORDER BY h.created_at DESC";
  await page.evaluate((q) => navigator.clipboard.writeText(q), query);
  await pane.locator(".cm-content").click();
  await page.keyboard.press("ControlOrMeta+V");

  await expect.poll(() => editorText(pane)).toContain("\nFROM\n  header h WITH (NOLOCK)\nWHERE\n");
  await expect(pane.getByRole("alert")).toHaveCount(0);
  await expect(pane.getByText("Dialecto: SQL Server (detectado)")).toBeVisible();
  await expect(pane.getByRole("combobox", { name: "Dialecto SQL" })).toHaveValue("tsql");
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

  await pane.locator('[data-tip="Ordenar"]').hover();
  await expect(page.getByRole("tooltip")).toContainText("Solo disponible en modo JSON");
});

test("en SQL: minificar a una línea, escapar como texto '…' para un INSERT y desescapar", async ({ page }) => {
  const pane = leftPane(page);
  await pane.getByRole("button", { name: "Modo SQL" }).click();
  await typeJson(pane, "select nombre from clientes where apodo = 'O''Brien'");
  await pane.getByRole("button", { name: "Formatear", exact: true }).click();
  await expect.poll(() => editorText(pane)).toContain("\nFROM\n");

  await pane.getByRole("button", { name: "Minificar" }).click();
  await expect.poll(() => editorText(pane)).toBe("SELECT nombre FROM clientes WHERE apodo = 'O''Brien'");

  await pane.getByRole("button", { name: "Escapar como texto SQL" }).click();
  await expect.poll(() => editorText(pane)).toBe("'SELECT nombre FROM clientes WHERE apodo = ''O''''Brien'''");

  await pane.getByRole("button", { name: "Desescapar texto" }).click();
  await expect.poll(() => editorText(pane)).toBe("SELECT nombre FROM clientes WHERE apodo = 'O''Brien'");
});

test("comparar dos consultas SQL normaliza el formato y solo marca cambios reales", async ({ page }) => {
  await page.getByRole("button", { name: "Dividir pantalla" }).click();
  for (const [pane, query] of [
    [leftPane(page), "select id, nombre from clientes where activo = 1"],
    [rightPane(page), "SELECT id,   nombre, email\nFROM clientes   WHERE activo = 1"],
  ] as const) {
    await pane.getByRole("button", { name: "Modo SQL" }).click();
    await typeJson(pane, query);
  }
  await page.getByRole("button", { name: "Comparar" }).click();

  await expect(page.getByLabel("Normalizar formato SQL")).toBeChecked();
  await expect(page.getByText("+2", { exact: true })).toBeVisible();
  await expect(page.getByText("−1", { exact: true })).toBeVisible();
  await expect(page.getByText(/no es válido/)).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "Orden de las claves" })).toHaveCount(0);

  // Normalizado: una fila por línea formateada (SELECT, id, nombre, email, FROM, clientes, WHERE) y la última
  // ("activo = 1", a más de 3 líneas del cambio) queda colapsada en "Mostrar 1 de 1 líneas sin cambios".
  const rows = page.locator(".grid.grid-cols-2");
  await expect(rows).toHaveCount(7);
  await expect(page.getByRole("button", { name: /líneas sin cambios/ })).toBeVisible();

  // Sin normalizar se compara el texto tal cual: 1 línea contra 2, ninguna igual.
  await page.getByLabel("Normalizar formato SQL").uncheck();
  await expect(rows).toHaveCount(2);
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
