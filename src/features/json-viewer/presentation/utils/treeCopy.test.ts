import { describe, expect, it } from "vitest";
import { childrenOf, createRoot } from "./jsonTree";
import { nodeCopyLabel, nodeCopyText } from "./treeCopy";

const DATA = { autor: { nombre: "Ada", email: "ada@example.com" }, web: "https://example.com", n: 3, ok: null };

describe("copiar un nodo del árbol", () => {
  const root = createRoot(DATA, 2);
  const [autor, web, n, ok] = childrenOf(root, 2);

  it("un objeto se copia como JSON formateado", () => {
    expect(nodeCopyText(autor)).toBe('{\n  "nombre": "Ada",\n  "email": "ada@example.com"\n}');
    expect(nodeCopyLabel(autor)).toBe('Copiar "autor"');
  });

  it("un texto se copia sin comillas; números y null tal cual", () => {
    expect(nodeCopyText(web)).toBe("https://example.com");
    expect(nodeCopyText(n)).toBe("3");
    expect(nodeCopyText(ok)).toBe("null");
  });

  it("la raíz copia todo", () => {
    expect(JSON.parse(nodeCopyText(root))).toEqual(DATA);
    expect(nodeCopyLabel(root)).toBe("Copiar todo");
  });

  it("un grupo de un array grande copia solo su rango", () => {
    const big = createRoot(Array.from({ length: 250 }, (_, i) => i), 2);
    const groups = childrenOf(big, 2);
    expect(JSON.parse(nodeCopyText(groups[1]))).toEqual(Array.from({ length: 100 }, (_, i) => 100 + i));
    expect(nodeCopyLabel(groups[1])).toBe("Copiar [100 … 199]");
  });
});
