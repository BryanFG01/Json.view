"use client";

import type { JsonSyntaxError } from "../../domain/models/json";
import type { BracketScope } from "../editor/cmBracketScope";
import { useCodeMirror } from "./useCodeMirror";

export interface JsonEditorProps {
  text: string;
  autoFocus: boolean;
  error: JsonSyntaxError | null;
  onChange: (text: string) => void;
  /** Pegar sobre el editor vacío: el documento lo formatea si es JSON válido. */
  onPasteIntoEmpty: (text: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onFormat: () => void;
  onScopeChange: (scope: BracketScope | null) => void;
  searchPending: boolean;
  onSearchOpened: () => void;
}

const PLACEHOLDER = "Pega, escribe o arrastra aquí tu JSON…";

export function useJsonEditor({ error, ...props }: JsonEditorProps) {
  const location = error?.location ?? null;
  const { containerRef, revealOffset } = useCodeMirror({
    ...props,
    errorOffset: location?.offset ?? null,
    placeholder: PLACEHOLDER,
  });

  return {
    containerRef,
    error,
    goToError: location ? () => revealOffset(location.offset) : undefined,
  };
}
