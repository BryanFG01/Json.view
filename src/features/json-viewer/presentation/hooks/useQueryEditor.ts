"use client";

import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { useEffect, useMemo, useRef } from "react";
import type { SqliteObject } from "../../domain/models/sqlite";
import { buildQueryExtensions, queryLanguage, queryLanguageExtension, type QueryEditorCallbacks } from "../editor/cmQueryEditor";
import { buildSqlSchema } from "../utils/sqlSchema";

export interface QueryEditorProps extends QueryEditorCallbacks {
  value: string;
  objects: SqliteObject[];
  /** Tabla elegida: sus columnas se sugieren sin escribir "tabla.". */
  defaultTable: string;
}

/** Mini editor CodeMirror de la consulta, con autocompletado basado en el esquema de la base. */
export function useQueryEditor({ value, objects, defaultTable, ...callbacks }: QueryEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const callbacksRef = useRef(callbacks);
  const schema = useMemo(() => buildSqlSchema(objects), [objects]);
  const language = useMemo(() => queryLanguageExtension(schema, defaultTable), [schema, defaultTable]);

  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return;
    const view = new EditorView({
      parent,
      state: EditorState.create({ doc: value, extensions: buildQueryExtensions(() => callbacksRef.current, language) }),
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Se crea una vez; el texto y el esquema se sincronizan en los efectos de abajo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || view.state.doc.toString() === value) return;
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
  }, [value]);

  useEffect(() => {
    viewRef.current?.dispatch({ effects: queryLanguage.reconfigure(language) });
  }, [language]);

  return { containerRef };
}
