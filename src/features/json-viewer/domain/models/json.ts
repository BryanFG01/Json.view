export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type JsonKind = "object" | "array" | "string" | "number" | "boolean" | "null";

export type IndentOption = "2" | "4" | "tab";

export type ViewMode = "editor" | "tree";

/** Orden de las claves de los objetos: tal cual, A→Z o Z→A (orden natural: "item2" < "item10"). */
export type KeyOrder = "original" | "asc" | "desc";

export interface SortOptions {
  keys: KeyOrder;
  /** Ordena también los elementos de los arrays (números por valor, textos en orden natural). */
  arrays: boolean;
}

export interface TextLocation {
  offset: number;
  line: number;
  column: number;
}

export interface JsonSyntaxError {
  message: string;
  location: TextLocation | null;
}

export type JsonParseResult =
  | { status: "empty" }
  | { status: "valid"; value: JsonValue }
  | { status: "invalid"; error: JsonSyntaxError };
