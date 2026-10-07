"use client";

import { useCallback, useDeferredValue, useMemo, useState } from "react";
import type { IndentOption, ViewMode } from "../../domain/models/json";
import { parseJsonUseCase } from "../../application/useCases/parseJson";
import { formatIfValidUseCase } from "../../application/useCases/transformJson";
import { createJsonActions } from "../utils/jsonActions";
import { SAMPLE_JSON } from "../utils/sampleJson";
import type { BracketScope } from "../editor/cmBracketScope";
import { buildStatus, describeScope } from "../utils/status";
import { useClipboard } from "./useClipboard";
import { useShareLink } from "./useShareLink";
import { useTextHistory } from "./useTextHistory";

interface JsonDocumentOptions {
  /** Solo un documento lee y escribe el #hash compartible (el panel izquierdo). */
  shareable?: boolean;
  autoFocus?: boolean;
}

/** Estado completo de un panel: texto con historial, parseo, vista, sangría y acciones. */
export function useJsonDocument({ shareable = false, autoFocus = false }: JsonDocumentOptions = {}) {
  const history = useTextHistory();
  const { text, replace } = history;
  const [mode, setMode] = useState<ViewMode>("editor");
  const [indent, setIndent] = useState<IndentOption>("2");
  const [scope, setScope] = useState<BracketScope | null>(null);
  const [searchPending, setSearchPending] = useState(false);
  const onSearchOpened = useCallback(() => setSearchPending(false), []);
  /** Abre el buscador de ESTE panel (si está en Árbol, pasa al Editor). */
  const openSearch = useCallback(() => {
    setMode("editor");
    setSearchPending(true);
  }, []);

  // Validar es O(tamaño): con JSON grandes se hace en un render de baja prioridad para que
  // el teclado responda primero. Las acciones re-validan si el valor diferido quedó atrás.
  const deferredText = useDeferredValue(text);
  const parsed = useMemo(() => parseJsonUseCase(deferredText), [deferredText]);
  const status = useMemo(() => buildStatus(deferredText, parsed), [deferredText, parsed]);
  const current = useCallback(() => (deferredText === text ? parsed : parseJsonUseCase(text)), [deferredText, text, parsed]);
  const actions = createJsonActions({ parsed, current, indent, replace });
  const share = useShareLink({ text, onLoad: replace, enabled: shareable });
  const clipboard = useClipboard();
  const blockClipboard = useClipboard();

  /** Copia solo el bloque del cursor, re-formateado (sin la sangría que tenía dentro del documento). */
  const copyBlock = () => {
    if (scope) void blockClipboard.copy(formatIfValidUseCase(text.slice(scope.from, scope.to + 1), indent));
  };

  const pasteIntoEmpty = useCallback((pasted: string) => replace(formatIfValidUseCase(pasted, indent)), [replace, indent]);

  const changeIndent = (next: IndentOption) => {
    setIndent(next);
    actions.formatWith(next);
  };

  return {
    text,
    parsed,
    mode,
    replace,
    openSearch,
    toolbar: {
      openSearch,
      ...actions,
      ...share,
      canShare: shareable,
      mode,
      setMode,
      hasText: text.length > 0,
      canUndo: history.canUndo,
      canRedo: history.canRedo,
      undo: history.undo,
      redo: history.redo,
      copied: clipboard.copied,
      copy: () => clipboard.copy(text),
      clear: () => replace(""),
      loadSample: () => replace(SAMPLE_JSON),
    },
    editor: {
      text,
      autoFocus,
      error: parsed.status === "invalid" ? parsed.error : null,
      onChange: history.type,
      onPasteIntoEmpty: pasteIntoEmpty,
      onUndo: history.undo,
      onRedo: history.redo,
      onFormat: actions.format,
      onScopeChange: setScope,
      searchPending,
      onSearchOpened,
    },
    status: {
      ...status,
      scopeLabel: mode === "editor" ? describeScope(scope) : null,
      copyBlock,
      blockCopied: blockClipboard.copied,
      indent,
      onIndentChange: changeIndent,
    },
  };
}

export type JsonDocumentVM = ReturnType<typeof useJsonDocument>;
