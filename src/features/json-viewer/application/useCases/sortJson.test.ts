import fc from "fast-check";
import { describe, expect, it } from "vitest";
import type { JsonValue, SortOptions } from "../../domain/models/json";
import { compareNatural, sortJsonUseCase } from "./sortJson";
import { formatJsonUseCase } from "./transformJson";

const sort = (value: JsonValue, options: SortOptions) => sortJsonUseCase(value, options, "2");
/** Claves de primer nivel en el orden en que aparecen en el texto (sin pasar por un objeto JS). */
const topKeys = (text: string) => [...text.matchAll(/^ {2}"([^"]+)":/gm)].map((m) => m[1]);

describe("compareNatural", () => {
  it("ordena los dígitos como números e ignora mayúsculas", () => {
    expect(["item10", "Item2", "item1", "b", "A"].sort(compareNatural)).toEqual(["A", "b", "item1", "Item2", "item10"]);
  });

  it("ordena claves numéricas por valor", () => {
    expect(["10", "9", "100", "1"].sort(compareNatural)).toEqual(["1", "9", "10", "100"]);
  });
});

describe("sortJsonUseCase", () => {
  const input = { zeta: 1, alfa: { c: 1, b: 2 }, item10: [10, 9, 100], item2: ["b10", "b9", "a"] };

  it("ordena claves A→Z en profundidad sin tocar arrays", () => {
    const out = sort(input, { keys: "asc", arrays: false });
    expect(topKeys(out)).toEqual(["alfa", "item2", "item10", "zeta"]);
    expect(JSON.parse(out)).toEqual(input);
    expect(out).toContain('"alfa": {\n    "b": 2,\n    "c": 1\n  }');
    expect(out).toContain('"item10": [\n    10,\n    9,\n    100\n  ]');
  });

  it("ordena claves Z→A", () => {
    expect(topKeys(sort(input, { keys: "desc", arrays: false }))).toEqual(["zeta", "item10", "item2", "alfa"]);
  });

  it("respeta Z→A también con claves numéricas (que JS reordenaría)", () => {
    const numeric = { "1": "a", "10": "b", "9": "c", x: "d" };
    expect(topKeys(sort(numeric, { keys: "desc", arrays: false }))).toEqual(["x", "10", "9", "1"]);
    expect(topKeys(sort(numeric, { keys: "asc", arrays: false }))).toEqual(["1", "9", "10", "x"]);
  });

  it("ordena arrays: números por valor y textos en orden natural", () => {
    const out = JSON.parse(sort(input, { keys: "original", arrays: true }));
    expect(out.item10).toEqual([9, 10, 100]);
    expect(out.item2).toEqual(["a", "b9", "b10"]);
  });

  it("ordena arrays mixtos por tipo: null, booleanos, números, textos, arrays, objetos", () => {
    const mixed = [{ a: 1 }, "x", 2, [1], null, true, 1];
    expect(JSON.parse(sort(mixed, { keys: "original", arrays: true }))).toEqual([null, true, 1, 2, "x", [1], { a: 1 }]);
  });

  it("con todo en 'original' produce lo mismo que formatear (2, 4 y Tab)", () => {
    fc.assert(
      fc.property(fc.jsonValue(), fc.constantFrom("2", "4", "tab" as const), (raw, indent) => {
        const value = JSON.parse(JSON.stringify(raw)) as JsonValue;
        expect(sortJsonUseCase(value, { keys: "original", arrays: false }, indent)).toBe(formatJsonUseCase(value, indent));
      }),
    );
  });

  it("propiedad: ordenar es idempotente y no cambia el contenido", () => {
    fc.assert(
      fc.property(fc.jsonValue(), fc.constantFrom("asc", "desc" as const), fc.boolean(), (raw, keys, arrays) => {
        const value = JSON.parse(JSON.stringify(raw)) as JsonValue;
        const options = { keys, arrays };
        const once = sort(value, options);
        expect(sort(JSON.parse(once), options)).toBe(once);
        if (!arrays) expect(JSON.parse(once)).toEqual(value);
      }),
    );
  });
});
