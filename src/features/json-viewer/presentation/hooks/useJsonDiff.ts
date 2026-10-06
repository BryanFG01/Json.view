"use client";

import { useMemo, useState } from "react";
import type { JsonParseResult, KeyOrder, SortOptions } from "../../domain/models/json";
import { diffLinesUseCase } from "../../application/useCases/diffLines";
import { prepareDiffTextUseCase } from "../../application/useCases/prepareDiff";
import { buildDiffRows } from "../utils/diffRows";
import { buildDiffView, DIFF_PAGE, DIFF_REVEAL_STEP } from "../utils/diffView";
import { DEFAULT_DIFF_SORT } from "../utils/sortOptions.constants";

interface DiffSide {
  text: string;
  parsed: JsonParseResult;
}

export interface JsonDiffProps {
  left: DiffSide;
  right: DiffSide;
  onClose: () => void;
}

export function useJsonDiff({ left, right, onClose }: JsonDiffProps) {
  const [sort, setSort] = useState<SortOptions>(DEFAULT_DIFF_SORT);
  const [revealed, setRevealed] = useState<Record<string, number>>({});
  const [limit, setLimit] = useState(DIFF_PAGE);
  const hasBoth = left.text.trim() !== "" && right.text.trim() !== "";

  const table = useMemo(() => {
    if (!hasBoth) return null;
    const a = prepareDiffTextUseCase(left.text, left.parsed, sort);
    const b = prepareDiffTextUseCase(right.text, right.parsed, sort);
    return buildDiffRows(diffLinesUseCase(a, b));
  }, [hasBoth, left.text, left.parsed, right.text, right.parsed, sort]);

  const view = useMemo(() => (table ? buildDiffView(table.rows, revealed, limit) : null), [table, revealed, limit]);

  const changeSort = (next: SortOptions) => {
    setSort(next);
    setRevealed({});
    setLimit(DIFF_PAGE);
  };

  return {
    table,
    view,
    hasBoth,
    isIdentical: table !== null && table.added === 0 && table.removed === 0,
    comparesRawText: left.parsed.status !== "valid" || right.parsed.status !== "valid",
    sort,
    setKeyOrder: (keys: KeyOrder) => changeSort({ ...sort, keys }),
    toggleSortArrays: () => changeSort({ ...sort, arrays: !sort.arrays }),
    revealGap: (id: string) => setRevealed((r) => ({ ...r, [id]: (r[id] ?? 0) + DIFF_REVEAL_STEP })),
    showMore: () => setLimit((l) => l + DIFF_PAGE),
    onClose,
  };
}
