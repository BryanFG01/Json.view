// Archivos SQLite (.db de Flutter/sqflite, Drift, Android…): firma, modo WAL y checkpoint manual.

const SQLITE_MAGIC = "SQLite format 3\u0000";
const WAL_MAGIC_LE = 0x377f0682;
const WAL_MAGIC_BE = 0x377f0683;

export function isSqliteBytes(bytes: Uint8Array): boolean {
  if (bytes.length < 100) return false;
  for (let i = 0; i < SQLITE_MAGIC.length; i++) if (bytes[i] !== SQLITE_MAGIC.charCodeAt(i)) return false;
  return true;
}

/** Bytes 18-19 = 2: la base usa WAL; sus últimos cambios pueden estar solo en el archivo -wal. */
export function isWalMode(bytes: Uint8Array): boolean {
  return bytes[18] === 2 || bytes[19] === 2;
}

export function isWalBytes(bytes: Uint8Array): boolean {
  if (bytes.length < 32) return false;
  const magic = new DataView(bytes.buffer, bytes.byteOffset, 4).getUint32(0);
  return magic === WAL_MAGIC_LE || magic === WAL_MAGIC_BE;
}

/** Checksum del WAL (formato SQLite): pares de enteros de 32 bits en el orden de bytes indicado. */
function walChecksum(view: DataView, offset: number, length: number, bigEndian: boolean, seed: [number, number]): [number, number] {
  let [s0, s1] = seed;
  for (let i = offset; i < offset + length; i += 8) {
    s0 = (s0 + view.getUint32(i, !bigEndian) + s1) >>> 0;
    s1 = (s1 + view.getUint32(i + 4, !bigEndian) + s0) >>> 0;
  }
  return [s0, s1];
}

/** Páginas de las transacciones confirmadas del WAL (las incompletas o corruptas se ignoran). */
function committedFrames(wal: Uint8Array): { pages: Map<number, Uint8Array>; dbPages: number; pageSize: number } {
  const view = new DataView(wal.buffer, wal.byteOffset, wal.byteLength);
  const bigEndian = view.getUint32(0) === WAL_MAGIC_BE;
  const pageSize = view.getUint32(8);
  const salt = [view.getUint32(16), view.getUint32(20)];
  let sum = walChecksum(view, 0, 24, bigEndian, [0, 0]);
  const empty = { pages: new Map<number, Uint8Array>(), dbPages: 0, pageSize };
  if (sum[0] !== view.getUint32(24) || sum[1] !== view.getUint32(28)) return empty;

  const pending = new Map<number, Uint8Array>();
  let result = empty;
  for (let off = 32; off + 24 + pageSize <= wal.length; off += 24 + pageSize) {
    if (view.getUint32(off + 8) !== salt[0] || view.getUint32(off + 12) !== salt[1]) break;
    sum = walChecksum(view, off, 8, bigEndian, sum);
    sum = walChecksum(view, off + 24, pageSize, bigEndian, sum);
    if (sum[0] !== view.getUint32(off + 16) || sum[1] !== view.getUint32(off + 20)) break;
    pending.set(view.getUint32(off), wal.subarray(off + 24, off + 24 + pageSize));
    const commitSize = view.getUint32(off + 4);
    if (commitSize > 0) result = { pages: new Map(pending), dbPages: commitSize, pageSize };
  }
  return result;
}

/**
 * Aplica el archivo -wal sobre el .db (lo que hace SQLite en un checkpoint) y deja la base en
 * modo clásico, para abrirla sin el -wal. Devuelve también cuántas páginas se aplicaron.
 */
export function applyWalUseCase(db: Uint8Array, wal: Uint8Array): { bytes: Uint8Array; pagesApplied: number } {
  if (!isWalBytes(wal)) return { bytes: db, pagesApplied: 0 };
  const { pages, dbPages, pageSize } = committedFrames(wal);
  if (dbPages === 0) return { bytes: db, pagesApplied: 0 };
  const out = new Uint8Array(dbPages * pageSize);
  out.set(db.subarray(0, Math.min(db.length, out.length)));
  for (const [pgno, data] of pages) if (pgno <= dbPages) out.set(data, (pgno - 1) * pageSize);
  out[18] = 1;
  out[19] = 1;
  new DataView(out.buffer).setUint32(28, dbPages);
  return { bytes: out, pagesApplied: pages.size };
}
