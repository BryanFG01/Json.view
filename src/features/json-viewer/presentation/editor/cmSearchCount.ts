import type { SearchQuery } from "@codemirror/search";
import type { EditorState } from "@codemirror/state";

/** Por encima de esto se deja de contar ("5000+") para no frenar JSON enormes en cada tecla. */
export const MAX_COUNTED_MATCHES = 5000;

export interface MatchCount {
  total: number;
  /** Posición (1-based) de la coincidencia seleccionada, o 0 si el cursor no está en una. */
  current: number;
  capped: boolean;
}

export function countMatches(query: SearchQuery, state: EditorState): MatchCount {
  if (!query.search || !query.valid) return { total: 0, current: 0, capped: false };
  const { from, to } = state.selection.main;
  const cursor = query.getCursor(state);
  let total = 0;
  let current = 0;
  for (let step = cursor.next(); !step.done; step = cursor.next()) {
    total++;
    if (step.value.from === from && step.value.to === to) current = total;
    if (total >= MAX_COUNTED_MATCHES) return { total, current, capped: true };
  }
  return { total, current, capped: false };
}

/** Texto del contador: "3 de 12", "12 resultados", "Sin resultados", "Regex no válida"… */
export function describeCount(query: SearchQuery, count: MatchCount): string {
  if (!query.search) return "";
  if (!query.valid) return "Regex no válida";
  if (count.total === 0) return "Sin resultados";
  const total = `${count.total.toLocaleString("es")}${count.capped ? "+" : ""}`;
  if (count.current > 0) return `${count.current} de ${total}`;
  return count.total === 1 && !count.capped ? "1 resultado" : `${total} resultados`;
}
