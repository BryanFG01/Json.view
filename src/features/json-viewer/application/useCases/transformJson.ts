import type { IndentOption, JsonValue } from "../../domain/models/json";

function toIndent(indent: IndentOption): string | number {
  return indent === "tab" ? "\t" : Number(indent);
}

/** Embellece: JSON.stringify(valor, null, indent). */
export function formatJsonUseCase(value: JsonValue, indent: IndentOption): string {
  return JSON.stringify(value, null, toIndent(indent));
}

/** Minifica: JSON.stringify(valor). */
export function minifyJsonUseCase(value: JsonValue): string {
  return JSON.stringify(value);
}

/** Convierte el JSON en un string escapado (útil para pegarlo dentro de otro JSON o en código). */
export function escapeJsonUseCase(value: JsonValue): string {
  return JSON.stringify(JSON.stringify(value));
}

/** Copia del valor con las claves de todos los objetos ordenadas alfabéticamente. */
export function sortKeysDeep(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value === null || typeof value !== "object") return value;
  const keys = Object.keys(value).sort((a, b) => a.localeCompare(b));
  return Object.fromEntries(keys.map((key) => [key, sortKeysDeep(value[key])]));
}

/** Al pegar: si el texto es JSON válido se devuelve formateado; si no, tal cual. */
export function formatIfValidUseCase(text: string, indent: IndentOption): string {
  try {
    return formatJsonUseCase(JSON.parse(text) as JsonValue, indent);
  } catch {
    return text;
  }
}

/** Si el valor es un string que contiene JSON, lo parsea y lo formatea. Devuelve null si no aplica. */
export function unescapeJsonUseCase(value: JsonValue, indent: IndentOption): string | null {
  if (typeof value !== "string") return null;
  try {
    return formatJsonUseCase(JSON.parse(value) as JsonValue, indent);
  } catch {
    return null;
  }
}
