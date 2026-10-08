// Pistas de tabla de SQL Server: `FROM t WITH (NOLOCK, INDEX(ix))`. sql-formatter las trata como
// una cláusula WITH y las parte en varias líneas; se protegen con un marcador y se restauran después.

const HINTS = new Set([
  "NOLOCK", "READUNCOMMITTED", "READCOMMITTED", "UPDLOCK", "ROWLOCK", "HOLDLOCK", "READPAST", "TABLOCK",
  "TABLOCKX", "PAGLOCK", "XLOCK", "NOWAIT", "SERIALIZABLE", "REPEATABLEREAD", "INDEX", "FORCESEEK", "FORCESCAN",
]);

const placeholder = (i: number) => `__TABLE_HINT_${i}__`;
const PLACEHOLDER = /__TABLE_HINT_(\d+)__/g;

/** Fin (exclusivo) del paréntesis que abre en `open`, contando anidados; -1 si no cierra. */
function closingParen(sql: string, open: number): number {
  let depth = 0;
  for (let i = open; i < sql.length; i++) {
    if (sql[i] === "(") depth++;
    else if (sql[i] === ")" && --depth === 0) return i + 1;
  }
  return -1;
}

/** Normaliza el contenido: espacios simples, ", " entre pistas y pistas en MAYÚSCULAS (los índices no). */
function normalizeHint(content: string): string {
  return content
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\b[a-z]+\b/gi, (word) => (HINTS.has(word.toUpperCase()) ? word.toUpperCase() : word));
}

/** Sustituye cada `WITH (pistas)` por un marcador y devuelve las pistas normalizadas. */
export function protectTableHints(sql: string): { text: string; hints: string[] } {
  const hints: string[] = [];
  let out = "";
  let last = 0;
  const pattern = /\bWITH\s*\(\s*([A-Za-z]+)/gi;
  for (let match = pattern.exec(sql); match; match = pattern.exec(sql)) {
    if (!HINTS.has(match[1].toUpperCase()) || match.index < last) continue;
    const open = sql.indexOf("(", match.index);
    const end = closingParen(sql, open);
    if (end === -1) continue;
    out += sql.slice(last, match.index) + placeholder(hints.length);
    hints.push(`WITH (${normalizeHint(sql.slice(open + 1, end - 1))})`);
    last = end;
    pattern.lastIndex = end;
  }
  return { text: out + sql.slice(last), hints };
}

/** Restaura las pistas en su sitio (en la misma línea que su tabla). */
export function restoreTableHints(formatted: string, hints: string[]): string {
  return formatted.replace(PLACEHOLDER, (_, i: string) => hints[Number(i)] ?? "");
}
