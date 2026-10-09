// Fixtures binarios para tests: bases SQLite reales (node:sqlite) y .zip construidos a mano.
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { deflateRawSync } from "node:zlib";

/** Base como la de una app Flutter (sqflite): android_metadata, user_version, FK, vista, BLOB. */
export function flutterLikeDb(): Uint8Array {
  const dir = mkdtempSync(join(tmpdir(), "jv-"));
  const path = join(dir, "app.db");
  const db = new DatabaseSync(path);
  db.exec(`
    CREATE TABLE android_metadata (locale TEXT); INSERT INTO android_metadata VALUES ('es_CO');
    PRAGMA user_version = 3;
    CREATE TABLE clientes (id INTEGER PRIMARY KEY, nombre TEXT NOT NULL, saldo REAL);
    CREATE TABLE pedidos (id INTEGER PRIMARY KEY, cliente_id INTEGER REFERENCES clientes(id), foto BLOB, sync_id INTEGER);
    CREATE VIEW v_resumen AS SELECT c.nombre, COUNT(p.id) AS pedidos FROM clientes c LEFT JOIN pedidos p ON p.cliente_id = c.id GROUP BY c.id;
    INSERT INTO clientes VALUES (1, 'Ñandú Pérez', 10.5), (2, 'Ana', 0);
  `);
  db.prepare("INSERT INTO pedidos VALUES (1, 1, ?, 9007199254740993)").run(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  db.close();
  const bytes = new Uint8Array(readFileSync(path));
  rmSync(dir, { recursive: true, force: true });
  return bytes;
}

/** Base en modo WAL con los datos aún solo en el -wal (como copiarla con la app abierta). */
export function walDb(rows: number): { db: Uint8Array; wal: Uint8Array } {
  const dir = mkdtempSync(join(tmpdir(), "jv-"));
  const path = join(dir, "live.db");
  const live = new DatabaseSync(path);
  live.exec(`PRAGMA journal_mode=WAL; PRAGMA wal_autocheckpoint=0; CREATE TABLE t(id INTEGER PRIMARY KEY, v TEXT);
    WITH RECURSIVE n(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM n WHERE x < ${rows}) INSERT INTO t(v) SELECT 'fila ' || x FROM n;`);
  copyFileSync(path, join(dir, "copy.db"));
  copyFileSync(`${path}-wal`, join(dir, "copy.db-wal"));
  live.close();
  const result = { db: new Uint8Array(readFileSync(join(dir, "copy.db"))), wal: new Uint8Array(readFileSync(join(dir, "copy.db-wal"))) };
  rmSync(dir, { recursive: true, force: true });
  return result;
}

/** .zip mínimo (local headers + directorio central). `deflate` comprime con el método 8. */
export function makeZip(files: { name: string; bytes: Uint8Array; deflate?: boolean }[]): Uint8Array {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file.name);
    const data = file.deflate ? deflateRawSync(file.bytes) : Buffer.from(file.bytes);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(file.deflate ? 8 : 0, 8);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(file.bytes.length, 22);
    local.writeUInt16LE(name.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(file.deflate ? 8 : 0, 10);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(file.bytes.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    locals.push(local, name, data);
    centrals.push(central, name);
    offset += 30 + name.length + data.length;
  }
  const centralDir = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDir.length, 12);
  end.writeUInt32LE(offset, 16);
  return new Uint8Array(Buffer.concat([...locals, centralDir, end]));
}
