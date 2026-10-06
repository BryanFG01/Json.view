"use client";

import { useMemo, useState } from "react";
import type { JsonParseResult, KeyOrder, SortOptions } from "../../domain/models/json";
import { diffLinesUseCase } from "../../application/useCases/diffLines";
import { prepareDiffTextUseCase } from "../../application/useCases/prepareDiff";
import { buildDiffRows } from "../utils/diffRows";
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
  const hasBoth = left.text.trim() !== "" && right.text.trim() !== "";

  const table = useMemo(() => {
    if (!hasBoth) return null;
    const a = prepareDiffTextUseCase(left.text, left.parsed, sort);
    const b = prepareDiffTextUseCase(right.text, right.parsed, sort);
    return buildDiffRows(diffLinesUseCase(a, b));
  }, [hasBoth, left.text, left.parsed, right.text, right.parsed, sort]);

  return {
    table,
    hasBoth,
    isIdentical: table !== null && table.added === 0 && table.removed === 0,
    comparesRawText: left.parsed.status !== "valid" || right.parsed.status !== "valid",
    sort,
    setKeyOrder: (keys: KeyOrder) => setSort((current) => ({ ...current, keys })),
    toggleSortArrays: () => setSort((current) => ({ ...current, arrays: !current.arrays })),
    onClose,
  };
}
