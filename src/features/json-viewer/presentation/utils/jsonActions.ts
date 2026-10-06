import type { IndentOption, JsonParseResult, JsonValue } from "../../domain/models/json";
import { expandNestedJsonUseCase } from "../../application/useCases/expandNestedJson";
import {
  escapeJsonUseCase,
  formatJsonUseCase,
  minifyJsonUseCase,
  unescapeJsonUseCase,
} from "../../application/useCases/transformJson";

interface JsonActionsParams {
  parsed: JsonParseResult;
  indent: IndentOption;
  replace: (text: string) => void;
}

/** Acciones de transformación sobre el JSON actual. Solo actúan si el JSON es válido. */
export function createJsonActions({ parsed, indent, replace }: JsonActionsParams) {
  const value = parsed.status === "valid" ? parsed.value : undefined;

  const apply = (transform: (value: JsonValue) => string | null) => {
    if (value === undefined) return;
    const output = transform(value);
    if (output !== null) replace(output);
  };

  return {
    isValid: value !== undefined,
    canUnescape: typeof value === "string",
    format: () => apply((v) => formatJsonUseCase(v, indent)),
    formatWith: (nextIndent: IndentOption) => apply((v) => formatJsonUseCase(v, nextIndent)),
    expandNested: () => apply((v) => expandNestedJsonUseCase(v, indent)),
    minify: () => apply(minifyJsonUseCase),
    escape: () => apply(escapeJsonUseCase),
    unescape: () => apply((v) => unescapeJsonUseCase(v, indent)),
  };
}
