import type { IndentOption, JsonValue, SortOptions } from "../../domain/models/json";
import { toIndent } from "./transformJson";

// Se serializa directamente en el orden elegido: un objeto de JS siempre pondría primero
// las claves numéricas ("1", "10"…) y rompería, por ejemplo, el orden Z→A.

// Orden natural: compara los dígitos como números ("item2" < "item10") e ignora mayúsculas/tildes.
const collator = new Intl.Collator("es", { numeric: true, sensitivity: "base" });

/** Comparación natural de textos, con desempate exacto para que el orden sea siempre estable. */
export function compareNatural(a: string, b: string): number {
  return collator.compare(a, b) || (a < b ? -1 : a > b ? 1 : 0);
}

/** Rango por tipo para ordenar arrays mixtos: null < booleanos < números < textos < arrays < objetos. */
function typeRank(value: JsonValue): number {
  if (value === null) return 0;
  if (typeof value === "boolean") return 1;
  if (typeof value === "number") return 2;
  if (typeof value === "string") return 3;
  return Array.isArray(value) ? 4 : 5;
}

interface Item {
  value: JsonValue;
  text: string;
}

/** Números por valor, textos en orden natural, contenedores por su contenido ya ordenado. */
function compareItems(a: Item, b: Item): number {
  const byType = typeRank(a.value) - typeRank(b.value);
  if (byType !== 0) return byType;
  if (typeof a.value === "number" && typeof b.value === "number") return a.value - b.value;
  if (typeof a.value === "string" && typeof b.value === "string") return compareNatural(a.value, b.value);
  return compareNatural(a.text, b.text);
}

const isObject = (value: JsonValue): value is Record<string, JsonValue> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/**
 * Compara objetos por un campo. Los que no tienen el campo (o no son objetos) van siempre al
 * final, sin importar la dirección; entre iguales se conserva el orden original (sort estable).
 */
function compareByField(key: string, desc: boolean) {
  return (a: Item, b: Item): number => {
    const aHas = isObject(a.value) && key in a.value;
    const bHas = isObject(b.value) && key in b.value;
    if (!aHas || !bHas) return Number(!aHas) - Number(!bHas);
    const av = (a.value as Record<string, JsonValue>)[key];
    const bv = (b.value as Record<string, JsonValue>)[key];
    const result = compareItems({ value: av, text: JSON.stringify(av) }, { value: bv, text: JSON.stringify(bv) });
    return desc ? -result : result;
  };
}

function sortItems(items: Item[], options: SortOptions): void {
  const byField = options.byField;
  if (byField && items.some((item) => isObject(item.value) && byField.key in item.value)) {
    items.sort(compareByField(byField.key, byField.desc));
  } else if (options.arrays) {
    items.sort(compareItems);
  }
}

function orderKeys(keys: string[], order: SortOptions["keys"]): string[] {
  if (order === "original") return keys;
  const sorted = [...keys].sort(compareNatural);
  return order === "desc" ? sorted.reverse() : sorted;
}

function serialize(value: JsonValue, options: SortOptions, unit: string, depth: number): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  const pad = unit.repeat(depth + 1);
  const close = unit.repeat(depth);

  if (Array.isArray(value)) {
    const items = value.map((item) => ({ value: item, text: serialize(item, options, unit, depth + 1) }));
    sortItems(items, options);
    return items.length === 0 ? "[]" : `[\n${items.map((i) => pad + i.text).join(",\n")}\n${close}]`;
  }

  const keys = orderKeys(Object.keys(value), options.keys);
  const entries = keys.map((key) => `${pad}${JSON.stringify(key)}: ${serialize(value[key], options, unit, depth + 1)}`);
  return entries.length === 0 ? "{}" : `{\n${entries.join(",\n")}\n${close}}`;
}

/** Devuelve el JSON formateado y ordenado en profundidad según las opciones. */
export function sortJsonUseCase(value: JsonValue, options: SortOptions, indent: IndentOption): string {
  const size = toIndent(indent);
  return serialize(value, options, typeof size === "number" ? " ".repeat(size) : size, 0);
}
