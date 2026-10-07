"use client";

import { useCallback, useMemo, useState, type MouseEvent } from "react";
import type { SortOptions, SortTarget } from "../../domain/models/json";
import { useEscapeKey } from "./useEscapeKey";

interface Anchor {
  top: number;
  left: number;
}

export interface SortContext {
  /** "Líneas 15–31" si el cursor está en un bloque; null si no hay bloque. */
  blockLabel: string | null;
  /** Campos de los arrays de objetos del JSON (se calculan al abrir el menú). */
  getArrayFields: () => string[];
}

const MENU_WIDTH = 288;

/**
 * Menú "Ordenar" de la barra: a qué se aplica (todo / bloque del cursor), atajos de orden y
 * orden de arrays de objetos por campo. Se posiciona con `fixed` desde el botón para que la
 * barra no lo recorte.
 */
export function useSortMenu(onSort: (options: SortOptions, target: SortTarget) => void, context: SortContext) {
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [target, setTarget] = useState<SortTarget>("all");
  const [field, setField] = useState("");
  const [desc, setDesc] = useState(false);
  const close = useCallback(() => setAnchor(null), []);
  useEscapeKey(anchor !== null, close);

  const isOpen = anchor !== null;
  const { blockLabel, getArrayFields } = context;
  const fields = useMemo(() => (isOpen ? getArrayFields() : []), [isOpen, getArrayFields]);
  const selectedField = fields.includes(field) ? field : (fields[0] ?? "");
  const effectiveTarget: SortTarget = blockLabel ? target : "all";

  const toggle = (event: MouseEvent<HTMLButtonElement>) => {
    if (anchor) return close();
    const rect = event.currentTarget.getBoundingClientRect();
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - MENU_WIDTH - 8));
    setAnchor({ top: rect.bottom + 4, left });
  };
  const apply = (options: SortOptions) => {
    onSort(options, effectiveTarget);
    close();
  };

  return {
    isOpen,
    menuStyle: anchor ? { top: anchor.top, left: anchor.left, width: MENU_WIDTH, maxHeight: `calc(100dvh - ${anchor.top + 8}px)` } : undefined,
    toggle,
    close,
    choose: apply,
    target: effectiveTarget,
    setTarget,
    blockLabel,
    fields,
    field: selectedField,
    setField,
    desc,
    setDesc,
    sortByField: () => {
      if (selectedField) apply({ keys: "original", arrays: false, byField: { key: selectedField, desc } });
    },
  };
}
