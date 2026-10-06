"use client";

import { useCallback, useRef, useState } from "react";

const MAX_HISTORY = 200;
/** Las pulsaciones seguidas dentro de esta ventana cuentan como un solo paso de deshacer. */
const TYPING_WINDOW_MS = 600;

interface HistoryState {
  past: string[];
  present: string;
  future: string[];
}

export function useTextHistory(initial = "") {
  const [state, setState] = useState<HistoryState>({ past: [], present: initial, future: [] });
  const lastTypedAt = useRef(0);

  const commit = useCallback((next: string, coalesce: boolean) => {
    setState((s) => {
      if (next === s.present) return s;
      const past = coalesce ? s.past : [...s.past, s.present].slice(-MAX_HISTORY);
      return { past, present: next, future: [] };
    });
  }, []);

  /** Cambio puntual (formatear, subir archivo…): siempre crea un paso de historial. */
  const replace = useCallback((next: string) => {
    lastTypedAt.current = 0;
    commit(next, false);
  }, [commit]);

  /** Escritura del usuario: agrupa las teclas consecutivas. */
  const type = useCallback((next: string) => {
    const now = Date.now();
    const coalesce = now - lastTypedAt.current < TYPING_WINDOW_MS;
    lastTypedAt.current = now;
    commit(next, coalesce);
  }, [commit]);

  const undo = useCallback(() => {
    lastTypedAt.current = 0;
    setState((s) => (s.past.length === 0 ? s : {
      past: s.past.slice(0, -1),
      present: s.past[s.past.length - 1],
      future: [s.present, ...s.future],
    }));
  }, []);

  const redo = useCallback(() => {
    lastTypedAt.current = 0;
    setState((s) => (s.future.length === 0 ? s : {
      past: [...s.past, s.present],
      present: s.future[0],
      future: s.future.slice(1),
    }));
  }, []);

  return {
    text: state.present,
    replace,
    type,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
