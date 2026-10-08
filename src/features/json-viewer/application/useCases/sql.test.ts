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
      dialect: "sql",
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

  it("devuelve el error en español, sin la sugerencia en inglés, si ningún dialecto puede formatear", async () => {
    const result = await formatSqlUseCase("select 'sin cerrar", "sql", "2");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).not.toMatch(/This likely happens|Parse error/);
      expect(result.message).toMatch(/línea 1, columna/);
    }
  });

  it("si el dialecto elegido no entiende la consulta, prueba otros y dice cuál funcionó", async () => {
    // Consulta de SQL Server (variables @, FORMAT, OVER, NOLOCK): el SQL estándar falla con "@seller".
    const query =
      "SELECT COUNT(*) OVER() AS total, FORMAT(h.created_at, 'dd/MM/yyyy HH:mm:ss') created_at FROM header h WITH (NOLOCK) " +
      "WHERE (@seller IS NULL OR h.seller_id = @seller) ORDER BY h.created_at DESC OFFSET @skip ROWS FETCH NEXT @take ROWS ONLY";
    const result = await formatSqlUseCase(query, "sql", "2");
    expect(result).toMatchObject({ ok: true, dialect: "tsql" });
    expect(result.ok && result.text).toContain("@seller IS NULL");
    // WITH (NOLOCK) queda pegado a su tabla, no como una cláusula aparte.
    expect(result.ok && result.text).toContain("\nFROM\n  header h WITH (NOLOCK)\nWHERE");
  });

  it("une también varias pistas de tabla y no toca un WITH de CTE", async () => {
    const hints = await formatSqlUseCase("select a from t with (nolock, index(ix_Fecha)) join u with ( updlock ,rowlock ) on u.id = t.id", "tsql", "2");
    expect(hints.ok && hints.text).toBe("SELECT\n  a\nFROM\n  t WITH (NOLOCK, INDEX(ix_Fecha))\n  JOIN u WITH (UPDLOCK, ROWLOCK) ON u.id = t.id");
    const cte = await formatSqlUseCase("with x as (select 1 as a) select a from x", "tsql", "2");
    expect(cte.ok && cte.text).toMatch(/^WITH\n {2}x AS \(/);
  });
});
