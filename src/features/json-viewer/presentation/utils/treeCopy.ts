import type { JsonValue } from "../../domain/models/json";
import type { TreeNodeVM } from "./jsonTree";

/** Valor que representa el nodo; para un grupo `[100 … 199]`, solo los elementos de ese rango. */
export function nodeValue(node: TreeNodeVM): JsonValue {
  if (node.kind !== "group" || !node.source) return node.value;
  const { value, from, to } = node.source;
  if (Array.isArray(value)) return value.slice(from, to);
  return Object.fromEntries(Object.entries(value as Record<string, JsonValue>).slice(from, to));
}

/**
 * Texto a copiar: objetos y arrays como JSON formateado; números, booleanos y null tal cual;
 * los textos sin comillas (lo útil al copiar una URL, un id, un email…).
 */
export function nodeCopyText(node: TreeNodeVM): string {
  const value = nodeValue(node);
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

/** Nombre accesible del botón: `Copiar "autor"`, `Copiar 3`, `Copiar [0 … 99]` o `Copiar todo`. */
export function nodeCopyLabel(node: TreeNodeVM): string {
  if (node.label === null) return "Copiar todo";
  return `Copiar ${node.label.replace(/:$/, "")}`;
}
