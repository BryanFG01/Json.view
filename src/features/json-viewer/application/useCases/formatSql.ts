import type { IndentOption, SqlDialect } from "../../domain/models/json";
import { dialectCandidates } from "./detectSqlDialect";
import { protectTableHints, restoreTableHints } from "./sqlTableHints";

/** A partir de aquí (≈1 MB, unos 4 s de formateo) se considera un script grande. */
export const LARGE_SQL = 1_000_000;

export type SqlFormatResult =
  | { ok: true; text: string; dialect: SqlDialect }
  | { ok: false; message: string };

/** El mensaje de sql-formatter añade una sugerencia en inglés; se deja solo la parte útil. */
function cleanMessage(message: string): string {
  return message
    .split("\n")[0]
    .replace(/\s*This likely happens.*$/i, "")
    .replace(/^Parse error:\s*/i, "")
    .replace(/^Unexpected /i, "Texto inesperado ")
    .replace(/ at line (\d+) column (\d+)/i, " en la línea $1, columna $2");
}

/**
 * Formatea SQL con `sql-formatter` (importado al usarse: quien solo trabaja con JSON no lo
 * descarga). Si el dialecto elegido no entiende la consulta, prueba el detectado y luego los
 * demás; devuelve el dialecto con el que funcionó.
 */
export async function formatSqlUseCase(text: string, dialect: SqlDialect, indent: IndentOption): Promise<SqlFormatResult> {
  const { format } = await import("sql-formatter");
  // `WITH (NOLOCK)` de SQL Server: se protege para que quede pegado a su tabla.
  const { text: source, hints } = protectTableHints(text);
  let firstError = "";
  // Con scripts grandes, probar 8 dialectos podría tardar minutos: solo el elegido y el detectado.
  const candidates = dialectCandidates(dialect, text).slice(0, text.length > LARGE_SQL ? 2 : undefined);
  for (const candidate of candidates) {
    try {
      const formatted = format(source, {
        language: candidate,
        keywordCase: "upper",
        functionCase: "upper",
        dataTypeCase: "upper",
        tabWidth: indent === "4" ? 4 : 2,
        useTabs: indent === "tab",
        linesBetweenQueries: 1,
      });
      return { ok: true, text: restoreTableHints(formatted, hints), dialect: candidate };
    } catch (error) {
      firstError ||= cleanMessage(error instanceof Error ? error.message : String(error));
    }
  }
  return { ok: false, message: firstError };
}
