export type EditorShortcut = "undo" | "redo" | "format" | "indent";

interface KeyInfo {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

/** Atajos del editor: Ctrl+Z, Ctrl+Y / Ctrl+Shift+Z, Shift+Alt+F (formatear) y Tab. */
export function resolveShortcut(event: KeyInfo): EditorShortcut | null {
  const mod = event.ctrlKey || event.metaKey;
  const key = event.key.toLowerCase();
  if (mod && key === "z") return event.shiftKey ? "redo" : "undo";
  if (mod && key === "y") return "redo";
  if (event.altKey && event.shiftKey && key === "f") return "format";
  if (key === "tab" && !mod && !event.altKey && !event.shiftKey) return "indent";
  return null;
}

export const INDENT_TEXT = "  ";
