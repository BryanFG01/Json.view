export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type JsonKind = "object" | "array" | "string" | "number" | "boolean" | "null";

export type IndentOption = "2" | "4" | "tab";

export type ViewMode = "editor" | "tree";

/** Lenguaje del contenido de un panel. */
export type DocLanguage = "json" | "sql";

/** Dialectos SQL soportados al formatear (nombres de `sql-formatter`). */
export type SqlDialect = "sql" | "postgresql" | "mysql" | "mariadb" | "tsql" | "plsql" | "sqlite" | "bigquery";

/** Orden de las claves de los objetos: tal cual, A→Z o Z→A (orden natural: "item2" < "item10"). */
export type KeyOrder = "original" | "asc" | "desc";

export interface SortOptions {
  keys: KeyOrder;
  /** Ordena también los elementos de los arrays (números por valor, textos en orden natural). */
  arrays: boolean;
  /** Ordena los arrays de objetos (en cualquier nivel) por el valor de un campo. */
  byField?: { key: string; desc: boolean } | null;
}

/** A qué parte del documento se aplica una acción: todo o solo el bloque { } / [ ] del cursor. */
export type SortTarget = "all" | "block";

export interface TextLocation {
  offset: number;
  line: number;
  column: number;
}

export interface JsonSyntaxError {
  message: string;
  location: TextLocation | null;
}

export type JsonParseResult =
  | { status: "empty" }
  | { status: "valid"; value: JsonValue }
  | { status: "invalid"; error: JsonSyntaxError };
