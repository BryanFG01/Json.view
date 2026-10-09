import type { Completion } from "@codemirror/autocomplete";
import type { SqliteColumn, SqliteObject } from "../../domain/models/sqlite";

/** Esquema para el autocompletado de lang-sql: tabla → { self, children: columnas }. */
export type SqlCompletionSchema = Record<string, { self: Completion; children: Completion[] }>;

const count = (n: number | null) => (n === null ? "?" : n.toLocaleString("es"));

function columnCompletion(column: SqliteColumn): Completion {
  return {
    label: column.name,
    type: "property",
    detail: [column.type || "sin tipo", column.primaryKey ? "PK" : ""].filter(Boolean).join(" · "),
    boost: column.primaryKey ? 1 : 0,
  };
}

/**
 * Esquema de la base abierta → sugerencias: tablas y vistas (con su número de filas) y sus
 * columnas (con tipo y PK). Se omite `android_metadata`, la tabla interna que añade sqflite.
 */
export function buildSqlSchema(objects: SqliteObject[]): SqlCompletionSchema {
  const schema: SqlCompletionSchema = {};
  for (const object of objects) {
    if (object.name === "android_metadata") continue;
    schema[object.name] = {
      self: {
        label: object.name,
        type: object.type === "view" ? "class" : "type",
        detail: `${object.type === "view" ? "vista" : "tabla"} · ${count(object.rows)} filas`,
      },
      children: object.columns.map(columnCompletion),
    };
  }
  return schema;
}
