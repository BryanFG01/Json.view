import type { DiffOp } from "../../domain/models/diff";

export type DiffCellKind = "equal" | "removed" | "added" | "empty";

/** Celda sin colorear: el coloreado se hace solo para las filas que se muestran (ver diffView.ts). */
export interface DiffCellData {
  number: number | null;
  text: string;
  kind: DiffCellKind;
}

export interface DiffRowData {
  left: DiffCellData;
  right: DiffCellData;
}

export interface DiffTable {
  rows: DiffRowData[];
  added: number;
  removed: number;
}

const EMPTY_CELL: DiffCellData = { number: null, text: "", kind: "empty" };

/**
 * Convierte las operaciones en filas lado a lado. Un bloque de borrados seguido de agregados
 * se empareja fila a fila; el lado más corto se rellena con celdas vacías.
 */
export function buildDiffRows(ops: DiffOp[]): DiffTable {
  const rows: DiffRowData[] = [];
  let leftLine = 0;
  let rightLine = 0;
  let removed: string[] = [];
  let added: string[] = [];
  let totalAdded = 0;
  let totalRemoved = 0;

  const flush = () => {
    for (let i = 0; i < Math.max(removed.length, added.length); i++) {
      const left: DiffCellData = i < removed.length ? { number: ++leftLine, text: removed[i], kind: "removed" } : EMPTY_CELL;
      const right: DiffCellData = i < added.length ? { number: ++rightLine, text: added[i], kind: "added" } : EMPTY_CELL;
      rows.push({ left, right });
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
      rows.push({
        left: { number: ++leftLine, text: op.text, kind: "equal" },
        right: { number: ++rightLine, text: op.text, kind: "equal" },
      });
    }
  }
  flush();
  return { rows, added: totalAdded, removed: totalRemoved };
}

export const isChangedRow = (row: DiffRowData) => row.left.kind !== "equal" || row.right.kind !== "equal";
