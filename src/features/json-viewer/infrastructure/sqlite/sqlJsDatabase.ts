// Adaptador del puerto ISqliteDatabase con sql.js (SQLite compilado a WebAssembly).
// La librería y su .wasm (~690 KB) se cargan solo la primera vez que se abre una base.
import type { Database, SqlJsStatic, Statement } from "sql.js";
import type { ISqliteDatabase, SqliteInfo, SqliteObject, SqliteQueryResult } from "../../domain/models/sqlite";
import { rowToJson, type SqliteCell } from "../../application/useCases/sqliteCells";
import { applyWalUseCase, isWalMode } from "../../application/useCases/sqliteFile";

let sqlJs: Promise<SqlJsStatic> | null = null;

/** En el navegador el .wasm se sirve desde /sqljs (lo copia scripts/copy-sqljs-wasm.mjs). */
function loadSqlJs(): Promise<SqlJsStatic> {
  sqlJs ??= import("sql.js").then(({ default: init }) =>
    init(typeof window === "undefined" ? undefined : { locateFile: (file: string) => `/sqljs/${file}` }),
  );
  return sqlJs;
}

const quote = (name: string) => `"${name.replace(/"/g, '""')}"`;

/**
 * Fila con useBigInt (enteros > 2^53 sin perder precisión). sql.js lo soporta desde 1.8,
 * pero @types/sql.js aún no declara el segundo parámetro de get().
 */
function readRow(statement: Statement): SqliteCell[] {
  const get = statement.get as unknown as (params: null, config: { useBigInt: boolean }) => SqliteCell[];
  return get.call(statement, null, { useBigInt: true });
}

function listObjects(db: Database): SqliteObject[] {
  const [result] = db.exec("SELECT name, type FROM sqlite_master WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' ORDER BY type, name");
  return (result?.values ?? []).map(([name, type]) => {
    let rows: number | null = null;
    try {
      rows = Number(db.exec(`SELECT COUNT(*) FROM ${quote(String(name))}`)[0].values[0][0]);
    } catch {
      rows = null;
    }
    return { name: String(name), type: type === "view" ? "view" : "table", rows };
  });
}

/** Ejecuta cada sentencia y devuelve el último resultado con columnas (hasta maxRows filas). */
function runQuery(db: Database, sql: string, maxRows: number): SqliteQueryResult {
  const start = performance.now();
  let last: SqliteQueryResult = { columns: [], rows: [], truncated: false, ms: 0 };
  for (const statement of db.iterateStatements(sql)) {
    const columns = statement.getColumnNames();
    const rows: SqliteQueryResult["rows"] = [];
    let truncated = false;
    while (statement.step()) {
      if (rows.length >= maxRows) {
        truncated = true;
        break;
      }
      rows.push(rowToJson(columns, readRow(statement)));
    }
    statement.free();
    if (columns.length > 0) last = { columns, rows, truncated, ms: 0 };
  }
  return { ...last, ms: Math.round(performance.now() - start) };
}

/** Abre un .db (y aplica su -wal si viene) en memoria. El archivo original nunca se modifica. */
export async function openSqliteDatabase(fileName: string, bytes: Uint8Array, wal: Uint8Array | null): Promise<ISqliteDatabase> {
  const SQL = await loadSqlJs();
  const walMode = isWalMode(bytes);
  const { bytes: data, pagesApplied } = wal ? applyWalUseCase(bytes, wal) : { bytes, pagesApplied: 0 };
  const db = new SQL.Database(data);
  const userVersion = Number(db.exec("PRAGMA user_version")[0]?.values[0][0] ?? 0);
  const info: SqliteInfo = { fileName, sizeBytes: bytes.length, userVersion, objects: listObjects(db), walMode, walPagesApplied: pagesApplied };

  return {
    info: () => info,
    query: (sql, maxRows) => runQuery(db, sql, maxRows),
    schema: () =>
      (db.exec("SELECT sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY type DESC, name")[0]?.values ?? [])
        .map(([sql]) => `${String(sql).trim()};`)
        .join("\n\n"),
    close: () => db.close(),
  };
}
