"use client";

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
}

/**
 * Monta CodeMirror como vista "controlada": React (useTextHistory) es la fuente de verdad.
 * Lo que escribe el usuario sube por onChange; los cambios externos bajan con `externalChange`.
 */
export function useCodeMirror({ text, errorOffset, autoFocus, placeholder, ...callbacks }: CodeMirrorParams) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const callbacksRef = useRef(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return;
    const view = new EditorView({
      parent,
      state: EditorState.create({ doc: text, extensions: buildExtensions(() => callbacksRef.current, placeholder) }),
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
    if (!view || view.state.doc.toString() === text) return;
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

  const revealOffset = useCallback((offset: number) => {
    const view = viewRef.current;
    if (!view) return;
    const pos = Math.min(offset, view.state.doc.length);
    view.dispatch({ selection: { anchor: pos }, effects: EditorView.scrollIntoView(pos, { y: "center" }) });
    view.focus();
  }, []);

  return { containerRef, revealOffset };
}
