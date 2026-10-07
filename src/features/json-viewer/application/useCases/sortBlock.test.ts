import { describe, expect, it } from "vitest";
import type { JsonValue } from "../../domain/models/json";
import { collectArrayFields, sortBlockUseCase } from "./sortBlock";
import { sortJsonUseCase } from "./sortJson";

const DATA: JsonValue = {
  empresa: "ACME",
  equipos: [
    {
      nombre: "Beta",
      prioridad: 10,
      miembros: [{ nombre: "Zoe", edad: 31 }, { nombre: "ana", edad: 25 }, { nombre: "Luis", edad: 40 }],
    },
    { nombre: "Alfa", prioridad: 2, miembros: [] },
    { nombre: "Gamma", miembros: [{ nombre: "Eva", edad: 2 }] },
    { nombre: "Delta", prioridad: 9, miembros: [] },
  ],
};

const order = (text: string, path: (v: JsonValue) => JsonValue[], field: string) =>
  path(JSON.parse(text)).map((item) => (item as Record<string, JsonValue>)[field]);
const equipos = (v: JsonValue) => (v as { equipos: JsonValue[] }).equipos;
const miembros = (i: number) => (v: JsonValue) => (equipos(v)[i] as { miembros: JsonValue[] }).miembros;

describe("ordenar arrays de objetos por campo (en cualquier nivel)", () => {
  it("por número, ascendente: los que no tienen el campo van al final", () => {
    const out = sortJsonUseCase(DATA, { keys: "original", arrays: false, byField: { key: "prioridad", desc: false } }, "2");
    expect(order(out, equipos, "nombre")).toEqual(["Alfa", "Delta", "Beta", "Gamma"]);
  });

  it("descendente, y también los arrays anidados dentro de cada objeto", () => {
    const out = sortJsonUseCase(DATA, { keys: "original", arrays: false, byField: { key: "nombre", desc: true } }, "2");
    expect(order(out, equipos, "nombre")).toEqual(["Gamma", "Delta", "Beta", "Alfa"]);
    // Dentro de "Beta" (ahora en la posición 2), los miembros también quedan Z→A (sin distinguir mayúsculas).
    expect(order(out, miembros(2), "nombre")).toEqual(["Zoe", "Luis", "ana"]);
  });

  it("collectArrayFields lista los campos reales de los arrays de objetos, los más comunes primero", () => {
    // nombre: 8 veces; edad y miembros: 4 (empate → alfabético); prioridad: 3.
    expect(collectArrayFields(DATA)).toEqual(["nombre", "edad", "miembros", "prioridad"]);
    expect(collectArrayFields({ a: [1, 2], b: { c: 3 } })).toEqual([]);
  });
});

describe("sortBlockUseCase: ordenar solo el bloque del cursor", () => {
  const text = sortJsonUseCase(DATA, { keys: "original", arrays: false }, "2");

  it("ordena solo ese bloque, conserva su sangría y deja el resto igual", () => {
    const from = text.indexOf('"miembros": [') + '"miembros": '.length;
    const to = text.indexOf("]", from);
    const out = sortBlockUseCase(text, from, to, { keys: "original", arrays: false, byField: { key: "edad", desc: false } }, "2");
    expect(out).not.toBeNull();
    expect(order(out!, miembros(0), "nombre")).toEqual(["ana", "Zoe", "Luis"]);
    // El orden de los equipos no se toca y el resultado sigue formateado igual que el resto.
    expect(order(out!, equipos, "nombre")).toEqual(["Beta", "Alfa", "Gamma", "Delta"]);
    expect(out).toBe(sortJsonUseCase(JSON.parse(out!), { keys: "original", arrays: false }, "2"));
  });

  it("devuelve null si el rango no es JSON válido", () => {
    expect(sortBlockUseCase('{"a": [1, 2', 6, 11, { keys: "asc", arrays: true }, "2")).toBeNull();
  });
});
