import { describe, expect, it } from "vitest";
import { detectLanguage, looksLikeSql } from "./detectLanguage";
import { formatSqlUseCase } from "./formatSql";

describe("detectLanguage", () => {
  it.each([
    "select * from clientes",
    "  WITH t AS (SELECT 1) SELECT * FROM t",
    "-- consulta\nUPDATE pedidos SET estado = 'ok'",
    "/* multi\nlínea */ insert into a values (1)",
    "(select 1)",
  ])("reconoce SQL: %s", (text) => {
    expect(looksLikeSql(text)).toBe(true);
    expect(detectLanguage(text)).toBe("sql");
  });

  it.each(['{"select": 1}', "[1,2]", "hola", '{"a": '])("no confunde JSON ni texto suelto con SQL: %s", (text) => {
    expect(detectLanguage(text)).toBe("json");
  });

  it("JSON válido gana aunque el archivo sea .sql; la extensión decide cuando el texto no es JSON", () => {
    expect(detectLanguage('{"a":1}', "datos.sql")).toBe("json");
    expect(detectLanguage("cualquier cosa", "consulta.sql")).toBe("sql");
    expect(detectLanguage("select 1", "datos.json")).toBe("json");
  });
});

describe("formatSqlUseCase", () => {
  it("formatea con palabras clave en mayúsculas y la sangría elegida", async () => {
    const result = await formatSqlUseCase("select id, nombre from clientes where activo = 1 order by nombre", "sql", "2");
    expect(result).toEqual({
      ok: true,
      text: "SELECT\n  id,\n  nombre\nFROM\n  clientes\nWHERE\n  activo = 1\nORDER BY\n  nombre",
    });
  });

  it("respeta 4 espacios y tabulador", async () => {
    const four = await formatSqlUseCase("select a from b", "sql", "4");
    expect(four.ok && four.text).toBe("SELECT\n    a\nFROM\n    b");
    const tab = await formatSqlUseCase("select a from b", "sql", "tab");
    expect(tab.ok && tab.text).toBe("SELECT\n\ta\nFROM\n\tb");
  });

  it("separa varias sentencias y entiende el dialecto", async () => {
    const result = await formatSqlUseCase("select 1; select `x` from t limit 5", "mysql", "2");
    expect(result.ok && result.text).toBe("SELECT\n  1;\n\nSELECT\n  `x`\nFROM\n  t\nLIMIT\n  5");
  });

  it("pone en mayúsculas también funciones y tipos", async () => {
    const result = await formatSqlUseCase("select count(id), cast(x as varchar(10)) from t", "sql", "2");
    expect(result.ok && result.text).toBe("SELECT\n  COUNT(id),\n  CAST(x AS VARCHAR(10))\nFROM\n  t");
  });

  it("devuelve el error en vez de lanzar si no puede formatear", async () => {
    const result = await formatSqlUseCase("select 'sin cerrar", "sql", "2");
    expect(result.ok).toBe(false);
  });
});
