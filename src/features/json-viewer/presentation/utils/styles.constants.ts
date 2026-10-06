import type { JsonKind } from "../../domain/models/json";
import type { DiffCellKind } from "./diffRows";
import type { TokenType } from "./highlight";

export const TOKEN_CLASS: Record<TokenType, string> = {
  key: "text-tok-key",
  string: "text-tok-string",
  number: "text-tok-number",
  keyword: "text-tok-keyword",
  punct: "text-tok-punct",
  plain: "",
};

export const KIND_CLASS: Record<JsonKind, string> = {
  object: "text-muted",
  array: "text-muted",
  string: "text-tok-string",
  number: "text-tok-number",
  boolean: "text-tok-keyword",
  null: "text-tok-keyword",
};

export type StatusTone = "ok" | "error" | "idle";

export const TONE_CLASS: Record<StatusTone, string> = {
  ok: "text-ok",
  error: "text-err",
  idle: "text-muted",
};

export const DIFF_CELL_CLASS: Record<DiffCellKind, string> = {
  equal: "",
  removed: "bg-err/15",
  added: "bg-ok/15",
  empty: "bg-[repeating-linear-gradient(135deg,var(--border)_0_1px,transparent_1px_7px)]",
};

export const DIFF_SIGN: Record<DiffCellKind, string> = {
  equal: " ",
  removed: "−",
  added: "+",
  empty: " ",
};
