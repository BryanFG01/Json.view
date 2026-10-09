import { describe, expect, it } from "vitest";
import { buildSqlSchema } from "./sqlSchema";

describe("buildSqlSchema", () => {
  it("tablas y vistas con su número de filas, columnas con tipo y PK, sin android_metadata", () => {
    const schema = buildSqlSchema([
      { name: "android_metadata", type: "table", rows: 1, columns: [{ name: "locale", type: "TEXT", primaryKey: false }] },
      {
        name: "clientes",
        type: "table",
        rows: 5000,
        columns: [
          { name: "id", type: "INTEGER", primaryKey: true },
          { name: "nombre", type: "TEXT", primaryKey: false },
          { name: "extra", type: "", primaryKey: false },
        ],
      },
      { name: "v_resumen", type: "view", rows: null, columns: [{ name: "total", type: "", primaryKey: false }] },
    ]);

    expect(Object.keys(schema)).toEqual(["clientes", "v_resumen"]);
    expect(schema.clientes.self).toEqual({ label: "clientes", type: "type", detail: "tabla · 5000 filas" });
    expect(schema.clientes.children).toEqual([
      { label: "id", type: "property", detail: "INTEGER · PK", boost: 1 },
      { label: "nombre", type: "property", detail: "TEXT", boost: 0 },
      { label: "extra", type: "property", detail: "sin tipo", boost: 0 },
    ]);
    expect(schema.v_resumen.self.detail).toBe("vista · ? filas");
  });
});
