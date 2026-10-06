"use client";

import { useMemo, useState } from "react";
import type { JsonParseResult } from "../../domain/models/json";
import { diffLinesUseCase } from "../../application/useCases/diffLines";
import { prepareDiffTextUseCase } from "../../application/useCases/prepareDiff";
import { buildDiffRows } from "../utils/diffRows";

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
  const [sortKeys, setSortKeys] = useState(false);
  const hasBoth = left.text.trim() !== "" && right.text.trim() !== "";

  const table = useMemo(() => {
    if (!hasBoth) return null;
    const a = prepareDiffTextUseCase(left.text, left.parsed, sortKeys);
    const b = prepareDiffTextUseCase(right.text, right.parsed, sortKeys);
    return buildDiffRows(diffLinesUseCase(a, b));
  }, [hasBoth, left.text, left.parsed, right.text, right.parsed, sortKeys]);

  return {
    table,
    hasBoth,
    isIdentical: table !== null && table.added === 0 && table.removed === 0,
    comparesRawText: left.parsed.status !== "valid" || right.parsed.status !== "valid",
    sortKeys,
    toggleSortKeys: () => setSortKeys((value) => !value),
    onClose,
  };
}
