"use client";

import { openSearchPanel } from "@codemirror/search";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { useCallback, useEffect, useRef } from "react";
import { setErrorOffset } from "../editor/cmErrorLine";
import { buildExtensions, externalChange, type EditorCallbacks } from "../editor/cmExtensions";

interface CodeMirrorParams extends EditorCallbacks {
  text: string;
  errorOffset: number | null;
  autoFocus: boolean;
  placeholder: string;
  /** Petición de abrir el buscador de este editor (Ctrl+F fuera del editor o botón Buscar). */
  searchPending: boolean;
  onSearchOpened: () => void;
}

/**
 * Monta CodeMirror como vista "controlada": React (useTextHistory) es la fuente de verdad.
 * Lo que escribe el usuario sube por onChange; los cambios externos bajan con `externalChange`.
 */
export function useCodeMirror(params: CodeMirrorParams) {
  const { text, errorOffset, autoFocus, placeholder, searchPending, onSearchOpened, ...callbacks } = params;
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const callbacksRef = useRef(callbacks);
  /** Último texto que sabemos idéntico al del editor: evita recorrer el documento en cada render. */
  const syncedRef = useRef(text);

  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return;
    const getCallbacks = (): EditorCallbacks => ({
      ...callbacksRef.current,
      onChange: (next) => {
        syncedRef.current = next;
        callbacksRef.current.onChange(next);
      },
    });
    const view = new EditorView({
      parent,
      state: EditorState.create({ doc: syncedRef.current, extensions: buildExtensions(getCallbacks, placeholder) }),
    });
    viewRef.current = view;
    if (autoFocus) view.focus();
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // El editor se crea una sola vez; el texto posterior se sincroniza en el efecto de abajo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || text === syncedRef.current) return;
    syncedRef.current = text;
    const anchor = Math.min(view.state.selection.main.head, text.length);
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: text },
      selection: { anchor },
      annotations: externalChange.of(true),
    });
  }, [text]);

  useEffect(() => {
    viewRef.current?.dispatch({ effects: setErrorOffset.of(errorOffset) });
  }, [errorOffset]);

  useEffect(() => {
    const view = viewRef.current;
    if (!searchPending || !view) return;
    openSearchPanel(view);
    onSearchOpened();
  }, [searchPending, onSearchOpened]);

  const revealOffset = useCallback((offset: number) => {
    const view = viewRef.current;
    if (!view) return;
    const pos = Math.min(offset, view.state.doc.length);
    view.dispatch({ selection: { anchor: pos }, effects: EditorView.scrollIntoView(pos, { y: "center" }) });
    view.focus();
  }, []);

  return { containerRef, revealOffset };
}
