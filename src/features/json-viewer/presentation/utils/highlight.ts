export type TokenType = "key" | "string" | "number" | "keyword" | "punct" | "plain";

export interface Token {
  type: TokenType;
  text: string;
}

/** Por encima de este tamaño no se colorea (el render sería demasiado costoso). */
export const HIGHLIGHT_MAX_CHARS = 200_000;

const KEYWORDS = ["true", "false", "null"];
const PUNCTUATION = "{}[]:,";
const NUMBER_CHARS = /[0-9.eE+-]/;

function readString(text: string, start: number): number {
  let i = start + 1;
  while (i < text.length) {
    const char = text[i];
    if (char === "\\") i += 2;
    else if (char === '"') return i + 1;
    else if (char === "\n") return i;
    else i++;
  }
  return i;
}

function readNumber(text: string, start: number): number {
  let i = start + 1;
  while (i < text.length && NUMBER_CHARS.test(text[i])) i++;
  return i;
}

function isFollowedByColon(text: string, from: number): boolean {
  let i = from;
  while (text[i] === " " || text[i] === "\t") i++;
  return text[i] === ":";
}

function readToken(text: string, i: number): { type: TokenType; end: number } | null {
  const char = text[i];
  if (char === '"') {
    const end = readString(text, i);
    return { type: isFollowedByColon(text, end) ? "key" : "string", end };
  }
  if (char === "-" || (char >= "0" && char <= "9")) return { type: "number", end: readNumber(text, i) };
  const keyword = KEYWORDS.find((word) => text.startsWith(word, i));
  if (keyword) return { type: "keyword", end: i + keyword.length };
  if (PUNCTUATION.includes(char)) return { type: "punct", end: i + 1 };
  return null;
}

/** Tokeniza el texto (válido o no) para pintarlo con colores detrás del textarea. */
export function tokenizeJson(text: string): Token[] {
  if (text.length > HIGHLIGHT_MAX_CHARS) return [{ type: "plain", text }];

  const tokens: Token[] = [];
  let plainStart = 0;
  let i = 0;
  while (i < text.length) {
    const token = readToken(text, i);
    if (!token) {
      i++;
      continue;
    }
    if (i > plainStart) tokens.push({ type: "plain", text: text.slice(plainStart, i) });
    tokens.push({ type: token.type, text: text.slice(i, token.end) });
    i = plainStart = token.end;
  }
  if (plainStart < text.length) tokens.push({ type: "plain", text: text.slice(plainStart) });
  return tokens;
}
