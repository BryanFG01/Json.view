import type { SqlDialect } from "../../domain/models/json";

/** Pistas de sintaxis propias de cada dialecto (se ignoran las que aparecen dentro de textos '…'). */
const HINTS: [SqlDialect, RegExp][] = [
  ["tsql", /@@?\w+|\[[^\]\n]+\]|\bTOP\s*\(?\s*\d|\bWITH\s*\(\s*NOLOCK\s*\)|\b(GETDATE|ISNULL|DATEADD|DATEDIFF|FORMAT|CONVERT|IIF|NEWID)\s*\(|\bNVARCHAR\b|\bOUTER\s+APPLY\b|\bCROSS\s+APPLY\b/i],
  ["postgresql", /::\s*[a-z_]+|\bILIKE\b|\$\d+\b|\bRETURNING\b|\bSERIAL\b|\bJSONB\b|\$\w*\$/i],
  ["mysql", /`[^`\n]+`|\bLIMIT\s+\d+\s*,\s*\d+|\bAUTO_INCREMENT\b|\bENGINE\s*=|\bIFNULL\s*\(/i],
  ["plsql", /\bNVL\s*\(|\bROWNUM\b|\bSYSDATE\b|\bFROM\s+DUAL\b|\bVARCHAR2\b|\bTO_DATE\s*\(|\bDECODE\s*\(/i],
  ["sqlite", /\bAUTOINCREMENT\b|\bPRAGMA\b|\bdatetime\s*\(\s*'now'/i],
];

const withoutStrings = (sql: string) => sql.replace(/'(?:[^']|'')*'/g, "''");

/** Dialecto más probable según las pistas de la consulta, o null si no hay ninguna clara. */
export function guessSqlDialect(sql: string): SqlDialect | null {
  const code = withoutStrings(sql);
  return HINTS.find(([, pattern]) => pattern.test(code))?.[0] ?? null;
}

/** Orden en que se prueban los dialectos al formatear: el elegido, el detectado y luego el resto. */
export function dialectCandidates(selected: SqlDialect, sql: string): SqlDialect[] {
  const all: SqlDialect[] = [selected, guessSqlDialect(sql) ?? selected, "tsql", "postgresql", "mysql", "plsql", "mariadb", "sqlite", "bigquery", "sql"];
  return [...new Set(all)];
}
