import type { JsonParseResult } from "../../domain/models/json";
import { formatJsonUseCase, sortKeysDeep } from "./transformJson";

/**
 * Normaliza un lado de la comparación: si es JSON válido se formatea igual en ambos lados
 * (así no cuentan espacios ni sangrías), opcionalmente con las claves ordenadas.
 * Si no es válido, se compara el texto tal cual.
 */
export function prepareDiffTextUseCase(text: string, parsed: JsonParseResult, sortKeys: boolean): string {
  if (parsed.status !== "valid") return text;
  return formatJsonUseCase(sortKeys ? sortKeysDeep(parsed.value) : parsed.value, "2");
}
