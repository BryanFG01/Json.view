import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { locateJsonError } from "./locateJsonError";

describe("locateJsonError", () => {
  it.each([
    '{"a":[1,-2.5e+3,true,false,null,"x\\u00e9\\n"],"b":{}}',
    "[]",
    " 0 ",
    '"s"',
  ])("devuelve null para JSON válido: %s", (text) => {
    expect(locateJsonError(text)).toBeNull();
  });

  it("coincide con JSON.parse: null si y solo si es válido", () => {
    fc.assert(
      fc.property(fc.json(), (text) => {
        expect(locateJsonError(text)).toBeNull();
      }),
    );
    fc.assert(
      fc.property(fc.string(), (text) => {
        let valid = true;
        try {
          JSON.parse(text);
        } catch {
          valid = false;
        }
        expect(locateJsonError(text) === null).toBe(valid);
      }),
    );
  });
});
