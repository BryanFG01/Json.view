import { defaultKeymap } from "@codemirror/commands";
import { json } from "@codemirror/lang-json";
import { bracketMatching, codeFolding, foldGutter, foldKeymap, indentUnit } from "@codemirror/language";
import { Annotation, type Extension } from "@codemirror/state";
import {
  drawSelection, EditorView, highlightActiveLine, highlightActiveLineGutter, keymap, lineNumbers, placeholder,
} from "@codemirror/view";
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
}

const INDENT = "  ";

function foldMarker(open: boolean): HTMLElement {
  const marker = document.createElement("span");
  marker.textContent = open ? "⌄" : "›";
  marker.title = open ? "Plegar bloque" : "Desplegar bloque";
  return marker;
}

function shortcuts(get: () => EditorCallbacks): Extension {
  const run = (action: keyof Omit<EditorCallbacks, "onChange" | "onPasteIntoEmpty">) => () => {
    get()[action]();
    return true;
  };
  return keymap.of([
    { key: "Mod-z", run: run("onUndo") },
    { key: "Mod-y", run: run("onRedo") },
    { key: "Mod-Shift-z", run: run("onRedo") },
    { key: "Shift-Alt-f", run: run("onFormat") },
    { key: "Tab", run: (view) => (view.dispatch(view.state.replaceSelection(INDENT)), true) },
    ...foldKeymap,
    ...defaultKeymap,
  ]);
}

function events(get: () => EditorCallbacks): Extension {
  return [
    EditorView.updateListener.of((update) => {
      const external = update.transactions.some((tr) => tr.annotation(externalChange));
      if (update.docChanged && !external) get().onChange(update.state.doc.toString());
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
    indentUnit.of(INDENT),
    json(),
    jsonHighlighting,
    editorTheme,
    errorLine,
    placeholder(placeholderText),
    EditorView.contentAttributes.of({ "aria-label": "Editor JSON", spellcheck: "false" }),
    shortcuts(get),
    events(get),
  ];
}
