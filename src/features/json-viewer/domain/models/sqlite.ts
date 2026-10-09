import type { JsonValue } from "./json";

export interface SqliteObject {
  name: string;
  type: "table" | "view";
  /** Número de filas (null si no se pudo contar, p. ej. una vista con error). */
  rows: number | null;
}

export interface SqliteInfo {
  fileName: string;
  sizeBytes: number;
  /** PRAGMA user_version: la "versión" que usan sqflite / Drift para las migraciones. */
  userVersion: number;
  objects: SqliteObject[];
  /** La base estaba en modo WAL. */
  walMode: boolean;
  /** Se aplicó el archivo -wal (páginas recuperadas). */
  walPagesApplied: number;
}

export interface SqliteQueryResult {
  columns: string[];
  rows: { [key: string]: JsonValue }[];
  /** Hay más filas de las que se devolvieron (límite de seguridad). */
  truncated: boolean;
  ms: number;
}

/** Puerto: base SQLite abierta en memoria (solo lectura del archivo original). */
export interface ISqliteDatabase {
  info(): SqliteInfo;
  query(sql: string, maxRows: number): SqliteQueryResult;
  /** Sentencias CREATE de tablas, vistas, índices y triggers. */
  schema(): string;
  close(): void;
}
