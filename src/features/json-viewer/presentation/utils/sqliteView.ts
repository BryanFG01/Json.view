import type { SqliteInfo, SqliteObject, SqliteQueryResult } from "../../domain/models/sqlite";
import { formatBytes } from "./text";

/** Filas que se muestran al elegir una tabla (para no cargar millones de golpe). */
export const TABLE_PREVIEW_ROWS = 1000;
/** Máximo de filas que devuelve una consulta escrita a mano. */
export const QUERY_MAX_ROWS = 10_000;

const count = (n: number) => n.toLocaleString("es");
const quote = (name: string) => `"${name.replace(/"/g, '""')}"`;

export const tableQuery = (name: string) => `SELECT * FROM ${quote(name)} LIMIT ${TABLE_PREVIEW_ROWS};`;

/** "clientes (5.000)" / "v_resumen · vista (12)". */
export function objectLabel(object: SqliteObject): string {
  const rows = object.rows === null ? "?" : count(object.rows);
  return `${object.name}${object.type === "view" ? " · vista" : ""} (${rows})`;
}

/** "app.db · 4 tablas · 1 vista · versión 3 · 368 KB". */
export function databaseSummary(info: SqliteInfo): string {
  const tables = info.objects.filter((o) => o.type === "table").length;
  const views = info.objects.length - tables;
  const parts = [info.fileName, `${tables} ${tables === 1 ? "tabla" : "tablas"}`];
  if (views > 0) parts.push(`${views} ${views === 1 ? "vista" : "vistas"}`);
  parts.push(`versión ${info.userVersion}`, formatBytes(info.sizeBytes));
  return parts.join(" · ");
}

/** Aviso del modo WAL, o null si no aplica. */
export function walNotice(info: SqliteInfo): { text: string; tone: "warn" | "ok" } | null {
  if (info.walPagesApplied > 0) return { text: `Se aplicó el archivo -wal (${count(info.walPagesApplied)} páginas recuperadas).`, tone: "ok" };
  if (info.walMode) {
    return {
      text: "Base en modo WAL sin su archivo -wal: puede que falten los últimos cambios. Sube el .db y el .db-wal juntos (o un .zip con ambos).",
      tone: "warn",
    };
  }
  return null;
}

/** "1.000 filas · 12 ms" o "Se muestran 10.000 filas (hay más: usa WHERE o LIMIT) · 80 ms". */
export function describeQueryResult(result: SqliteQueryResult): string {
  if (result.columns.length === 0) return `Sentencia ejecutada (sin resultados) · ${result.ms} ms · solo en memoria, el archivo no cambia`;
  const rows = `${count(result.rows.length)} ${result.rows.length === 1 ? "fila" : "filas"}`;
  return result.truncated ? `Se muestran ${rows} (hay más: usa WHERE o LIMIT) · ${result.ms} ms` : `${rows} · ${result.ms} ms`;
}
