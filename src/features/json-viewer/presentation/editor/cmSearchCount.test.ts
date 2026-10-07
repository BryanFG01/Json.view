import { SearchQuery } from "@codemirror/search";
import { EditorState } from "@codemirror/state";
import { describe, expect, it } from "vitest";
import { countMatches, describeCount, MAX_COUNTED_MATCHES } from "./cmSearchCount";

const DOC = '{"nombre": "Ada", "apodo": "ada", "email": "ada@example.com"}';
const stateAt = (anchor: number, head = anchor, doc = DOC) => EditorState.create({ doc, selection: { anchor, head } });

describe("countMatches / describeCount", () => {
  it("cuenta sin distinguir mayúsculas por defecto y marca la coincidencia seleccionada", () => {
    const query = new SearchQuery({ search: "ada" });
    const second = DOC.indexOf("ada");
    const count = countMatches(query, stateAt(second, second + 3));
    expect(count).toEqual({ total: 3, current: 2, capped: false });
    expect(describeCount(query, count)).toBe("2 de 3");
  });

  it("respeta mayúsculas, palabra completa y regex", () => {
    expect(countMatches(new SearchQuery({ search: "ada", caseSensitive: true }), stateAt(0)).total).toBe(2);
    expect(countMatches(new SearchQuery({ search: "ada", wholeWord: true }), stateAt(0)).total).toBe(3);
    expect(countMatches(new SearchQuery({ search: '"[a-z]+":', regexp: true }), stateAt(0)).total).toBe(3);
  });

  it("textos del contador: sin cursor en una coincidencia, sin resultados y regex inválida", () => {
    const query = new SearchQuery({ search: "ada" });
    expect(describeCount(query, countMatches(query, stateAt(0)))).toBe("3 resultados");
    const one = new SearchQuery({ search: "email" });
    expect(describeCount(one, countMatches(one, stateAt(0)))).toBe("1 resultado");
    const none = new SearchQuery({ search: "zzz" });
    expect(describeCount(none, countMatches(none, stateAt(0)))).toBe("Sin resultados");
    const bad = new SearchQuery({ search: "(", regexp: true });
    expect(describeCount(bad, countMatches(bad, stateAt(0)))).toBe("Regex no válida");
    expect(describeCount(new SearchQuery({ search: "" }), { total: 0, current: 0, capped: false })).toBe("");
  });

  it("deja de contar en el límite", () => {
    const doc = "a".repeat(MAX_COUNTED_MATCHES + 10);
    const query = new SearchQuery({ search: "a" });
    const count = countMatches(query, stateAt(0, 0, doc));
    expect(count).toMatchObject({ total: MAX_COUNTED_MATCHES, capped: true });
    // En español los números de 4 cifras no llevan separador de miles ("5000", pero "50.000").
    expect(describeCount(query, count)).toBe("5000+ resultados");
  });
});
