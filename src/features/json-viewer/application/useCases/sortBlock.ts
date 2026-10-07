import type { IndentOption, JsonValue, SortOptions } from "../../domain/models/json";
import { sortJsonUseCase } from "./sortJson";

/** Campos que aparecen en arrays de objetos (en cualquier nivel), los más frecuentes primero. */
export function collectArrayFields(value: JsonValue, limit = 50): string[] {
  const counts = new Map<string, number>();
  const visit = (node: JsonValue) => {
    if (Array.isArray(node)) {
      for (const item of node) {
        if (item !== null && typeof item === "object" && !Array.isArray(item)) {
          for (const key of Object.keys(item)) counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        visit(item);
      }
    } else if (node !== null && typeof node === "object") {
      for (const child of Object.values(node)) visit(child);
    }
  };
  visit(value);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([key]) => key);
}

/**
 * Ordena solo el bloque { } / [ ] que va de `from` a `to` (ambos incluidos) y lo vuelve a
 * colocar en su sitio con la sangría de su línea. El resto del texto no cambia.
 * Devuelve null si el bloque no es JSON válido.
 */
export function sortBlockUseCase(text: string, from: number, to: number, options: SortOptions, indent: IndentOption): string | null {
  let value: JsonValue;
  try {
    value = JSON.parse(text.slice(from, to + 1)) as JsonValue;
  } catch {
    return null;
  }
  const lineStart = text.lastIndexOf("\n", from - 1) + 1;
  const baseIndent = /^[ \t]*/.exec(text.slice(lineStart, from))?.[0] ?? "";
  const sorted = sortJsonUseCase(value, options, indent).replace(/\n/g, `\n${baseIndent}`);
  return text.slice(0, from) + sorted + text.slice(to + 1);
}
