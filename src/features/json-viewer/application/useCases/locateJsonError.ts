// Escáner JSON estricto que solo busca DÓNDE falla el texto. Se usa cuando el mensaje
// de JSON.parse no trae "position N" (p. ej. comas finales o tokens sueltos en V8).

interface Cursor {
  text: string;
  i: number;
}

class Stop {
  constructor(readonly offset: number) {}
}

const WHITESPACE = " \t\n\r";
const SIMPLE_ESCAPES = "\"\\/bfnrt";
const KEYWORDS = ["true", "false", "null"];
const NUMBER_RE = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;
const HEX4_RE = /^[0-9a-fA-F]{4}$/;

const fail = (c: Cursor, offset = c.i): never => {
  throw new Stop(offset);
};

function skipWhitespace(c: Cursor) {
  while (c.i < c.text.length && WHITESPACE.includes(c.text[c.i])) c.i++;
}

function expect(c: Cursor, char: string) {
  skipWhitespace(c);
  if (c.text[c.i] !== char) fail(c);
  c.i++;
}

function readEscape(c: Cursor) {
  const next = c.text[c.i + 1];
  if (next === "u") {
    if (!HEX4_RE.test(c.text.slice(c.i + 2, c.i + 6))) fail(c, c.i + 1);
    c.i += 6;
  } else {
    if (next === undefined || !SIMPLE_ESCAPES.includes(next)) fail(c, c.i + 1);
    c.i += 2;
  }
}

function readString(c: Cursor) {
  c.i++;
  while (c.i < c.text.length) {
    const char = c.text[c.i];
    if (char === '"') return void c.i++;
    if (char === "\\") readEscape(c);
    else if (char < " ") fail(c);
    else c.i++;
  }
  fail(c);
}

function readNumber(c: Cursor) {
  NUMBER_RE.lastIndex = c.i;
  const match = NUMBER_RE.exec(c.text);
  if (!match) fail(c);
  c.i += match![0].length;
}

function readContainer(c: Cursor, close: string, readItem: () => void) {
  c.i++;
  skipWhitespace(c);
  if (c.text[c.i] === close) return void c.i++;
  for (;;) {
    readItem();
    skipWhitespace(c);
    if (c.text[c.i] !== ",") return expect(c, close);
    c.i++;
  }
}

function readValue(c: Cursor): void {
  skipWhitespace(c);
  const char = c.text[c.i];
  if (char === "{") return readContainer(c, "}", () => readMember(c));
  if (char === "[") return readContainer(c, "]", () => readValue(c));
  if (char === '"') return readString(c);
  if (char === "-" || (char >= "0" && char <= "9")) return readNumber(c);
  const keyword = KEYWORDS.find((word) => c.text.startsWith(word, c.i));
  if (!keyword) fail(c);
  c.i += keyword!.length;
}

function readMember(c: Cursor) {
  skipWhitespace(c);
  if (c.text[c.i] !== '"') fail(c);
  readString(c);
  expect(c, ":");
  readValue(c);
}

/** Devuelve el índice del primer error de sintaxis, o null si el texto es JSON válido. */
export function locateJsonError(text: string): number | null {
  const cursor: Cursor = { text, i: 0 };
  try {
    readValue(cursor);
    skipWhitespace(cursor);
    return cursor.i < text.length ? cursor.i : null;
  } catch (error) {
    if (error instanceof Stop) return error.offset;
    return null;
  }
}
