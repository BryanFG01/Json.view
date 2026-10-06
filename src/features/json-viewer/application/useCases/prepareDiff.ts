import type { JsonParseResult, SortOptions } from "../../domain/models/json";
import { sortJsonUseCase } from "./sortJson";

/**
 * Normaliza un lado de la comparación: si es JSON válido se formatea igual en ambos lados
 * (así no cuentan espacios ni sangrías) y se ordena según las opciones elegidas.
 * Si no es válido, se compara el texto tal cual.
 */
export function prepareDiffTextUseCase(text: string, parsed: JsonParseResult, sort: SortOptions): string {
  if (parsed.status !== "valid") return text;
  return sortJsonUseCase(parsed.value, sort, "2");
}
