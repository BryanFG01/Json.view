import { describe, expect, it } from "vitest";
import { childrenOf, createRoot, TREE_CHUNK } from "./jsonTree";

describe("árbol perezoso", () => {
  it("la raíz no calcula hijos hasta que se piden", () => {
    const root = createRoot({ a: 1, b: [1, 2] }, 2);
    expect(root.preview).toBe("{2}");
    expect(root.defaultOpen).toBe(true);
    const kids = childrenOf(root, 2);
    expect(kids.map((k) => k.label)).toEqual(['"a":', '"b":']);
    expect(kids[1].preview).toBe("[2]");
  });

  it("agrupa arrays grandes en rangos de 100 y solo abre el primero", () => {
    const root = createRoot(Array.from({ length: 250 }, (_, i) => i), 2);
    const groups = childrenOf(root, 2);
    expect(groups.map((g) => g.label)).toEqual(["[0 … 99]", "[100 … 199]", "[200 … 249]"]);
    expect(groups.map((g) => g.defaultOpen)).toEqual([true, false, false]);
    const last = childrenOf(groups[2], 2);
    expect(last).toHaveLength(50);
    expect(last[0].label).toBe("200:");
  });

  it("con un millón de elementos nunca devuelve más de 100 hijos por nivel", () => {
    const root = createRoot(new Array(1_000_000).fill(0), 2);
    const level1 = childrenOf(root, 2);
    expect(level1).toHaveLength(100);
    expect(level1[0].label).toBe("[0 … 9999]");
    const level2 = childrenOf(level1[0], 2);
    expect(level2).toHaveLength(TREE_CHUNK);
    expect(childrenOf(level2[0], 2)).toHaveLength(TREE_CHUNK);
  });
});
