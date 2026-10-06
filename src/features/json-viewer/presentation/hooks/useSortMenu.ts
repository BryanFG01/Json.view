"use client";

import { useCallback, useState, type MouseEvent } from "react";
import type { SortOptions } from "../../domain/models/json";
import { useEscapeKey } from "./useEscapeKey";

interface Anchor {
  top: number;
  left: number;
}

const MENU_WIDTH = 256;

/**
 * Menú "Ordenar" de la barra. Se posiciona con `fixed` desde el botón porque la barra tiene
 * scroll horizontal y recortaría un menú absoluto.
 */
export function useSortMenu(onSort: (options: SortOptions) => void) {
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const close = useCallback(() => setAnchor(null), []);
  useEscapeKey(anchor !== null, close);

  const toggle = (event: MouseEvent<HTMLButtonElement>) => {
    if (anchor) return close();
    const rect = event.currentTarget.getBoundingClientRect();
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - MENU_WIDTH - 8));
    setAnchor({ top: rect.bottom + 4, left });
  };

  return {
    isOpen: anchor !== null,
    menuStyle: anchor ? { top: anchor.top, left: anchor.left, width: MENU_WIDTH } : undefined,
    toggle,
    close,
    choose: (options: SortOptions) => {
      onSort(options);
      close();
    },
  };
}
