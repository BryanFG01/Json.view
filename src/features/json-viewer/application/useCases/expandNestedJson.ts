import type { IndentOption, JsonValue } from "../../domain/models/json";
import { formatJsonUseCase } from "./transformJson";

const MAX_DEPTH = 32;

/** Strings que "parecen" JSON: objeto, array o un string JSON con comillas (doble serialización). */
function looksLikeJson(text: string): boolean {
  const t = text.trim();
  return (
    (t.startsWith("{") && t.endsWith("}")) ||
    (t.startsWith("[") && t.endsWith("]")) ||
    (t.length > 1 && t.startsWith('"') && t.endsWith('"'))
  );
}

function tryParse(text: string): JsonValue | undefined {
  try {
    return JSON.parse(text) as JsonValue;
  } catch {
    return undefined;
  }
}

/** Recorre el valor y convierte en objetos/arrays los strings que contienen JSON serializado. */
export function expandNestedJson(value: JsonValue, depth = 0): JsonValue {
  if (depth > MAX_DEPTH) return value;
  if (typeof value === "string") {
    if (!looksLikeJson(value)) return value;
    const parsed = tryParse(value);
    return parsed === undefined ? value : expandNestedJson(parsed, depth + 1);
  }
  if (Array.isArray(value)) return value.map((item) => expandNestedJson(item, depth + 1));
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, expandNestedJson(v, depth + 1)]));
  }
  return value;
}

/** Analiza el JSON anidado (strings con JSON adentro) y devuelve el resultado formateado. */
export function expandNestedJsonUseCase(value: JsonValue, indent: IndentOption): string {
  return formatJsonUseCase(expandNestedJson(value), indent);
}
