// Operaciones de texto sobre SQL que respetan textos e identificadores entre comillas.

const QUOTES = new Set(["'", '"', "`"]);

/** Fin (exclusivo) de un literal que empieza en `start`: comillas duplicadas o escapadas con \. */
function readQuoted(sql: string, start: number, close: string): number {
  let i = start + 1;
  while (i < sql.length) {
    if (sql[i] === "\\" && close === "'") i += 2;
    else if (sql[i] === close && sql[i + 1] === close) i += 2;
    else if (sql[i] === close) return i + 1;
    else i++;
  }
  return sql.length;
}

/** Tramo literal en `i` (texto, identificador, [col], $$…$$ o /* *\/) o null si no empieza uno. */
function literalAt(sql: string, i: number): number | null {
  const char = sql[i];
  if (QUOTES.has(char)) return readQuoted(sql, i, char);
  if (char === "[") return readQuoted(sql, i, "]");
  if (char === "/" && sql[i + 1] === "*") {
    const end = sql.indexOf("*/", i + 2);
    return end === -1 ? sql.length : end + 2;
  }
  const dollar = char === "$" ? /^\$[A-Za-z_]*\$/.exec(sql.slice(i)) : null;
  if (dollar) {
    const end = sql.indexOf(dollar[0], i + dollar[0].length);
    return end === -1 ? sql.length : end + dollar[0].length;
  }
  return null;
}

/**
 * Deja la consulta en una sola línea: colapsa espacios y saltos de línea fuera de los
 * literales y convierte los comentarios `-- …` en `/* … *\/` para que no se coman el resto.
 */
export function minifySqlUseCase(sql: string): string {
  let out = "";
  let pendingSpace = false;
  const emit = (piece: string) => {
    if (pendingSpace && out && !out.endsWith("(") && !/^[),;]/.test(piece)) out += " ";
    pendingSpace = false;
    out += piece;
  };
  for (let i = 0; i < sql.length; ) {
    const char = sql[i];
    if (/\s/.test(char)) {
      pendingSpace = true;
      i++;
    } else if (char === "-" && sql[i + 1] === "-") {
      const end = sql.indexOf("\n", i);
      const comment = sql.slice(i + 2, end === -1 ? sql.length : end).trim().replace(/\*\//g, "* /");
      if (comment) emit(`/* ${comment} */`);
      pendingSpace = true;
      i = end === -1 ? sql.length : end;
    } else {
      const end = literalAt(sql, i) ?? i + 1;
      emit(sql.slice(i, end));
      i = end;
    }
  }
  return out.trim();
}

/** Envuelve el texto como literal SQL `'…'` duplicando las comillas simples (para un INSERT). */
export function toSqlLiteralUseCase(text: string): string {
  return `'${text.replace(/'/g, "''")}'`;
}

/** Quita un literal `'…'` (restaurando `''` → `'`) o un string JSON `"…"`. Null si no lo es. */
export function fromSqlLiteralUseCase(text: string): string | null {
  const t = text.trim();
  if (t.length >= 2 && t.startsWith("'") && t.endsWith("'") && readQuoted(t, 0, "'") === t.length) {
    return t.slice(1, -1).replace(/''/g, "'");
  }
  if (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) {
    try {
      const value: unknown = JSON.parse(t);
      return typeof value === "string" ? value : null;
    } catch {
      return null;
    }
  }
  return null;
}
