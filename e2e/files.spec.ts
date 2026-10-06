import { expect, test } from "@playwright/test";
import { editorText, leftPane, typeJson } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
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
