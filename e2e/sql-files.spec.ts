import { expect, test } from "@playwright/test";
import { editorText, leftPane, rightPane } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

/** Script como el de SSMS "Generar scripts": USE, GO, CREATE TABLE con [corchetes] e INSERT masivos. */
function ssmsScript(rows: number): string {
  let body = "USE [Ventas]\nGO\nSET ANSI_NULLS ON\nGO\nCREATE TABLE [dbo].[clientes]([id] [int] NOT NULL, [nombre] [nvarchar](120) NULL)\nGO\n";
  for (let i = 1; i <= rows; i++) body += `INSERT [dbo].[clientes] ([id], [nombre]) VALUES (${i}, N'Ñandú Pérez ${i}')\n`;
  return `${body}GO\n`;
}

/** SSMS guarda por defecto en UTF-16 LE con BOM. */
const utf16 = (text: string) => Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(text, "utf16le")]);

test("sube un script de SSMS en UTF-16 y se lee bien (tildes y ñ)", async ({ page }) => {
  const pane = leftPane(page);
  await pane.locator('input[type="file"]').setInputFiles({ name: "clientes.sql", mimeType: "application/sql", buffer: utf16(ssmsScript(3)) });

  await expect(pane.getByRole("button", { name: "Modo SQL" })).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => editorText(pane)).toContain("VALUES (1, N'Ñandú Pérez 1')");

  await pane.getByRole("button", { name: "Formatear", exact: true }).click();
  await expect.poll(() => editorText(pane)).toContain("USE [Ventas]\nGO");
  await expect(pane.getByText("Dialecto: SQL Server (detectado)")).toBeVisible();
});

test("un script grande se formatea en segundo plano sin congelar la página, y se puede cancelar", async ({ page }) => {
  test.setTimeout(120_000);
  const pane = leftPane(page);
  const script = ssmsScript(15_000); // ≈1,2 MB
  await pane.locator('input[type="file"]').setInputFiles({ name: "grande.sql", mimeType: "application/sql", buffer: Buffer.from(script) });
  await expect.poll(() => editorText(pane).then((t) => t.startsWith("USE [Ventas]"))).toBe(true);

  // Cancelar: el texto queda como estaba.
  await pane.getByRole("button", { name: "Formatear", exact: true }).click();
  await expect(pane.getByRole("status")).toContainText("Formateando SQL…");
  await pane.getByRole("status").getByRole("button", { name: "Cancelar" }).click();
  await expect(pane.getByRole("status")).toHaveCount(0);
  expect(await editorText(pane)).toMatch(/^USE \[Ventas\]\nGO\nSET ANSI_NULLS ON/);

  // Formatear: mientras trabaja, la página sigue respondiendo (se puede dividir la pantalla).
  await pane.getByRole("button", { name: "Formatear", exact: true }).click();
  await expect(pane.getByRole("status")).toContainText("Formateando SQL…");
  await page.getByRole("button", { name: "Dividir pantalla" }).click({ timeout: 1000 });
  await expect(rightPane(page)).toBeVisible({ timeout: 1000 });

  await expect(pane.getByRole("status")).toHaveCount(0, { timeout: 60_000 });
  await expect.poll(() => editorText(pane)).toContain("INSERT\n  [dbo].[clientes] ([id], [nombre])");
});
