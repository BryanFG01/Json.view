import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { cursorMatchingBracket, defaultKeymap } from "@codemirror/commands";
import { json } from "@codemirror/lang-json";
import { bracketMatching, codeFolding, foldGutter, foldKeymap, indentUnit } from "@codemirror/language";
import { Annotation, type Extension } from "@codemirror/state";
import {
  drawSelection, EditorView, highlightActiveLine, highlightActiveLineGutter, keymap, lineNumbers, placeholder,
} from "@codemirror/view";
import { highlightSelectionMatches, search, searchKeymap } from "@codemirror/search";
import { bracketScopeField, type BracketScope } from "./cmBracketScope";
import { createSearchPanel, openReplacePanel } from "./cmSearchPanel";
import { searchTheme } from "./cmSearchTheme";
import { errorLine } from "./cmErrorLine";
import { editorTheme, jsonHighlighting } from "./cmTheme";

/** Marca los cambios que vienen de React (deshacer, formatear…) para no reenviarlos como escritura. */
export const externalChange = Annotation.define<boolean>();

/** Callbacks que el editor consulta en el momento del evento (siempre los más recientes). */
export interface EditorCallbacks {
  onChange: (text: string) => void;
  onPasteIntoEmpty: (text: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onFormat: () => void;
  /** Bloque { } / [ ] donde está el cursor (para la barra de estado). */
  onScopeChange: (scope: BracketScope | null) => void;
}

type ShortcutAction = "onUndo" | "onRedo" | "onFormat";

const INDENT = "  ";

function foldMarker(open: boolean): HTMLElement {
  const marker = document.createElement("span");
  marker.textContent = open ? "⌄" : "›";
  // Tooltip global (data-tip) en vez del `title` nativo, que tarda en aparecer.
  marker.dataset.tip = open ? "Plegar bloque" : "Desplegar bloque";
  marker.dataset.tipDesc = open ? "Oculta las líneas de este { } o [ ]." : "Muestra de nuevo las líneas ocultas.";
  marker.dataset.tipKeys = open ? "Ctrl+Shift+[" : "Ctrl+Shift+]";
  marker.setAttribute("aria-label", marker.dataset.tip);
  return marker;
}

function shortcuts(get: () => EditorCallbacks): Extension {
  const run = (action: ShortcutAction) => () => {
    get()[action]();
    return true;
  };
  return keymap.of([
    { key: "Mod-z", run: run("onUndo") },
    { key: "Mod-y", run: run("onRedo") },
    { key: "Mod-Shift-z", run: run("onRedo") },
    { key: "Shift-Alt-f", run: run("onFormat") },
    { key: "Mod-Shift-\\", run: cursorMatchingBracket },
    {
      key: "Tab",
      run: (view) => {
        view.dispatch(view.state.replaceSelection(INDENT));
        return true;
      },
    },
    // Buscar (Ctrl+F) / reemplazar (Ctrl+H) dentro de este editor, no en toda la página.
    { key: "Mod-h", run: openReplacePanel, preventDefault: true },
    ...searchKeymap,
    // Backspace en `{|}` / `"|"` borra el par completo.
    ...closeBracketsKeymap,
    ...foldKeymap,
    ...defaultKeymap,
  ]);
}

function events(get: () => EditorCallbacks): Extension {
  return [
    EditorView.updateListener.of((update) => {
      const external = update.transactions.some((tr) => tr.annotation(externalChange));
      if (update.docChanged && !external) get().onChange(update.state.doc.toString());
      const scope = update.state.field(bracketScopeField);
      if (scope !== update.startState.field(bracketScopeField)) get().onScopeChange(scope.scope);
    }),
    EditorView.domEventHandlers({
      paste(event, view) {
        if (view.state.doc.length > 0) return false;
        event.preventDefault();
        get().onPasteIntoEmpty(event.clipboardData?.getData("text") ?? "");
        return true;
      },
    }),
  ];
}

export function buildExtensions(get: () => EditorCallbacks, placeholderText: string): Extension[] {
  return [
    lineNumbers(),
    codeFolding(),
    foldGutter({ markerDOM: foldMarker }),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    drawSelection(),
    bracketMatching(),
    // Autocierre de { } [ ] y " ": al escribir la apertura se añade el cierre (y envuelve la selección).
    closeBrackets(),
    bracketScopeField,
    search({ top: true, createPanel: createSearchPanel }),
    // Al seleccionar un texto, resalta sus otras apariciones.
    highlightSelectionMatches(),
    indentUnit.of(INDENT),
    json(),
    jsonHighlighting,
    editorTheme,
    searchTheme,
    errorLine,
    placeholder(placeholderText),
    EditorView.contentAttributes.of({ "aria-label": "Editor JSON", spellcheck: "false" }),
    shortcuts(get),
    events(get),
  ];
}
