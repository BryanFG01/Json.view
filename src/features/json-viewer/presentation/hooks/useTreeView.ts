"use client";

import { useMemo, useState } from "react";
import type { JsonParseResult } from "../../domain/models/json";
import { buildTree } from "../utils/jsonTree";

const DEFAULT_OPEN_DEPTH = 2;

export function useTreeView(parsed: JsonParseResult) {
  const [openDepth, setOpenDepth] = useState(DEFAULT_OPEN_DEPTH);
  // Cambiar la key remonta los <details> para que respeten el nuevo `open` inicial.
  const [version, setVersion] = useState(0);

  const root = useMemo(
    () => (parsed.status === "valid" ? buildTree(parsed.value, { openDepth }) : null),
    [parsed, openDepth],
  );

  const setDepth = (depth: number) => {
    setOpenDepth(depth);
    setVersion((v) => v + 1);
  };

  return {
    root,
    treeKey: String(version),
    error: parsed.status === "invalid" ? parsed.error : null,
    isEmpty: parsed.status === "empty",
    expandAll: () => setDepth(Infinity),
    collapseAll: () => setDepth(1),
  };
}
