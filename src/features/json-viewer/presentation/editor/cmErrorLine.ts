import { RangeSet, StateEffect, StateField, type EditorState, type Extension } from "@codemirror/state";
import { Decoration, EditorView, GutterMarker, gutterLineClass } from "@codemirror/view";

/** Efecto para marcar (o quitar, con null) la línea del error de sintaxis. */
export const setErrorOffset = StateEffect.define<number | null>();

const lineDecoration = Decoration.line({ class: "cm-error-line" });

class ErrorGutterMarker extends GutterMarker {
  elementClass = "cm-error-line-gutter";
}
const errorGutterMarker = new ErrorGutterMarker();

const errorLineField = StateField.define<number | null>({
  create: () => null,
  update(value, tr) {
    for (const effect of tr.effects) if (effect.is(setErrorOffset)) return effect.value;
    return value === null ? null : tr.changes.mapPos(value);
  },
});

function errorLineStart(state: EditorState): number | null {
  const offset = state.field(errorLineField);
  if (offset === null) return null;
  return state.doc.lineAt(Math.min(offset, state.doc.length)).from;
}

export const errorLine: Extension = [
  errorLineField,
  EditorView.decorations.compute([errorLineField], (state) => {
    const from = errorLineStart(state);
    return from === null ? Decoration.none : Decoration.set([lineDecoration.range(from)]);
  }),
  gutterLineClass.compute([errorLineField], (state) => {
    const from = errorLineStart(state);
    return from === null ? RangeSet.empty : RangeSet.of([errorGutterMarker.range(from)]);
  }),
];
