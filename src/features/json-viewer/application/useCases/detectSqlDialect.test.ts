import { describe, expect, it } from "vitest";
import { dialectCandidates, guessSqlDialect } from "./detectSqlDialect";

describe("guessSqlDialect", () => {
  it.each([
    ["SELECT * FROM t WHERE id = @id", "tsql"],
    ["SELECT TOP 10 [Nombre] FROM clientes", "tsql"],
    ["SELECT FORMAT(fecha, 'dd/MM/yyyy') FROM t WITH (NOLOCK)", "tsql"],
    ["SELECT id::text FROM t WHERE nombre ILIKE 'a%'", "postgresql"],
    ["SELECT * FROM t WHERE id = $1 RETURNING id", "postgresql"],
    ["SELECT `nombre` FROM t LIMIT 10, 20", "mysql"],
    ["SELECT NVL(a, 0) FROM DUAL", "plsql"],
  ] as const)("%s → %s", (sql, dialect) => {
    expect(guessSqlDialect(sql)).toBe(dialect);
  });

  it("no se deja engañar por pistas dentro de textos ni adivina sin pistas", () => {
    expect(guessSqlDialect("SELECT 'correo@dominio.com' FROM t")).toBeNull();
    expect(guessSqlDialect("SELECT id, nombre FROM clientes WHERE activo = 1")).toBeNull();
  });

  it("dialectCandidates prueba primero el elegido, luego el detectado, sin repetir", () => {
    const candidates = dialectCandidates("sql", "SELECT * FROM t WHERE id = @id");
    expect(candidates.slice(0, 2)).toEqual(["sql", "tsql"]);
    expect(new Set(candidates).size).toBe(candidates.length);
    expect(candidates).toHaveLength(8);
  });
});
