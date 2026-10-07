"use client";

import { useMemo, useState } from "react";
import type { DocLanguage, JsonParseResult, KeyOrder, SortOptions, SqlDialect } from "../../domain/models/json";
import { diffLinesUseCase } from "../../application/useCases/diffLines";
import { prepareDiffTextUseCase } from "../../application/useCases/prepareDiff";
import { buildDiffRows } from "../utils/diffRows";
import { buildDiffView, DIFF_PAGE, DIFF_REVEAL_STEP } from "../utils/diffView";
import { tokenizeJson } from "../utils/highlight";
import { tokenizeSql } from "../utils/highlightSql";
import { DEFAULT_DIFF_SORT } from "../utils/sortOptions.constants";
import { useSqlNormalized } from "./useSqlNormalized";

interface DiffSide {
  text: string;
  parsed: JsonParseResult;
  language: DocLanguage;
  dialect: SqlDialect;
}

export interface JsonDiffProps {
  left: DiffSide;
  right: DiffSide;
  onClose: () => void;
}

/** "json": ambos JSON · "sql": ambos SQL · "mixed": uno de cada (se compara el texto tal cual). */
export type DiffMode = "json" | "sql" | "mixed";

const modeOf = (left: DiffSide, right: DiffSide): DiffMode =>
  left.language !== right.language ? "mixed" : left.language;

const IDENTICAL_MESSAGE: Record<DiffMode, string> = {
  json: "Los dos JSON son idénticos.",
  sql: "Las dos consultas SQL son iguales.",
  mixed: "Los dos textos son idénticos.",
};

/** Aviso en la cabecera: por qué se compara el texto tal cual. */
function diffNotice(mode: DiffMode, invalidJson: boolean): { text: string; tone: "error" | "info" } | null {
  if (mode === "mixed") return { text: "Un panel es JSON y el otro SQL: se compara el texto tal cual", tone: "info" };
  if (invalidJson) return { text: "Uno de los JSON no es válido: se compara el texto tal cual", tone: "error" };
  return null;
}

export function useJsonDiff({ left, right, onClose }: JsonDiffProps) {
  const [sort, setSort] = useState<SortOptions>(DEFAULT_DIFF_SORT);
  const [normalizeSql, setNormalizeSql] = useState(true);
  const [revealed, setRevealed] = useState<Record<string, number>>({});
  const [limit, setLimit] = useState(DIFF_PAGE);
  const mode = modeOf(left, right);
  const hasBoth = left.text.trim() !== "" && right.text.trim() !== "";
  const sqlNormalized = useSqlNormalized(mode === "sql" && normalizeSql && hasBoth, left, right);

  const table = useMemo(() => {
    if (!hasBoth) return null;
    if (mode === "sql") {
      return buildDiffRows(diffLinesUseCase(sqlNormalized?.left ?? left.text, sqlNormalized?.right ?? right.text));
    }
    const a = mode === "json" ? prepareDiffTextUseCase(left.text, left.parsed, sort) : left.text;
    const b = mode === "json" ? prepareDiffTextUseCase(right.text, right.parsed, sort) : right.text;
    return buildDiffRows(diffLinesUseCase(a, b));
  }, [hasBoth, mode, sqlNormalized, left.text, left.parsed, right.text, right.parsed, sort]);

  const tokenize = mode === "json" ? tokenizeJson : tokenizeSql;
  const view = useMemo(() => (table ? buildDiffView(table.rows, revealed, limit, tokenize) : null), [table, revealed, limit, tokenize]);

  const reset = () => {
    setRevealed({});
    setLimit(DIFF_PAGE);
  };
  const changeSort = (next: SortOptions) => {
    setSort(next);
    reset();
  };

  return {
    mode,
    table,
    view,
    hasBoth,
    isIdentical: table !== null && table.added === 0 && table.removed === 0,
    notice: diffNotice(mode, hasBoth && mode === "json" && (left.parsed.status !== "valid" || right.parsed.status !== "valid")),
    identicalMessage: IDENTICAL_MESSAGE[mode],
    sort,
    setKeyOrder: (keys: KeyOrder) => changeSort({ ...sort, keys }),
    toggleSortArrays: () => changeSort({ ...sort, arrays: !sort.arrays }),
    normalizeSql,
    toggleNormalizeSql: () => {
      setNormalizeSql((value) => !value);
      reset();
    },
    revealGap: (id: string) => setRevealed((r) => ({ ...r, [id]: (r[id] ?? 0) + DIFF_REVEAL_STEP })),
    showMore: () => setLimit((l) => l + DIFF_PAGE),
    onClose,
  };
}
