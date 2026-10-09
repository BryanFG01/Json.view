import type { JsonValue } from "../../domain/models/json";

/** Valor de una celda tal como lo entrega sql.js (con useBigInt para no perder precisión). */
export type SqliteCell = number | bigint | string | Uint8Array | null;

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

/**
 * Celda → JSON. Enteros dentro del rango seguro como número; los más grandes (IDs de sincronización,
 * timestamps en ns…) como texto exacto; BLOB como { blob: base64, bytes }.
 */
export function cellToJson(cell: SqliteCell): JsonValue {
  if (typeof cell === "bigint") {
    return cell >= BigInt(Number.MIN_SAFE_INTEGER) && cell <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(cell) : cell.toString();
  }
  if (cell instanceof Uint8Array) return { blob: toBase64(cell), bytes: cell.length };
  return cell;
}

export function rowToJson(columns: string[], values: SqliteCell[]): { [key: string]: JsonValue } {
  return Object.fromEntries(columns.map((column, i) => [column, cellToJson(values[i])]));
}
