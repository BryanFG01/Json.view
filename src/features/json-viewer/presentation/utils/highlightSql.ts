import type { Token, TokenType } from "./highlight";

// Coloreado ligero de SQL para la vista Comparar (el editor usa el parser de CodeMirror).

const KEYWORDS = new Set(
  (
    "select from where and or not in is null as on join left right inner outer full cross group by order having " +
    "limit offset fetch top insert into values update set delete merge create table alter drop index view with " +
    "union all distinct case when then else end exists between like ilike asc desc primary key foreign references " +
    "default begin commit rollback returning over partition true false if declare cast using"
  ).split(" "),
);

const WORD = /^[A-Za-z_][\w$]*/;
const NUMBER = /^\d+(?:\.\d+)?/;
const PUNCT = "(),;.=<>!+-*/%|";

function closingOf(text: string, start: number, close: string): number {
  let i = start + 1;
  while (i < text.length) {
    if (text[i] === close && text[i + 1] === close) i += 2;
    else if (text[i] === close) return i + 1;
    else i++;
  }
  return text.length;
}

function readToken(text: string, i: number): { type: TokenType; end: number } {
  const char = text[i];
  const rest = text.slice(i);
  if (rest.startsWith("--")) return { type: "comment", end: text.length };
  if (rest.startsWith("/*")) {
    const end = text.indexOf("*/", i + 2);
    return { type: "comment", end: end === -1 ? text.length : end + 2 };
  }
  if (char === "'") return { type: "string", end: closingOf(text, i, "'") };
  if (char === '"' || char === "`") return { type: "key", end: closingOf(text, i, char) };
  if (char === "[") return { type: "key", end: closingOf(text, i, "]") };
  const number = NUMBER.exec(rest);
  if (number) return { type: "number", end: i + number[0].length };
  const word = WORD.exec(rest);
  if (word) return { type: KEYWORDS.has(word[0].toLowerCase()) ? "keyword" : "plain", end: i + word[0].length };
  return { type: PUNCT.includes(char) ? "punct" : "plain", end: i + 1 };
}

/** Tokeniza una línea de SQL para pintarla con los mismos colores que el editor. */
export function tokenizeSql(text: string): Token[] {
  const tokens: Token[] = [];
  for (let i = 0; i < text.length; ) {
    const { type, end } = readToken(text, i);
    const last = tokens[tokens.length - 1];
    if (last && last.type === type && type === "plain") last.text += text.slice(i, end);
    else tokens.push({ type, text: text.slice(i, end) });
    i = end;
  }
  return tokens;
}
