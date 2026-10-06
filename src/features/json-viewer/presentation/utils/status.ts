import type { JsonParseResult, JsonValue } from "../../domain/models/json";
import { getKind } from "./jsonTree";
import type { StatusTone } from "./styles.constants";
import { byteLength, countLines, formatBytes } from "./text";

export interface StatusSummary {
  label: string;
  tone: StatusTone;
  detail: string | null;
  size: string;
  lines: number;
}

function describeRoot(value: JsonValue): string {
  const kind = getKind(value);
  if (kind === "array") return `Array · ${(value as JsonValue[]).length} elementos`;
  if (kind === "object") return `Objeto · ${Object.keys(value as object).length} claves`;
  return `Valor ${kind}`;
}

function describeResult(parsed: JsonParseResult): Pick<StatusSummary, "label" | "tone" | "detail"> {
  if (parsed.status === "empty") return { label: "Sin contenido", tone: "idle", detail: null };
  if (parsed.status === "valid") return { label: "JSON válido", tone: "ok", detail: describeRoot(parsed.value) };
  const location = parsed.error.location;
  const detail = location ? `Línea ${location.line}, columna ${location.column}` : null;
  return { label: "JSON inválido", tone: "error", detail };
}

/** "Bloque: líneas 15–31" para el bloque { } / [ ] del cursor; null si no hay o es de una sola línea. */
export function describeScope(scope: { openLine: number; closeLine: number } | null): string | null {
  if (!scope || scope.openLine === scope.closeLine) return null;
  return `Bloque: líneas ${scope.openLine}–${scope.closeLine}`;
}

export function buildStatus(text: string, parsed: JsonParseResult): StatusSummary {
  return {
    ...describeResult(parsed),
    size: formatBytes(byteLength(text)),
    lines: countLines(text),
  };
}
