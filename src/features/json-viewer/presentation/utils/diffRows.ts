import type { DiffOp } from "../../domain/models/diff";
import { tokenizeJson, type Token } from "./highlight";

export type DiffCellKind = "equal" | "removed" | "added" | "empty";

export interface DiffCellVM {
  number: number | null;
  tokens: Token[];
  kind: DiffCellKind;
}

export interface DiffRowVM {
  id: number;
  left: DiffCellVM;
  right: DiffCellVM;
}

export interface DiffTable {
  rows: DiffRowVM[];
  added: number;
  removed: number;
}

const EMPTY_CELL: DiffCellVM = { number: null, tokens: [], kind: "empty" };

const cell = (number: number, text: string, kind: DiffCellKind): DiffCellVM => ({ number, tokens: tokenizeJson(text), kind });

/**
 * Convierte las operaciones en filas lado a lado. Un bloque de borrados seguido de agregados
 * se empareja fila a fila; el lado más corto se rellena con celdas vacías.
 */
export function buildDiffRows(ops: DiffOp[]): DiffTable {
  const rows: DiffRowVM[] = [];
  let leftLine = 0;
  let rightLine = 0;
  let removed: string[] = [];
  let added: string[] = [];
  let totalAdded = 0;
  let totalRemoved = 0;

  const flush = () => {
    for (let i = 0; i < Math.max(removed.length, added.length); i++) {
      const left = i < removed.length ? cell(++leftLine, removed[i], "removed") : EMPTY_CELL;
      const right = i < added.length ? cell(++rightLine, added[i], "added") : EMPTY_CELL;
      rows.push({ id: rows.length, left, right });
    }
    totalRemoved += removed.length;
    totalAdded += added.length;
    removed = [];
    added = [];
  };

  for (const op of ops) {
    if (op.type === "delete") removed.push(op.text);
    else if (op.type === "insert") added.push(op.text);
    else {
      flush();
      rows.push({ id: rows.length, left: cell(++leftLine, op.text, "equal"), right: cell(++rightLine, op.text, "equal") });
    }
  }
  flush();
  return { rows, added: totalAdded, removed: totalRemoved };
}
