"use client";

import type { DocLanguage, JsonSyntaxError, SqlDialect } from "../../domain/models/json";
import type { BracketScope } from "../editor/cmBracketScope";
import { useCodeMirror } from "./useCodeMirror";

export interface BannerAction {
  label: string;
  onClick: () => void;
}

export interface JsonEditorProps {
  text: string;
  autoFocus: boolean;
  /** Error a mostrar: de sintaxis JSON o, en modo SQL, del formateador. */
  error: JsonSyntaxError | null;
  /** Acción extra en el aviso de error (p. ej. "Parece SQL: cambiar a modo SQL"). */
  errorAction: BannerAction | null;
  language: DocLanguage;
  dialect: SqlDialect;
  onChange: (text: string) => void;
  /** Pegar sobre el editor vacío: el documento lo formatea si es JSON válido o SQL. */
  onPasteIntoEmpty: (text: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onFormat: () => void;
  onScopeChange: (scope: BracketScope | null) => void;
  searchPending: boolean;
  onSearchOpened: () => void;
}

const PLACEHOLDER = "Pega, escribe o arrastra aquí tu JSON o consulta SQL…";

export function useJsonEditor({ error, errorAction, ...props }: JsonEditorProps) {
  const location = error?.location ?? null;
  const { containerRef, revealOffset } = useCodeMirror({
    ...props,
    errorOffset: location?.offset ?? null,
    placeholder: PLACEHOLDER,
  });

  return {
    containerRef,
    error,
    errorAction,
    goToError: location ? () => revealOffset(location.offset) : undefined,
  };
}
