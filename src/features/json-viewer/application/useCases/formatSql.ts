import type { IndentOption, SqlDialect } from "../../domain/models/json";

export type SqlFormatResult = { ok: true; text: string } | { ok: false; message: string };

/**
 * Formatea SQL con `sql-formatter`. La librería se importa al usarla por primera vez:
 * quien solo trabaja con JSON no la descarga.
 */
export async function formatSqlUseCase(text: string, dialect: SqlDialect, indent: IndentOption): Promise<SqlFormatResult> {
  const { format } = await import("sql-formatter");
  try {
    const formatted = format(text, {
      language: dialect,
      keywordCase: "upper",
      functionCase: "upper",
      dataTypeCase: "upper",
      tabWidth: indent === "4" ? 4 : 2,
      useTabs: indent === "tab",
      linesBetweenQueries: 1,
    });
    return { ok: true, text: formatted };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}
