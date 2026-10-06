import type { DiffOp } from "../../domain/models/diff";

/** Si hay más ediciones que esto, se reporta como "todo borrado / todo agregado" para no bloquear la UI. */
const MAX_EDIT_DISTANCE = 4000;

const equal = (text: string): DiffOp => ({ type: "equal", text });
const removed = (text: string): DiffOp => ({ type: "delete", text });
const added = (text: string): DiffOp => ({ type: "insert", text });

/** Recorre hacia atrás las fotos de V guardadas por Myers para reconstruir las operaciones. */
function backtrack(trace: Int32Array[], a: string[], b: string[]): DiffOp[] {
  const ops: DiffOp[] = [];
  let x = a.length;
  let y = b.length;
  for (let d = trace.length - 1; d >= 0; d--) {
    const v = trace[d];
    const at = (k: number) => v[k + d];
    const k = x - y;
    const prevK = k === -d || (k !== d && at(k - 1) < at(k + 1)) ? k + 1 : k - 1;
    const prevX = d === 0 ? 0 : at(prevK);
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) {
      x--;
      y--;
      ops.push(equal(a[x]));
    }
    if (d > 0) ops.push(x === prevX ? added(b[prevY]) : removed(a[prevX]));
    x = prevX;
    y = prevY;
  }
  return ops.reverse();
}

/** Algoritmo de Myers O(ND): mínimo número de líneas agregadas/borradas. */
function myers(a: string[], b: string[]): DiffOp[] {
  const n = a.length;
  const m = b.length;
  const max = Math.min(n + m, MAX_EDIT_DISTANCE);
  const offset = n + m + 1;
  const v = new Int32Array(2 * offset + 1);
  const trace: Int32Array[] = [];

  for (let d = 0; d <= max; d++) {
    trace.push(v.slice(offset - d, offset + d + 1));
    for (let k = -d; k <= d; k += 2) {
      let x = k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1]) ? v[offset + k + 1] : v[offset + k - 1] + 1;
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) {
        x++;
        y++;
      }
      v[offset + k] = x;
      if (x >= n && y >= m) return backtrack(trace, a, b);
    }
  }
  return [...a.map(removed), ...b.map(added)];
}

/** Diferencia línea a línea entre dos textos. Recorta prefijo/sufijo comunes antes de Myers. */
export function diffLinesUseCase(left: string, right: string): DiffOp[] {
  const a = left.split("\n");
  const b = right.split("\n");
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }
  const middle = myers(a.slice(start, endA), b.slice(start, endB));
  return [...a.slice(0, start).map(equal), ...middle, ...a.slice(endA).map(equal)];
}
