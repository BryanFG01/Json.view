import type { JsonKind, JsonValue } from "../../domain/models/json";

export interface TreeNodeVM {
  id: string;
  /** Texto ya listo para pintar: `"clave":` en objetos o `0:` en arrays. Null en la raíz. */
  label: string | null;
  labelIsIndex: boolean;
  kind: JsonKind;
  /** Valor primitivo formateado, o resumen `{3}` / `[5]` para contenedores. */
  preview: string;
  open: boolean;
  children: TreeNodeVM[] | null;
}

interface BuildOptions {
  openDepth: number;
  label?: string | null;
  labelIsIndex?: boolean;
  path?: string;
  depth?: number;
}

export function getKind(value: JsonValue): JsonKind {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value as "object" | "string" | "number" | "boolean";
}

function entriesOf(value: JsonValue, kind: JsonKind): [string, JsonValue][] {
  if (kind === "array") return (value as JsonValue[]).map((item, i) => [String(i), item]);
  return Object.entries(value as Record<string, JsonValue>);
}

function formatLabel(label: string | null, isIndex: boolean): string | null {
  if (label === null) return null;
  return isIndex ? `${label}:` : `${JSON.stringify(label)}:`;
}

/** Recorre el valor recursivamente y genera el view model del árbol. */
export function buildTree(value: JsonValue, options: BuildOptions): TreeNodeVM {
  const { openDepth, label = null, labelIsIndex = false, path = "$", depth = 0 } = options;
  const kind = getKind(value);
  const base = { id: path, label: formatLabel(label, labelIsIndex), labelIsIndex, kind };

  if (kind !== "object" && kind !== "array") {
    const preview = kind === "string" ? JSON.stringify(value) : String(value);
    return { ...base, preview, open: false, children: null };
  }

  const entries = entriesOf(value, kind);
  const children = entries.map(([key, child], i) =>
    buildTree(child, { openDepth, label: key, labelIsIndex: kind === "array", path: `${path}.${i}`, depth: depth + 1 }),
  );
  const preview = kind === "array" ? `[${entries.length}]` : `{${entries.length}}`;
  return { ...base, preview, open: depth < openDepth, children };
}
