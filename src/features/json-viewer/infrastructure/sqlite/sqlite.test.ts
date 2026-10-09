import { describe, expect, it } from "vitest";
import { flutterLikeDb, makeZip, walDb } from "../../../../../test/fixtures";
import { classifyUploadUseCase } from "../../application/useCases/classifyUpload";
import { cellToJson } from "../../application/useCases/sqliteCells";
import { isSqliteBytes, isWalMode } from "../../application/useCases/sqliteFile";
import { openSqliteDatabase } from "./sqlJsDatabase";

describe("abrir una base SQLite como la de Flutter", () => {
  it("lista tablas y vistas con su número de filas y la versión del esquema", async () => {
    const db = await openSqliteDatabase("app.db", flutterLikeDb(), null);
    expect(db.info()).toMatchObject({ fileName: "app.db", userVersion: 3, walMode: false });
    expect(db.info().objects).toEqual([
      { name: "android_metadata", type: "table", rows: 1 },
      { name: "clientes", type: "table", rows: 2 },
      { name: "pedidos", type: "table", rows: 1 },
      { name: "v_resumen", type: "view", rows: 2 },
    ]);
  });

  it("consulta a JSON: tildes, BLOB en base64 y enteros grandes sin perder precisión", async () => {
    const db = await openSqliteDatabase("app.db", flutterLikeDb(), null);
    const result = db.query("SELECT c.nombre, p.foto, p.sync_id FROM pedidos p JOIN clientes c ON c.id = p.cliente_id", 100);
    expect(result.columns).toEqual(["nombre", "foto", "sync_id"]);
    expect(result.rows).toEqual([{ nombre: "Ñandú Pérez", foto: { blob: "iVBORw==", bytes: 4 }, sync_id: "9007199254740993" }]);
  });

  it("respeta el límite de filas, toma el último resultado y lanza errores de SQL legibles", async () => {
    const db = await openSqliteDatabase("app.db", flutterLikeDb(), null);
    expect(db.query("SELECT * FROM clientes", 1)).toMatchObject({ truncated: true, rows: [{ id: 1 }] });
    expect(db.query("SELECT 1 AS a; SELECT 2 AS b", 10).rows).toEqual([{ b: 2 }]);
    expect(() => db.query("SELECT * FROM no_existe", 10)).toThrow(/no such table/);
    expect(db.schema()).toContain("CREATE TABLE clientes");
  });

  it("modo WAL: sin el -wal faltan datos; con el -wal se recuperan", async () => {
    const { db, wal } = walDb(3000);
    expect(isWalMode(db)).toBe(true);
    const without = await openSqliteDatabase("live.db", db, null);
    expect(without.info().objects).toEqual([]);
    const withWal = await openSqliteDatabase("live.db", db, wal);
    expect(withWal.info().objects).toEqual([{ name: "t", type: "table", rows: 3000 }]);
    expect(withWal.info().walPagesApplied).toBeGreaterThan(0);
    expect(withWal.query("PRAGMA integrity_check", 1).rows).toEqual([{ integrity_check: "ok" }]);
  });
});

describe("classifyUploadUseCase", () => {
  it("reconoce el .db por su firma aunque venga dentro de un .zip comprimido, con su -wal", async () => {
    const { db, wal } = walDb(10);
    const zip = makeZip([
      { name: "prueba_recaudos/recaudos.db", bytes: db, deflate: true },
      { name: "prueba_recaudos/recaudos.db-wal", bytes: wal, deflate: true },
      { name: "__MACOSX/._recaudos.db", bytes: new Uint8Array([1, 2]) },
    ]);
    const plan = await classifyUploadUseCase([{ name: "prueba_recaudos_db.zip", bytes: zip }]);
    expect(plan).toMatchObject({ kind: "sqlite", name: "recaudos.db" });
    expect(plan.kind === "sqlite" && isSqliteBytes(plan.db) && plan.wal !== null).toBe(true);
  });

  it("texto (también dentro de un zip), -wal suelto y binarios no soportados", async () => {
    const json = new TextEncoder().encode('{"a":1}');
    expect(await classifyUploadUseCase([{ name: "datos.zip", bytes: makeZip([{ name: "datos.json", bytes: json }]) }])).toEqual({
      kind: "text", name: "datos.json", text: '{"a":1}',
    });
    expect(await classifyUploadUseCase([{ name: "x.db-wal", bytes: walDb(1).wal }])).toMatchObject({ kind: "error", message: /súbelo junto con su \.db/ });
    const binary = new Uint8Array(200).map((_, i) => (i % 7 === 0 ? 0 : 200 + (i % 50)));
    expect(await classifyUploadUseCase([{ name: "backup.bak", bytes: binary }])).toMatchObject({ kind: "error", message: /no es texto ni una base SQLite/ });
  });

  it("cellToJson: enteros seguros como número", () => {
    expect(cellToJson(BigInt(42))).toBe(42);
    expect(cellToJson(null)).toBeNull();
  });
});
