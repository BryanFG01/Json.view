import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { lcsLength } from "../../../../../test/lcs";
import { diffLinesUseCase } from "./diffLines";

const symbol = { equal: " ", insert: "+", delete: "-" } as const;
const render = (left: string, right: string) =>
  diffLinesUseCase(left, right).map((op) => symbol[op.type] + op.text);

describe("diffLinesUseCase", () => {
  it("marca cambios, agregados y borrados", () => {
    expect(render("a\nb\nc\nd", "a\nx\nc\nd\ne")).toEqual([" a", "-b", "+x", " c", " d", "+e"]);
  });

  it("textos idénticos solo tienen líneas iguales", () => {
    expect(render("same\nline", "same\nline")).toEqual([" same", " line"]);
  });

  it("propiedad: reconstruye ambos lados y es mínimo (igual a la LCS de referencia)", () => {
    const lines = fc.array(fc.constantFrom("a", "b", "c", "d", "{", "}"), { maxLength: 30 });
    fc.assert(
      fc.property(lines, lines, (a, b) => {
        const left = a.join("\n");
        const right = b.join("\n");
        const ops = diffLinesUseCase(left, right);
        expect(ops.filter((o) => o.type !== "insert").map((o) => o.text).join("\n")).toBe(left);
        expect(ops.filter((o) => o.type !== "delete").map((o) => o.text).join("\n")).toBe(right);
        const equalCount = ops.filter((o) => o.type === "equal").length;
        expect(equalCount).toBe(lcsLength(left.split("\n"), right.split("\n")));
      }),
      { numRuns: 1000 },
    );
  });
});
