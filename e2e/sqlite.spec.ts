import { expect, test } from "@playwright/test";
import { flutterLikeDb, makeZip, walDb } from "../test/fixtures";
import { editorText, leftPane } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

const asBuffer = (bytes: Uint8Array) => Buffer.from(bytes);

test("abre un .db de Flutter: tablas, filas como JSON, consulta propia y esquema", async ({ page }) => {
  const pane = leftPane(page);
  await pane.locator('input[type="file"]').setInputFiles({ name: "app.db", mimeType: "application/octet-stream", buffer: asBuffer(flutterLikeDb()) });

  const bar = pane.getByRole("region", { name: "Base de datos SQLite" });
  await expect(bar).toContainText("app.db · 3 tablas · 1 vista · versión 3");
  // Se abre la primera tabla útil (se salta android_metadata) como JSON.
  await expect(bar.getByLabel("Tabla o vista")).toHaveValue("clientes");
  await expect.poll(async () => JSON.parse(await editorText(pane))).toEqual([
    { id: 1, nombre: "Ñandú Pérez", saldo: 10.5 },
    { id: 2, nombre: "Ana", saldo: 0 },
  ]);
  await expect(pane.getByText("JSON válido")).toBeVisible();

  // Consulta propia con Ctrl+Enter: BLOB en base64 y entero grande exacto.
  await bar.getByLabel("Consulta SQL").fill("SELECT c.nombre, p.foto, p.sync_id FROM pedidos p JOIN clientes c ON c.id = p.cliente_id");
  await bar.getByLabel("Consulta SQL").press("ControlOrMeta+Enter");
  await expect.poll(async () => JSON.parse(await editorText(pane))).toEqual([
    { nombre: "Ñandú Pérez", foto: { blob: "iVBORw==", bytes: 4 }, sync_id: "9007199254740993" },
  ]);
  await expect(bar.getByRole("status")).toContainText("1 fila");

  // Error de SQL legible, sin borrar el resultado anterior.
  await bar.getByLabel("Consulta SQL").fill("SELECT * FROM no_existe");
  await bar.getByRole("button", { name: "Ejecutar" }).click();
  await expect(bar.getByRole("status")).toContainText("Error de SQL: no such table: no_existe");

  // Esquema: CREATE formateados en modo SQL.
  await bar.getByRole("button", { name: "Esquema" }).click();
  await expect(pane.getByRole("button", { name: "Modo SQL" })).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => editorText(pane)).toContain("CREATE TABLE");
});

test("abre un .zip con el .db y su .db-wal (base en modo WAL) y recupera todos los datos", async ({ page }) => {
  const pane = leftPane(page);
  const { db, wal } = walDb(2500);
  const zip = makeZip([
    { name: "prueba_recaudos/recaudos.db", bytes: db, deflate: true },
    { name: "prueba_recaudos/recaudos.db-wal", bytes: wal, deflate: true },
  ]);
  await pane.locator('input[type="file"]').setInputFiles({ name: "prueba_recaudos_db.zip", mimeType: "application/zip", buffer: asBuffer(zip) });

  const bar = pane.getByRole("region", { name: "Base de datos SQLite" });
  await expect(bar).toContainText("recaudos.db · 1 tabla");
  // En español los números de 4 cifras no llevan separador de miles ("2500", "1000").
  await expect(bar.getByLabel("Tabla o vista")).toContainText("t (2500)");
  await expect(bar).toContainText("Se aplicó el archivo -wal");
  await expect(bar.getByRole("status")).toContainText("1000 filas");
});

test("un .db en modo WAL sin su -wal avisa de que pueden faltar datos; un binario no soportado avisa", async ({ page }) => {
  const pane = leftPane(page);
  await pane.locator('input[type="file"]').setInputFiles({ name: "solo.db", mimeType: "application/octet-stream", buffer: asBuffer(walDb(10).db) });
  await expect(pane.getByRole("region", { name: "Base de datos SQLite" })).toContainText("puede que falten los últimos cambios");

  const binary = Buffer.from(new Uint8Array(300).map((_, i) => (i % 5 === 0 ? 0 : 200)));
  await pane.locator('input[type="file"]').setInputFiles({ name: "backup.bak", mimeType: "application/octet-stream", buffer: binary });
  await expect(pane.getByRole("alert")).toContainText("no es texto ni una base SQLite");
});
