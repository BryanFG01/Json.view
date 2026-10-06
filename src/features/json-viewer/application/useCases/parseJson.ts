import type { JsonParseResult, JsonSyntaxError, JsonValue } from "../../domain/models/json";
import { locateJsonError } from "./locateJsonError";
import { lineColumnToLocation, offsetToLocation } from "./textLocation";

const POSITION_RE = /position (\d+)/i;
const LINE_COLUMN_RE = /line (\d+) column (\d+)/i;

function toSyntaxError(text: string, error: unknown): JsonSyntaxError {
  const message = error instanceof Error ? error.message : String(error);

  const byPosition = POSITION_RE.exec(message);
  if (byPosition) return { message, location: offsetToLocation(text, Number(byPosition[1])) };

  const byLineColumn = LINE_COLUMN_RE.exec(message);
  if (byLineColumn) {
    const location = lineColumnToLocation(text, Number(byLineColumn[1]), Number(byLineColumn[2]));
    return { message, location };
  }

  const offset = locateJsonError(text);
  return { message, location: offset === null ? null : offsetToLocation(text, offset) };
}

/** Valida el texto con JSON.parse; si falla, calcula dónde está el error. */
export function parseJsonUseCase(text: string): JsonParseResult {
  if (!text.trim()) return { status: "empty" };
  try {
    return { status: "valid", value: JSON.parse(text) as JsonValue };
  } catch (error) {
    return { status: "invalid", error: toSyntaxError(text, error) };
  }
}
