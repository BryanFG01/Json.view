import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { sql, SQLite } from "@codemirror/lang-sql";
import { bracketMatching } from "@codemirror/language";
import { Compartment, Prec, type Extension } from "@codemirror/state";
import { EditorView, keymap, placeholder } from "@codemirror/view";
import type { SqlCompletionSchema } from "../utils/sqlSchema";
import { jsonHighlighting } from "./cmTheme";

// Mini editor de la consulta SQLite: colores, autocierre y autocompletado con el esquema de la base.

export const queryLanguage = new Compartment();

/** SQL de SQLite con el esquema de la base abierta (tablas, columnas, alias) y palabras clave en mayúsculas. */
export function queryLanguageExtension(schema: SqlCompletionSchema, defaultTable: string): Extension {
  return sql({ dialect: SQLite, schema, defaultTable: defaultTable || undefined, upperCaseKeywords: true });
}

const mix = (color: string, percent: number) => `color-mix(in srgb, var(${color}) ${percent}%, transparent)`;

const queryTheme = EditorView.theme({
  "&": { backgroundColor: "var(--bg)", color: "var(--fg)", fontSize: "12px", border: "1px solid var(--border)", borderRadius: "4px" },
  "&.cm-focused": { outline: "none", borderColor: "var(--accent)" },
  ".cm-scroller": { fontFamily: "var(--font-geist-mono), ui-monospace, monospace", lineHeight: "18px", minHeight: "44px", maxHeight: "160px" },
  ".cm-content": { padding: "4px 0", caretColor: "var(--fg)" },
  ".cm-line": { padding: "0 8px" },
  ".cm-placeholder": { color: "var(--muted)" },
  ".cm-tooltip.cm-tooltip-autocomplete": { backgroundColor: "var(--panel)", border: "1px solid var(--border)", borderRadius: "6px", boxShadow: "0 8px 24px rgb(0 0 0 / 0.25)" },
  ".cm-tooltip-autocomplete > ul": { fontFamily: "var(--font-geist-mono), ui-monospace, monospace", fontSize: "12px", maxHeight: "220px" },
  ".cm-tooltip-autocomplete > ul > li": { padding: "2px 8px", color: "var(--fg)" },
  ".cm-tooltip-autocomplete > ul > li[aria-selected]": { backgroundColor: mix("--accent", 30), color: "var(--fg)" },
  ".cm-completionDetail": { color: "var(--muted)", fontStyle: "normal", marginLeft: "12px" },
  ".cm-completionMatchedText": { textDecoration: "none", color: "var(--accent)", fontWeight: "700" },
});

export interface QueryEditorCallbacks {
  onChange: (text: string) => void;
  onRun: (text: string) => void;
}

export function buildQueryExtensions(get: () => QueryEditorCallbacks, language: Extension): Extension[] {
  return [
    history(),
    closeBrackets(),
    bracketMatching(),
    queryLanguage.of(language),
    autocompletion({ activateOnTyping: true, icons: false }),
    jsonHighlighting,
    queryTheme,
    EditorView.lineWrapping,
    placeholder("SELECT * FROM tabla WHERE …  (Ctrl+Espacio sugerencias · Ctrl+Enter ejecutar)"),
    EditorView.contentAttributes.of({ "aria-label": "Consulta SQL", spellcheck: "false" }),
    // Ctrl+Enter ejecuta siempre, aunque esté abierta la lista de sugerencias.
    Prec.highest(
      keymap.of([
        {
          key: "Mod-Enter",
          run: (view) => {
            get().onRun(view.state.doc.toString());
            return true;
          },
        },
      ]),
    ),
    keymap.of([...closeBracketsKeymap, ...completionKeymap, ...historyKeymap, ...defaultKeymap]),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) get().onChange(update.state.doc.toString());
    }),
  ];
}
