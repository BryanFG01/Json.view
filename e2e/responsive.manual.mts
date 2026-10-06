// Revisión temporal de diseño responsive: capturas + desbordes horizontales.
import { chromium, devices, type Page } from "@playwright/test";

const BASE = process.argv[2] ?? "http://localhost:3001";
const OUT = process.argv[3];
const VIEWPORTS = {
  movil: devices["iPhone 13"],
  movilHorizontal: devices["iPhone 13 landscape"],
  tablet: devices["iPad (gen 7)"],
  tabletHorizontal: devices["iPad (gen 7) landscape"],
};

/** Elementos cuyo borde derecho se sale de la pantalla (o la página entera con scroll horizontal). */
const overflow = (page: Page) =>
  page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const out = [...document.querySelectorAll("body *")]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.right <= width + 1) return false;
        // Ignora lo que está dentro de un contenedor con scroll propio (barra de acciones, editor).
        for (let p = el.parentElement; p; p = p.parentElement) {
          const s = getComputedStyle(p);
          if (/(auto|scroll|hidden)/.test(s.overflowX) && p.getBoundingClientRect().right <= width + 1) return false;
        }
        return true;
      })
      .map((el) => `${el.tagName.toLowerCase()}.${(el.className || "").toString().slice(0, 40)}`);
    return { pageScroll: document.documentElement.scrollWidth > width, out: out.slice(0, 5) };
  });

const browser = await chromium.launch();
for (const [name, device] of Object.entries(VIEWPORTS)) {
  const context = await browser.newContext({ ...device });
  const page = await context.newPage();
  await page.goto(BASE);
  const left = page.getByRole("region", { name: "Panel izquierdo" });
  await left.getByRole("button", { name: "Cargar ejemplo" }).click();
  const shot = async (step: string) => {
    await page.screenshot({ path: `${OUT}/${name}-${step}.png` });
    console.log(name, step, JSON.stringify(await overflow(page)));
  };
  await shot("1-editor");
  await left.getByRole("button", { name: "Ordenar" }).click();
  await shot("2-menu");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Dividir pantalla" }).click();
  const right = page.getByRole("region", { name: "Panel derecho" });
  await right.getByRole("button", { name: "Cargar ejemplo" }).click();
  await right.getByRole("button", { name: "Ordenar" }).click();
  await page.getByRole("menuitem", { name: /Claves Z → A/ }).click();
  await shot("3-dividido");
  await page.getByRole("button", { name: "Comparar" }).click();
  await shot("4-comparar");
  await page.keyboard.press("Escape");
  await left.getByRole("tab", { name: "Árbol" }).click();
  await shot("5-arbol");
  await context.close();
}
await browser.close();
