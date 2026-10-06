import { describe, expect, it } from "vitest";
import { expandNestedJson, expandNestedJsonUseCase } from "./expandNestedJson";

describe("expandNestedJson", () => {
  it("convierte strings con JSON (anidado y doble serializado) en objetos", () => {
    const input = {
      cfg: '{"a":[1,"{\\"b\\":2}"]}',
      twice: JSON.stringify(JSON.stringify({ x: 1 })),
      plain: "hola",
      notJson: "{oops}",
    };
    expect(expandNestedJson(input)).toEqual({
      cfg: { a: [1, { b: 2 }] },
      twice: { x: 1 },
      plain: "hola",
      notJson: "{oops}",
    });
  });

  it("expande una raíz que es string", () => {
    expect(expandNestedJson('[1,{"a":"[2]"}]')).toEqual([1, { a: [2] }]);
  });

  it("deja intactos números, booleanos y null", () => {
    expect(expandNestedJson({ n: 1, b: false, z: null })).toEqual({ n: 1, b: false, z: null });
  });

  it("formatea el resultado con la sangría pedida", () => {
    expect(expandNestedJsonUseCase({ a: '{"b":1}' }, "2")).toBe('{\n  "a": {\n    "b": 1\n  }\n}');
  });
});
