import { describe, expect, it } from "vitest";
import { formatSqlUseCase } from "./formatSql";
import { joinLinesUseCase } from "./joinLines";
import { fromSqlLiteralUseCase, minifySqlUseCase, toSqlLiteralUseCase } from "./sqlText";

describe("minifySqlUseCase", () => {
  it("deja la consulta formateada en una sola línea", async () => {
    const query = "select c.id, count(p.id) as n from clientes c left join pedidos p on p.cliente_id = c.id where c.activo = 1 group by c.id";
    const formatted = await formatSqlUseCase(query, "sql", "2");
    expect(minifySqlUseCase(formatted.ok ? formatted.text : "")).toBe(
      "SELECT c.id, COUNT(p.id) AS n FROM clientes c LEFT JOIN pedidos p ON p.cliente_id = c.id WHERE c.activo = 1 GROUP BY c.id",
    );
  });

  it("no toca los espacios dentro de textos e identificadores, pero sí une sus saltos de línea", () => {
    const sql = "SELECT  'a   b\n   c',  \"Mi   Columna\",  [otra  col]\nFROM   t /* nota\n  larga */";
    const out = minifySqlUseCase(sql);
    expect(out).toBe("SELECT 'a   b c', \"Mi   Columna\", [otra  col] FROM t /* nota larga */");
    expect(out).not.toContain("\n");
  });

  it("deja intactos los cuerpos $$…$$ (código de funciones)", () => {
    expect(minifySqlUseCase("SELECT $$ linea 1\n  -- comentario\n linea 2 $$\nFROM t")).toBe("SELECT $$ linea 1\n  -- comentario\n linea 2 $$ FROM t");
  });

  it("respeta comillas duplicadas y escapadas", () => {
    expect(minifySqlUseCase("SELECT 'O''Brien' ,\n 'it\\'s'  FROM t")).toBe("SELECT 'O''Brien', 'it\\'s' FROM t");
  });

  it("convierte los comentarios -- en /* */ para no comerse el resto de la línea", () => {
    expect(minifySqlUseCase("SELECT a -- el id\nFROM t -- tabla\nWHERE b = 1")).toBe("SELECT a /* el id */ FROM t /* tabla */ WHERE b = 1");
  });

  it("separa sentencias y no deja espacios junto a paréntesis, comas ni ;", () => {
    expect(minifySqlUseCase("INSERT INTO t ( a , b )\nVALUES ( 1 , 2 ) ;\nSELECT 1 ;")).toBe("INSERT INTO t (a, b) VALUES (1, 2); SELECT 1;");
  });
});

describe("joinLinesUseCase", () => {
  it("une cualquier texto en una línea: sin saltos, sin sangría ni líneas vacías", () => {
    expect(joinLinesUseCase("  uno\r\n\n    dos  tres\n\t cuatro  \n")).toBe("uno dos  tres cuatro");
    expect(joinLinesUseCase('{\n  "a": 1,\n  "b": [\n')).toBe('{ "a": 1, "b": [');
  });
});

describe("literales SQL para INSERT", () => {
  it("envuelve en comillas simples duplicando las internas", () => {
    expect(toSqlLiteralUseCase("SELECT * FROM t WHERE nombre = 'Ana'")).toBe("'SELECT * FROM t WHERE nombre = ''Ana'''");
  });

  it("desescapa '…' y \"…\" y es la operación inversa", () => {
    const sql = "SELECT 'O''Brien', \"x\"\nFROM t";
    expect(fromSqlLiteralUseCase(toSqlLiteralUseCase(sql))).toBe(sql);
    expect(fromSqlLiteralUseCase('"SELECT \\"a\\"\\nFROM t"')).toBe('SELECT "a"\nFROM t');
  });

  it("devuelve null si no es un único literal", () => {
    expect(fromSqlLiteralUseCase("SELECT 'a'")).toBeNull();
    expect(fromSqlLiteralUseCase("'a' || 'b'")).toBeNull();
  });
});
