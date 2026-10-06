/** Contenido de un tooltip: título, explicación y atajo opcional. */
export interface Tip {
  title: string;
  desc: string;
  keys?: string;
  /** Explicación alternativa cuando el control está desactivado (por qué no se puede usar). */
  disabledHint?: string;
}

export interface TooltipState {
  title: string;
  desc: string | null;
  keys: string | null;
  style: { left: number; top?: number; bottom?: number };
  placement: "below" | "above";
}

/** Atributos `data-tip*` que lee el tooltip global (ver useTooltip). */
export function tipAttrs(tip: Tip, disabled = false) {
  return {
    "data-tip": tip.title,
    "data-tip-desc": disabled && tip.disabledHint ? tip.disabledHint : tip.desc,
    "data-tip-keys": tip.keys,
  };
}

const MARGIN = 8;
const HALF_WIDTH = 140;
const EXPECTED_HEIGHT = 90;
const GAP = 6;

/** Coloca el tooltip centrado bajo el elemento (o encima si no cabe), sin salirse de la pantalla. */
export function placeTooltip(rect: DOMRect, viewport: { width: number; height: number }): Pick<TooltipState, "style" | "placement"> {
  const center = rect.left + rect.width / 2;
  const left = Math.min(Math.max(center, HALF_WIDTH + MARGIN), viewport.width - HALF_WIDTH - MARGIN);
  if (rect.bottom + GAP + EXPECTED_HEIGHT <= viewport.height) {
    return { placement: "below", style: { left, top: rect.bottom + GAP } };
  }
  return { placement: "above", style: { left, bottom: viewport.height - rect.top + GAP } };
}

/** Lee el tooltip de un elemento con `data-tip`. */
export function readTooltip(el: HTMLElement): TooltipState {
  const { tip = "", tipDesc, tipKeys } = el.dataset;
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  return { title: tip, desc: tipDesc || null, keys: tipKeys || null, ...placeTooltip(el.getBoundingClientRect(), viewport) };
}
