import type { JsonKind, JsonValue } from "../../domain/models/json";

/** Máximo de hijos que se muestran juntos; por encima se agrupan en rangos `[0 … 99]`. */
export const TREE_CHUNK = 100;

/** Nodo del árbol. Los hijos NO se calculan aquí: se piden con `childrenOf` solo al abrirlo. */
export interface TreeNodeVM {
  id: string;
  /** Texto ya listo para pintar: `"clave":`, `0:` o el rango `[0 … 99]`. Null en la raíz. */
  label: string | null;
  labelIsIndex: boolean;
  kind: JsonKind | "group";
  /** Valor primitivo formateado, o resumen `{3}` / `[5]` para contenedores y grupos. */
  preview: string;
  depth: number;
  defaultOpen: boolean;
  /** Contenedor (o grupo) del que salen los hijos, con el rango de entradas que le toca. */
  source: { value: JsonValue; from: number; to: number } | null;
}

export function getKind(value: JsonValue): JsonKind {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value as "object" | "string" | "number" | "boolean";
}

function sizeOf(value: JsonValue): number {
  return Array.isArray(value) ? value.length : Object.keys(value as object).length;
}

function entriesOf(value: JsonValue, from: number, to: number): [string, JsonValue][] {
  if (Array.isArray(value)) return value.slice(from, to).map((item, i) => [String(from + i), item]);
  return Object.entries(value as Record<string, JsonValue>).slice(from, to);
}

function formatLabel(label: string, isIndex: boolean): string {
  return isIndex ? `${label}:` : `${JSON.stringify(label)}:`;
}

interface NodeOptions {
  label: string | null;
  labelIsIndex: boolean;
  id: string;
  depth: number;
  openDepth: number;
}

function createNode(value: JsonValue, { label, labelIsIndex, id, depth, openDepth }: NodeOptions): TreeNodeVM {
  const kind = getKind(value);
  const base = { id, label: label === null ? null : formatLabel(label, labelIsIndex), labelIsIndex, kind, depth };
  if (kind !== "object" && kind !== "array") {
    const preview = kind === "string" ? JSON.stringify(value) : String(value);
    return { ...base, preview, defaultOpen: false, source: null };
  }
  const size = sizeOf(value);
  const preview = kind === "array" ? `[${size}]` : `{${size}}`;
  return { ...base, preview, defaultOpen: depth < openDepth, source: { value, from: 0, to: size } };
}

export function createRoot(value: JsonValue, openDepth: number): TreeNodeVM {
  return createNode(value, { label: null, labelIsIndex: false, id: "$", depth: 0, openDepth });
}

function createGroups(node: TreeNodeVM, openDepth: number): TreeNodeVM[] {
  const { value, from, to } = node.source!;
  const step = to - from > TREE_CHUNK * TREE_CHUNK ? TREE_CHUNK * TREE_CHUNK : TREE_CHUNK;
  const groups: TreeNodeVM[] = [];
  for (let start = from; start < to; start += step) {
    const end = Math.min(start + step, to);
    groups.push({
      id: `${node.id}[${start}-${end}]`,
      label: `[${start} … ${end - 1}]`,
      labelIsIndex: true,
      kind: "group",
      preview: `${end - start} elementos`,
      depth: node.depth,
      defaultOpen: start === from && node.depth < openDepth,
      source: { value, from: start, to: end },
    });
  }
  return groups;
}

/** Hijos de un nodo abierto. Si son muchos, devuelve grupos de rangos en lugar de los nodos. */
export function childrenOf(node: TreeNodeVM, openDepth: number): TreeNodeVM[] {
  if (!node.source) return [];
  const { value, from, to } = node.source;
  if (to - from > TREE_CHUNK) return createGroups(node, openDepth);
  // Los grupos comparten profundidad con su contenedor, así que sus hijos quedan un nivel más abajo.
  const options = { labelIsIndex: Array.isArray(value), depth: node.depth + 1, openDepth };
  return entriesOf(value, from, to).map(([key, child], i) =>
    createNode(child, { ...options, label: key, id: `${node.id}.${from + i}` }),
  );
}
