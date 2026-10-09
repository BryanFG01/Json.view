"use client";

import { useQueryEditor, type QueryEditorProps } from "../hooks/useQueryEditor";

/** Caja de consulta SQL con autocompletado de tablas y columnas de la base abierta. */
export function QueryEditor(props: QueryEditorProps) {
  const { containerRef } = useQueryEditor(props);
  return <div ref={containerRef} className="min-w-0 flex-1" />;
}
