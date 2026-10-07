"use client";

import { useCallback, useDeferredValue, useMemo, useState } from "react";
import type { DocLanguage, IndentOption, JsonParseResult, SortOptions, SortTarget, ViewMode } from "../../domain/models/json";
import { detectLanguage, looksLikeSql } from "../../application/useCases/detectLanguage";
import { collectArrayFields, sortBlockUseCase } from "../../application/useCases/sortBlock";
import { parseJsonUseCase } from "../../application/useCases/parseJson";
import { formatIfValidUseCase } from "../../application/useCases/transformJson";
import type { BracketScope } from "../editor/cmBracketScope";
import { createJsonActions } from "../utils/jsonActions";
import { SAMPLE_JSON } from "../utils/sampleJson";
import { dialectLabel, SAMPLE_SQL } from "../utils/sqlOptions.constants";
import { buildSqlStatus, buildStatus, describeScope } from "../utils/status";
import { toolbarTips } from "../utils/toolbarTips";
import { useClipboard } from "./useClipboard";
import { useShareLink } from "./useShareLink";
import { useSqlMode } from "./useSqlMode";
import { useTextHistory } from "./useTextHistory";

interface JsonDocumentOptions {
  /** Solo un documento lee y escribe el #hash compartible (el panel izquierdo). */
  shareable?: boolean;
  autoFocus?: boolean;
}

/** En modo SQL no se valida como JSON: las acciones de JSON quedan desactivadas. */
const NOT_JSON: JsonParseResult = { status: "empty" };

/** Estado completo de un panel: texto con historial, modo JSON/SQL, parseo, vista, sangría y acciones. */
export function useJsonDocument({ shareable = false, autoFocus = false }: JsonDocumentOptions = {}) {
  const history = useTextHistory();
  const { text, replace } = history;
  const [mode, setMode] = useState<ViewMode>("editor");
  const [indent, setIndent] = useState<IndentOption>("2");
  const [scope, setScope] = useState<BracketScope | null>(null);
  const [searchPending, setSearchPending] = useState(false);
  const sql = useSqlMode({ text, indent, replace });
  const { isSql, setLanguage, formatSql } = sql;

  const onSearchOpened = useCallback(() => setSearchPending(false), []);
  /** Abre el buscador de ESTE panel (si está en Árbol, pasa al Editor). */
  const openSearch = useCallback(() => {
    setMode("editor");
    setSearchPending(true);
  }, []);
  const switchLanguage = useCallback((next: DocLanguage) => {
    setLanguage(next);
    if (next === "sql") setMode("editor");
  }, [setLanguage]);

  // Validar es O(tamaño): con JSON grandes se hace en un render de baja prioridad para que
  // el teclado responda primero. Las acciones re-validan si el valor diferido quedó atrás.
  const deferredText = useDeferredValue(text);
  const parsed = useMemo(() => (isSql ? NOT_JSON : parseJsonUseCase(deferredText)), [isSql, deferredText]);
  const status = useMemo(
    () => (isSql ? buildSqlStatus(deferredText, dialectLabel(sql.dialect)) : buildStatus(deferredText, parsed)),
    [isSql, deferredText, parsed, sql.dialect],
  );
  const current = useCallback(() => (deferredText === text ? parsed : parseJsonUseCase(text)), [deferredText, text, parsed]);
  const actions = createJsonActions({ parsed, current, indent, replace });
  const clipboard = useClipboard();
  const blockClipboard = useClipboard();

  /** Texto nuevo que llega de fuera (archivo, enlace): elige el modo según el contenido o la extensión. */
  const loadText = useCallback((loaded: string, fileName?: string) => {
    switchLanguage(detectLanguage(loaded, fileName));
    replace(loaded);
  }, [switchLanguage, replace]);
  const share = useShareLink({ text, onLoad: loadText, enabled: shareable });

  /** Pegar en el editor vacío: JSON válido o SQL se formatean automáticamente. */
  const pasteIntoEmpty = useCallback((pasted: string) => {
    const language = detectLanguage(pasted);
    switchLanguage(language);
    if (language === "sql") void formatSql({ source: pasted, keepOnError: true });
    else replace(formatIfValidUseCase(pasted, indent));
  }, [switchLanguage, formatSql, replace, indent]);

  const format = () => (isSql ? void formatSql() : actions.format());
  /** Ordena todo el JSON o solo el bloque { } / [ ] del cursor. */
  const sort = (options: SortOptions, target: SortTarget) => {
    if (target === "all" || !scope) return actions.sort(options);
    const sorted = sortBlockUseCase(text, scope.from, scope.to, options, indent);
    if (sorted !== null) replace(sorted);
  };
  const getArrayFields = useCallback(() => (parsed.status === "valid" ? collectArrayFields(parsed.value) : []), [parsed]);
  const copyBlock = () => {
    if (scope) void blockClipboard.copy(formatIfValidUseCase(text.slice(scope.from, scope.to + 1), indent));
  };
  const changeIndent = (next: IndentOption) => {
    setIndent(next);
    if (isSql) void formatSql({ indent: next });
    else actions.formatWith(next);
  };

  const jsonError = parsed.status === "invalid" ? parsed.error : null;
  const suggestSql = jsonError !== null && looksLikeSql(text);

  return {
    text,
    parsed,
    mode,
    language: sql.language,
    replace,
    loadText,
    openSearch,
    toolbar: {
      openSearch,
      ...actions,
      ...share,
      format,
      sort,
      sortContext: { blockLabel: scope ? `Líneas ${scope.openLine}–${scope.closeLine}` : null, getArrayFields },
      isSql,
      tips: toolbarTips(isSql),
      setLanguage: switchLanguage,
      canFormat: isSql ? text.trim().length > 0 : actions.isValid,
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
      loadSample: () => (isSql ? void formatSql({ source: SAMPLE_SQL }) : replace(SAMPLE_JSON)),
    },
    editor: {
      text,
      autoFocus,
      language: sql.language,
      dialect: sql.dialect,
      error: isSql ? (sql.sqlError ? { message: `No se pudo formatear el SQL: ${sql.sqlError}`, location: null } : null) : jsonError,
      errorAction: suggestSql ? { label: "Parece SQL: cambiar a modo SQL", onClick: () => switchLanguage("sql") } : null,
      onChange: history.type,
      onPasteIntoEmpty: pasteIntoEmpty,
      onUndo: history.undo,
      onRedo: history.redo,
      onFormat: format,
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
      isSql,
      dialect: sql.dialect,
      onDialectChange: sql.setDialect,
    },
  };
}

export type JsonDocumentVM = ReturnType<typeof useJsonDocument>;
