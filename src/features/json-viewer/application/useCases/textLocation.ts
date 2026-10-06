import type { TextLocation } from "../../domain/models/json";

/** Convierte un índice del texto en línea/columna (1-based) contando los saltos de línea previos. */
export function offsetToLocation(text: string, offset: number): TextLocation {
  const safe = Math.max(0, Math.min(offset, text.length));
  let line = 1;
  let lineStart = 0;
  for (let i = 0; i < safe; i++) {
    if (text.charCodeAt(i) === 10) {
      line++;
      lineStart = i + 1;
    }
  }
  return { offset: safe, line, column: safe - lineStart + 1 };
}

/** Operación inversa: línea/columna (1-based) a índice del texto. */
export function lineColumnToLocation(text: string, line: number, column: number): TextLocation {
  let offset = 0;
  for (let current = 1; current < line && offset < text.length; offset++) {
    if (text.charCodeAt(offset) === 10) current++;
  }
  return offsetToLocation(text, offset + column - 1);
}
