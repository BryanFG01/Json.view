import type { IndentOption, JsonParseResult, JsonValue, SortOptions } from "../../domain/models/json";
import { expandNestedJsonUseCase } from "../../application/useCases/expandNestedJson";
import { sortJsonUseCase } from "../../application/useCases/sortJson";
import {
  escapeJsonUseCase,
  formatJsonUseCase,
  minifyJsonUseCase,
  unescapeJsonUseCase,
} from "../../application/useCases/transformJson";

interface JsonActionsParams {
  /** Resultado mostrado (puede ir un render por detrás del texto si es grande). */
  parsed: JsonParseResult;
  /** Resultado del texto actual: las acciones nunca operan sobre una versión vieja. */
  current: () => JsonParseResult;
  indent: IndentOption;
  replace: (text: string) => void;
}

/** Acciones de transformación sobre el JSON actual. Solo actúan si el JSON es válido. */
export function createJsonActions({ parsed, current, indent, replace }: JsonActionsParams) {
  const value = parsed.status === "valid" ? parsed.value : undefined;

  const apply = (transform: (value: JsonValue) => string | null) => {
    const latest = current();
    if (latest.status !== "valid") return;
    const output = transform(latest.value);
    if (output !== null) replace(output);
  };

  return {
    isValid: value !== undefined,
    canUnescape: typeof value === "string",
    format: () => apply((v) => formatJsonUseCase(v, indent)),
    formatWith: (nextIndent: IndentOption) => apply((v) => formatJsonUseCase(v, nextIndent)),
    expandNested: () => apply((v) => expandNestedJsonUseCase(v, indent)),
    sort: (options: SortOptions) => apply((v) => sortJsonUseCase(v, options, indent)),
    minify: () => apply(minifyJsonUseCase),
    escape: () => apply(escapeJsonUseCase),
    unescape: () => apply((v) => unescapeJsonUseCase(v, indent)),
  };
}
