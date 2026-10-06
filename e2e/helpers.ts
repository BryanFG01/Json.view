import type { Locator, Page } from "@playwright/test";

export const leftPane = (page: Page) => page.getByRole("region", { name: "Panel izquierdo" });
export const rightPane = (page: Page) => page.getByRole("region", { name: "Panel derecho" });

/** Escribe en el editor CodeMirror del panel (como si el usuario tecleara). */
export async function typeJson(pane: Locator, text: string) {
  const content = pane.locator(".cm-content");
  await content.click();
  await pane.page().keyboard.insertText(text);
}

/** Texto actual del editor del panel, con saltos de línea (sin el placeholder del editor vacío). */
export async function editorText(pane: Locator): Promise<string> {
  return pane.locator(".cm-content").evaluate((el) =>
    Array.from(el.querySelectorAll(".cm-line"), (line) =>
      line.querySelector(".cm-placeholder") ? "" : (line.textContent ?? ""),
    ).join("\n"),
  );
}
