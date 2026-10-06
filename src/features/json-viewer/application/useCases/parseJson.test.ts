import { describe, expect, it } from "vitest";
import { parseJsonUseCase } from "./parseJson";

function locationOf(text: string) {
  const result = parseJsonUseCase(text);
  if (result.status !== "invalid") throw new Error(`se esperaba inválido, fue ${result.status}`);
  return result.error.location;
}

describe("parseJsonUseCase", () => {
  it("devuelve empty para texto vacío o solo espacios", () => {
    expect(parseJsonUseCase("")).toEqual({ status: "empty" });
    expect(parseJsonUseCase("  \n\t")).toEqual({ status: "empty" });
  });

  it("devuelve el valor si es válido", () => {
    expect(parseJsonUseCase('{"ok": true}')).toEqual({ status: "valid", value: { ok: true } });
  });

  it.each([
    ['{\n  "a": 1\n  "b": 2\n}', { offset: 13, line: 3, column: 3 }],
    ['{\n  "a": 1,\n  "b": [1, 2,]\n}', { offset: 25, line: 3, column: 14 }],
    ['{"a": ', { offset: 6, line: 1, column: 7 }],
    ["hola", { offset: 0, line: 1, column: 1 }],
    ['{"a":1,}', { offset: 7, line: 1, column: 8 }],
    ["[1,2] x", { offset: 6, line: 1, column: 7 }],
    ['{"s":"\\q"}', { offset: 7, line: 1, column: 8 }],
  ])("ubica el error en %j", (text, expected) => {
    expect(locationOf(text)).toEqual(expected);
  });
});
