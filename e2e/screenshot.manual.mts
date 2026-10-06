// Captura manual para revisar el aspecto (no es un test): npx tsx e2e/screenshot.manual.ts <url> <salida>
import { chromium } from "@playwright/test";

const [url = "http://localhost:3001", out = "screenshot.png"] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 700 } });
await page.goto(url);
await page.getByRole("button", { name: "Cargar ejemplo" }).click();
await page.getByLabel("Plegar bloque", { exact: true }).nth(1).click();
await page.screenshot({ path: out });
await browser.close();
