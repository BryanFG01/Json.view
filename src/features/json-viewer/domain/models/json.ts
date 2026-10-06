export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type JsonKind = "object" | "array" | "string" | "number" | "boolean" | "null";

export type IndentOption = "2" | "4" | "tab";

export type ViewMode = "editor" | "tree";

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
