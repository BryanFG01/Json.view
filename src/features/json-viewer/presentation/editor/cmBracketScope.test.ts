import { json } from "@codemirror/lang-json";
import { ensureSyntaxTree } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { describe, expect, it } from "vitest";
import { findScope } from "./cmBracketScope";

const DOC = '{\n  "a": 1,\n  "b": [\n    1,\n    2\n  ],\n  "c": {}\n}';

function scopeAt(offset: number) {
  const state = EditorState.create({ doc: DOC, selection: { anchor: offset }, extensions: [json()] });
  ensureSyntaxTree(state, state.doc.length);
  return findScope(state);
}

describe("findScope", () => {
  const ARRAY = { from: DOC.indexOf("["), to: DOC.indexOf("]") };

  it("cursor junto a la llave de apertura: bloque completo y marcado fuerte", () => {
    expect(scopeAt(0)).toEqual({ openLine: 1, closeLine: 8, from: 0, to: DOC.length - 1, strong: true });
  });

  it("cursor justo después de la llave de cierre: el mismo bloque", () => {
    expect(scopeAt(DOC.length)).toEqual({ openLine: 1, closeLine: 8, from: 0, to: DOC.length - 1, strong: true });
  });

  it("cursor sobre el corchete de un array anidado", () => {
    expect(scopeAt(ARRAY.from + 1)).toEqual({ openLine: 3, closeLine: 6, ...ARRAY, strong: true });
  });

  it("cursor dentro de un valor: bloque que lo contiene, marcado suave", () => {
    expect(scopeAt(DOC.indexOf("2\n"))).toEqual({ openLine: 3, closeLine: 6, ...ARRAY, strong: false });
    expect(scopeAt(DOC.indexOf('"a"') + 1)).toMatchObject({ openLine: 1, closeLine: 8, strong: false });
  });

  it("from/to delimitan exactamente el bloque (se puede copiar con slice)", () => {
    const scope = scopeAt(ARRAY.from + 1)!;
    expect(DOC.slice(scope.from, scope.to + 1)).toBe("[\n    1,\n    2\n  ]");
  });
});
