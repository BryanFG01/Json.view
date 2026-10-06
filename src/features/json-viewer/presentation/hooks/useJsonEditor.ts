"use client";

import {
  useCallback, useMemo, useRef, type ChangeEvent, type ClipboardEvent, type KeyboardEvent,
} from "react";
import type { JsonSyntaxError } from "../../domain/models/json";
import { INDENT_TEXT, resolveShortcut, type EditorShortcut } from "../utils/editorShortcuts";
import { tokenizeJson } from "../utils/highlight";
import { EDITOR_LINE_HEIGHT_PX, EDITOR_PADDING_TOP_PX } from "../utils/styles.constants";
import { buildGutterText, countLines } from "../utils/text";

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
}

export function useJsonEditor(props: JsonEditorProps) {
  const { text, error, onChange, onPasteIntoEmpty, onUndo, onRedo, onFormat } = props;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLPreElement>(null);

  const tokens = useMemo(() => tokenizeJson(text), [text]);
  const lineCount = useMemo(() => countLines(text), [text]);
  const gutterText = useMemo(() => buildGutterText(lineCount), [lineCount]);
  const location = error?.location ?? null;

  const syncScroll = useCallback(() => {
    const area = textareaRef.current;
    if (!area) return;
    if (highlightRef.current) {
      highlightRef.current.scrollTop = area.scrollTop;
      highlightRef.current.scrollLeft = area.scrollLeft;
    }
    if (gutterRef.current) gutterRef.current.scrollTop = area.scrollTop;
  }, []);

  const insertIndent = useCallback((area: HTMLTextAreaElement) => {
    area.setRangeText(INDENT_TEXT, area.selectionStart, area.selectionEnd, "end");
    onChange(area.value);
  }, [onChange]);

  const handlers = useMemo<Record<EditorShortcut, (area: HTMLTextAreaElement) => void>>(
    () => ({ undo: onUndo, redo: onRedo, format: onFormat, indent: insertIndent }),
    [onUndo, onRedo, onFormat, insertIndent],
  );

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
    const shortcut = resolveShortcut(event);
    if (!shortcut) return;
    event.preventDefault();
    handlers[shortcut](event.currentTarget);
  }, [handlers]);

  const onPaste = useCallback((event: ClipboardEvent<HTMLTextAreaElement>) => {
    if (text.trim() !== "") return;
    event.preventDefault();
    onPasteIntoEmpty(event.clipboardData.getData("text"));
  }, [text, onPasteIntoEmpty]);

  const goToError = useCallback(() => {
    const area = textareaRef.current;
    if (!area || !location) return;
    area.focus();
    area.setSelectionRange(location.offset, Math.min(location.offset + 1, area.value.length));
    area.scrollTop = Math.max(0, (location.line - 1) * EDITOR_LINE_HEIGHT_PX - area.clientHeight / 2);
    syncScroll();
  }, [location, syncScroll]);

  const errorMarkerStyle = location
    ? { top: EDITOR_PADDING_TOP_PX + (location.line - 1) * EDITOR_LINE_HEIGHT_PX, height: EDITOR_LINE_HEIGHT_PX }
    : null;

  return {
    textareaRef,
    highlightRef,
    gutterRef,
    tokens,
    gutterText,
    gutterWidth: `${String(lineCount).length + 3}ch`,
    error,
    errorMarkerStyle,
    canGoToError: location !== null,
    goToError,
    autoFocus: props.autoFocus,
    onScroll: syncScroll,
    onKeyDown,
    onPaste,
    onChange: (event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value),
  };
}
