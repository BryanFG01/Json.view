import type { DocLanguage } from "../../domain/models/json";

/** Palabras con las que suele empezar una sentencia SQL (tras comentarios opcionales). */
const SQL_START =
  /^\s*(?:(?:--[^\n]*\n|\/\*[\s\S]*?\*\/)\s*)*\(?\s*(select|with|insert|update|delete|create|alter|drop|merge|truncate|grant|revoke|begin|declare|exec|execute|call|use|set|show|describe|explain|upsert|replace)\b/i;

/** ¿El texto parece una consulta SQL? (no valida la sintaxis: solo decide el modo del editor). */
export function looksLikeSql(text: string): boolean {
  return SQL_START.test(text);
}

function isJson(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Elige el modo de un texto nuevo (pegado o subido). JSON válido gana siempre;
 * después cuenta la extensión del archivo y, por último, si el texto parece SQL.
 */
export function detectLanguage(text: string, fileName?: string): DocLanguage {
  if (isJson(text)) return "json";
  if (fileName && /\.sql$/i.test(fileName)) return "sql";
  if (fileName && /\.json$/i.test(fileName)) return "json";
  return looksLikeSql(text) ? "sql" : "json";
}
