import { isChangedRow, type DiffCellData, type DiffRowData } from "./diffRows";
import { tokenizeJson, type Token } from "./highlight";

/** Líneas iguales que se muestran alrededor de cada cambio. */
export const DIFF_CONTEXT = 3;
/** Líneas sin cambios que revela cada clic en "Mostrar…". */
export const DIFF_REVEAL_STEP = 500;
/** Filas que se dibujan como máximo antes de pedir "Mostrar más". */
export const DIFF_PAGE = 2000;

export interface DiffCellVM extends DiffCellData {
  tokens: Token[];
}

export type DiffItem =
  | { type: "row"; id: string; left: DiffCellVM; right: DiffCellVM }
  | { type: "gap"; id: string; hidden: number; label: string };

export interface DiffViewModel {
  items: DiffItem[];
  /** Filas que quedaron fuera por el límite de página. */
  remaining: number;
  moreLabel: string | null;
}

const count = (n: number) => n.toLocaleString("es");

type Tokenizer = (text: string) => Token[];

/** Marca qué filas quedan a DIFF_CONTEXT o menos de algún cambio (dos pasadas, O(n)). */
function visibleMask(rows: DiffRowData[]): boolean[] {
  const mask = new Array<boolean>(rows.length).fill(false);
  let distance = Infinity;
  for (let i = 0; i < rows.length; i++) {
    distance = isChangedRow(rows[i]) ? 0 : distance + 1;
    mask[i] = distance <= DIFF_CONTEXT;
  }
  distance = Infinity;
  for (let i = rows.length - 1; i >= 0; i--) {
    distance = isChangedRow(rows[i]) ? 0 : distance + 1;
    if (distance <= DIFF_CONTEXT) mask[i] = true;
  }
  return mask;
}

/**
 * Vista de la comparación: cambios con contexto, bloques iguales colapsados (`gap`) que se
 * revelan por partes, y un máximo de `limit` filas dibujadas. Solo se colorean las filas visibles.
 */
export function buildDiffView(
  rows: DiffRowData[],
  revealed: Record<string, number>,
  limit: number,
  tokenize: Tokenizer = tokenizeJson,
): DiffViewModel {
  const mask = visibleMask(rows);
  const items: DiffItem[] = [];
  let drawn = 0;
  let i = 0;

  const withTokens = (cell: DiffCellData): DiffCellVM => ({ ...cell, tokens: tokenize(cell.text) });
  const pushRow = (index: number) => {
    items.push({ type: "row", id: `r${index}`, left: withTokens(rows[index].left), right: withTokens(rows[index].right) });
    drawn++;
  };

  while (i < rows.length && drawn < limit) {
    if (mask[i]) {
      pushRow(i++);
      continue;
    }
    const start = i;
    while (i < rows.length && !mask[i]) i++;
    const id = `g${start}`;
    const shown = Math.min(revealed[id] ?? 0, i - start, limit - drawn);
    for (let k = start; k < start + shown; k++) pushRow(k);
    const hidden = i - start - shown;
    if (hidden > 0) items.push({ type: "gap", id, hidden, label: `Mostrar ${count(Math.min(hidden, DIFF_REVEAL_STEP))} de ${count(hidden)} líneas sin cambios` });
  }
  const remaining = rows.length - i;
  return { items, remaining, moreLabel: remaining > 0 ? `Mostrar más (${count(remaining)} líneas restantes)` : null };
}
