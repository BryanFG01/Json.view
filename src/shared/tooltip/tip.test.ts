import { describe, expect, it } from "vitest";
import { placeTooltip, tipAttrs } from "./tip";

const rect = (left: number, top: number, size = 36) =>
  ({ left, top, width: size, height: size, right: left + size, bottom: top + size }) as DOMRect;
const viewport = { width: 1000, height: 800 };

describe("placeTooltip", () => {
  it("debajo y centrado en el botón cuando hay espacio", () => {
    expect(placeTooltip(rect(400, 100), viewport)).toEqual({ placement: "below", style: { left: 418, top: 142 } });
  });

  it("no se sale por los bordes izquierdo ni derecho", () => {
    expect(placeTooltip(rect(0, 100), viewport).style.left).toBe(148);
    expect(placeTooltip(rect(980, 100), viewport).style.left).toBe(852);
  });

  it("encima del botón si abajo no cabe", () => {
    expect(placeTooltip(rect(400, 760), viewport)).toEqual({ placement: "above", style: { left: 418, bottom: 46 } });
  });
});

describe("tipAttrs", () => {
  const tip = { title: "Formatear", desc: "Indenta", keys: "Shift+Alt+F", disabledHint: "Necesita JSON válido" };

  it("usa la explicación normal o el motivo de desactivado", () => {
    expect(tipAttrs(tip)).toEqual({ "data-tip": "Formatear", "data-tip-desc": "Indenta", "data-tip-keys": "Shift+Alt+F" });
    expect(tipAttrs(tip, true)["data-tip-desc"]).toBe("Necesita JSON válido");
  });
});
