import { describe, expect, it } from "vitest";
import { diffLinesUseCase } from "../../application/useCases/diffLines";
import { buildDiffRows } from "./diffRows";
import { buildDiffView, DIFF_CONTEXT } from "./diffView";

const lines = (n: number, changeAt = -1) => Array.from({ length: n }, (_, i) => (i === changeAt ? "CAMBIO" : `linea ${i}`)).join("\n");
const rowsFor = (a: string, b: string) => buildDiffRows(diffLinesUseCase(a, b)).rows;

describe("buildDiffView", () => {
  const rows = rowsFor(lines(1000), lines(1000, 500));

  it("muestra solo el cambio con su contexto y colapsa lo igual", () => {
    const view = buildDiffView(rows, {}, 2000);
    const shown = view.items.filter((i) => i.type === "row");
    expect(shown).toHaveLength(2 * DIFF_CONTEXT + 1);
    expect(view.items[0]).toMatchObject({ type: "gap", hidden: 500 - DIFF_CONTEXT });
    expect(view.items.at(-1)).toMatchObject({ type: "gap", hidden: 1000 - 501 - DIFF_CONTEXT });
    expect(view.remaining).toBe(0);
  });

  it("revela un bloque colapsado por partes", () => {
    const first = buildDiffView(rows, {}, 2000).items[0];
    const view = buildDiffView(rows, { [first.id]: 100 }, 2000);
    expect(view.items.slice(0, 100).every((i) => i.type === "row")).toBe(true);
    expect(view.items[100]).toMatchObject({ type: "gap", hidden: 500 - DIFF_CONTEXT - 100 });
  });

  it("respeta el límite de filas dibujadas", () => {
    const all = rowsFor(lines(5000), Array.from({ length: 5000 }, (_, i) => `x${i}`).join("\n"));
    const view = buildDiffView(all, {}, 2000);
    expect(view.items.filter((i) => i.type === "row")).toHaveLength(2000);
    expect(view.remaining).toBe(3000);
    expect(view.moreLabel).toContain("3000");
  });
});
