import type { KeyOrder, SortOptions } from "../../domain/models/json";

export const KEY_ORDER_OPTIONS: { value: KeyOrder; label: string }[] = [
  { value: "original", label: "Claves: orden original" },
  { value: "asc", label: "Claves A → Z" },
  { value: "desc", label: "Claves Z → A" },
];

export interface SortPreset {
  id: string;
  label: string;
  hint: string;
  options: SortOptions;
}

export const SORT_PRESETS: SortPreset[] = [
  { id: "keys-asc", label: "Claves A → Z", hint: "item2 antes que item10", options: { keys: "asc", arrays: false } },
  { id: "keys-desc", label: "Claves Z → A", hint: "orden natural inverso", options: { keys: "desc", arrays: false } },
  { id: "arrays", label: "Valores de los arrays", hint: "números por valor: 2, 9, 10", options: { keys: "original", arrays: true } },
  { id: "all", label: "Claves A → Z y arrays", hint: "todo ordenado", options: { keys: "asc", arrays: true } },
];

export const DEFAULT_DIFF_SORT: SortOptions = { keys: "original", arrays: false };
