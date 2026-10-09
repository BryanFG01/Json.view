import type { Locator, Page } from "@playwright/test";

export const leftPane = (page: Page) => page.getByRole("region", { name: "Panel izquierdo" });
export const rightPane = (page: Page) => page.getByRole("region", { name: "Panel derecho" });

/** Editor principal del panel (con una base SQLite abierta también hay un editor de consulta). */
export const mainEditor = (pane: Locator) => pane.locator('.cm-content[aria-label="Editor JSON"]');

/** Lista de sugerencias del autocompletado (no confundir con las opciones de un <select>). */
export const completions = (page: Page) => page.locator(".cm-tooltip-autocomplete").getByRole("option");

/** Escribe en el editor CodeMirror del panel (como si el usuario tecleara). */
export async function typeJson(pane: Locator, text: string) {
  await mainEditor(pane).click();
  await pane.page().keyboard.insertText(text);
}

/** Texto actual del editor del panel, con saltos de línea (sin el placeholder del editor vacío). */
export async function editorText(pane: Locator): Promise<string> {
  return mainEditor(pane).evaluate((el) =>
    Array.from(el.querySelectorAll(".cm-line"), (line) =>
      line.querySelector(".cm-placeholder") ? "" : (line.textContent ?? ""),
    ).join("\n"),
  );
}
