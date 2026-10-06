import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";

// Todo usa las variables CSS de globals.css: el tema claro/oscuro cambia sin reconfigurar el editor.

const FONT = "var(--font-geist-mono), ui-monospace, monospace";
const mix = (color: string, percent: number) => `color-mix(in srgb, var(${color}) ${percent}%, transparent)`;

export const editorTheme = EditorView.theme({
  "&": { height: "100%", backgroundColor: "var(--bg)", color: "var(--fg)", fontSize: "14px" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { fontFamily: FONT, lineHeight: "21px" },
  ".cm-content": { padding: "12px 0", caretColor: "var(--fg)" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--fg)" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
    backgroundColor: `${mix("--accent", 30)} !important`,
  },
  ".cm-activeLine": { backgroundColor: mix("--hover", 45) },
  ".cm-gutters": { backgroundColor: "var(--bg)", color: "var(--gutter)", border: "none" },
  ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--fg)" },
  ".cm-lineNumbers .cm-gutterElement": { padding: "0 4px 0 12px", minWidth: "3ch" },
  ".cm-foldGutter .cm-gutterElement": { width: "18px", cursor: "pointer", color: "var(--muted)" },
  ".cm-foldGutter .cm-gutterElement:hover": { color: "var(--fg)" },
  ".cm-foldPlaceholder": {
    backgroundColor: mix("--accent", 15),
    border: `1px solid ${mix("--accent", 40)}`,
    color: "var(--accent)",
    borderRadius: "4px",
    padding: "0 6px",
    margin: "0 2px",
  },
  ".cm-matchingBracket": { backgroundColor: mix("--accent", 25), outline: "none" },
  ".cm-placeholder": { color: "var(--muted)" },
  ".cm-error-line": { backgroundColor: mix("--err", 14) },
  ".cm-error-line-gutter": { backgroundColor: mix("--err", 25), color: "var(--err)" },
});

export const jsonHighlighting = syntaxHighlighting(
  HighlightStyle.define([
    { tag: t.propertyName, color: "var(--tok-key)" },
    { tag: t.string, color: "var(--tok-string)" },
    { tag: t.number, color: "var(--tok-number)" },
    { tag: [t.bool, t.null], color: "var(--tok-keyword)" },
    { tag: [t.separator, t.brace, t.squareBracket], color: "var(--tok-punct)" },
  ]),
);
