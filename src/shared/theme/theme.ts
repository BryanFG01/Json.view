export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "json-viewer-theme";
export const THEME_CHANGE_EVENT = "json-viewer:theme";
export const DEFAULT_THEME: Theme = "dark";

/** Se ejecuta en el <head> antes de pintar para evitar el parpadeo de tema. */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export function readTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Almacenamiento bloqueado: el tema se aplica igual, solo no se recuerda.
  }
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}
